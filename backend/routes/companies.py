from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from database import get_db
from models import Company
from routes.auth import get_current_user
from schemas import (
    BulkCreateResponse,
    CompanyCreate,
    CompanyListResponse,
    CompanyRead,
    CompanyStatsResponse,
)

router = APIRouter(
    prefix="/companies",
    tags=["companies"],
    dependencies=[Depends(get_current_user)],
)

DUPLICATE_FIELDS = (
    ("company_name", Company.company_name, "Company name"),
    ("email", Company.email, "Company email"),
    ("phone", Company.phone, "Company phone number"),
)


def clean_company_payload(company: CompanyCreate) -> dict:
    website = (company.website or "").strip()
    if website and not website.startswith(("http://", "https://")):
        website = f"https://{website}"

    return {
        "company_name": company.company_name.strip(),
        "email": company.email.lower() if company.email else None,
        "phone": company.phone.strip() if company.phone else None,
        "address": company.address.strip() if company.address else None,
        "industry": company.industry.strip(),
        "website": website or None,
    }


def duplicate_detail(field: str, label: str, value: str, company: Company) -> dict:
    return {
        "field": field,
        "value": value,
        "company_id": company.id,
        "company_name": company.company_name,
        "message": f'{label} already exists in the company "{company.company_name}".',
    }


def reject_duplicate_payload(companies: list[CompanyCreate]) -> None:
    seen = {field: {} for field, _, _ in DUPLICATE_FIELDS}
    for index, company in enumerate(companies):
        payload = clean_company_payload(company)
        for field, _, label in DUPLICATE_FIELDS:
            if not payload[field]:
                continue
            value = payload[field].lower()
            if value in seen[field]:
                raise HTTPException(
                    status_code=400,
                    detail={
                        "field": field,
                        "value": payload[field],
                        "message": f"{label} already used in Company {seen[field][value] + 1}.",
                    },
                )
            seen[field][value] = index


def reject_existing_duplicate(
    db: Session,
    payload: dict,
    exclude_company_id: int | None = None,
) -> None:
    for field, column, label in DUPLICATE_FIELDS:
        if not payload[field]:
            continue
        statement = select(Company).where(func.lower(column) == payload[field].lower())
        if exclude_company_id is not None:
            statement = statement.where(Company.id != exclude_company_id)
        duplicate_company = db.scalar(statement)
        if duplicate_company:
            raise HTTPException(
                status_code=409,
                detail=duplicate_detail(field, label, payload[field], duplicate_company),
            )


@router.get("", response_model=CompanyListResponse)
def list_companies(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    search: str | None = None,
    industry: str | None = None,
    db: Session = Depends(get_db),
):
    filters = []
    if search:
        term = f"%{search.strip()}%"
        filters.append(
            or_(
                Company.company_name.ilike(term),
                Company.email.ilike(term),
                Company.industry.ilike(term),
            )
        )
    if industry:
        filters.append(Company.industry == industry.strip())

    total_statement = select(func.count()).select_from(Company)
    statement = select(Company).order_by(Company.created_at.desc())
    if filters:
        total_statement = total_statement.where(*filters)
        statement = statement.where(*filters)

    total = db.scalar(total_statement) or 0
    companies = db.scalars(statement.offset((page - 1) * limit).limit(limit)).all()
    return {"items": companies, "total": total, "page": page, "limit": limit}


@router.get("/stats", response_model=CompanyStatsResponse)
def company_stats(db: Session = Depends(get_db)):
    total = db.scalar(select(func.count()).select_from(Company)) or 0
    private_sector = db.scalar(
        select(func.count()).select_from(Company).where(Company.industry == "Private sector")
    ) or 0
    government = db.scalar(
        select(func.count()).select_from(Company).where(Company.industry == "Government")
    ) or 0
    websites = db.scalar(
        select(func.count()).select_from(Company).where(Company.website.is_not(None), Company.website != "")
    ) or 0

    return {
        "total": total,
        "private_sector": private_sector,
        "government": government,
        "websites": websites,
    }


@router.post("/bulk", response_model=BulkCreateResponse, status_code=status.HTTP_201_CREATED)
def create_companies(companies: list[CompanyCreate], db: Session = Depends(get_db)):
    if not companies:
        raise HTTPException(status_code=400, detail="At least one company is required.")

    reject_duplicate_payload(companies)
    for company in companies:
        reject_existing_duplicate(db, clean_company_payload(company))

    rows = [
        Company(**clean_company_payload(company))
        for company in companies
    ]

    try:
        db.add_all(rows)
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="A company with these details already exists.") from exc

    for row in rows:
        db.refresh(row)

    return {"message": f"{len(rows)} companies saved!", "saved": len(rows), "items": rows}


@router.put("/{company_id}", response_model=CompanyRead)
def update_company(company_id: int, company_data: CompanyCreate, db: Session = Depends(get_db)):
    company = db.get(Company, company_id)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found.")

    payload = clean_company_payload(company_data)
    reject_existing_duplicate(db, payload, exclude_company_id=company_id)

    for field, value in payload.items():
        setattr(company, field, value)

    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="A company with these details already exists.") from exc

    db.refresh(company)
    return company


@router.delete("/{company_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_company(company_id: int, db: Session = Depends(get_db)):
    company = db.get(Company, company_id)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found.")

    db.delete(company)
    db.commit()
