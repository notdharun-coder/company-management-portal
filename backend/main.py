import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import Base, engine
from routes.auth import router as auth_router
from routes.companies import router as companies_router

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Company Management Portal API")

#frontend_origin = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")
frontend_origin = os.getenv("FRONTEND_ORIGIN")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(companies_router)


@app.get("/health")
def health_check():
    return {"status": "ok"}
