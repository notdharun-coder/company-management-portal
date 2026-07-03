from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class CompanyBase(BaseModel):
    company_name: str = Field(..., min_length=1, max_length=255)
    email: EmailStr
    phone: str = Field(..., min_length=1, max_length=20)
    address: str = Field(..., min_length=1)
    industry: str = Field(..., min_length=1, max_length=100)
    website: str = Field(..., min_length=1, max_length=255)


class CompanyCreate(CompanyBase):
    pass


class CompanyRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    company_name: str
    email: EmailStr
    phone: str | None = None
    address: str | None = None
    industry: str | None = None
    website: str | None = None
    created_at: datetime


class CompanyListResponse(BaseModel):
    items: list[CompanyRead]
    total: int
    page: int
    limit: int


class CompanyStatsResponse(BaseModel):
    total: int
    private_sector: int
    government: int
    websites: int


class BulkCreateResponse(BaseModel):
    message: str
    saved: int
    items: list[CompanyRead]


class UserCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=128)


class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1, max_length=128)


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: EmailStr


class LoginResponse(UserRead):
    access_token: str
    token_type: str = "bearer"
