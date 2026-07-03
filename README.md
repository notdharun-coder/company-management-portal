# Company Management Portal

A full-stack web application for managing company records — add, search, edit, and delete — with secure login-based access, built to replace manual spreadsheet tracking.

**Tech Stack:** React · FastAPI · MySQL · JWT Authentication

---

## Features

- 🔐 **Secure Authentication** — signup/login with PBKDF2-HMAC-SHA256 password hashing (salted, 120,000 iterations) and JWT-based sessions
- 📊 **Dashboard** — live summary cards for total companies, sector breakdown, and website coverage
- 🔍 **Search & Filter** — live search across name, email, and industry, with server-side pagination
- ➕ **Bulk & Single Add** — add one or many companies at once, with automatic duplicate detection (name/email/phone) across both new and existing records
- ✏️ **Full CRUD** — edit and delete existing company records
- 🛡️ **Protected Routes** — all data endpoints require a valid JWT; client-side routing (`/home`, `/company`) redirects based on login state

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, React Router DOM, Axios, Vite |
| Backend | FastAPI, SQLAlchemy ORM, Pydantic |
| Database | MySQL |
| Auth & Security | JWT (python-jose), PBKDF2-HMAC-SHA256 password hashing |

## Project Structure

```text
company-portal/
  backend/        FastAPI API with SQLAlchemy and PyMySQL
    routes/       auth and company endpoints
    models.py     SQLAlchemy ORM models (User, Company)
    schemas.py    Pydantic request/response validation
  frontend/       React app built with Vite
    src/components/
  db/             MySQL schema
```

## API Overview

| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/signup` | Register a new user |
| POST | `/auth/login` | Authenticate and receive a JWT |
| GET | `/companies` | List companies (paginated, searchable) |
| GET | `/companies/stats` | Dashboard summary stats |
| POST | `/companies/bulk` | Add one or more companies |
| PUT | `/companies/{id}` | Edit a company record |
| DELETE | `/companies/{id}` | Remove a company record |

## Getting Started

### Prerequisites
- Python 3.11, 3.12, or 3.13 (3.14 currently breaks the `pydantic-core` install)
- Node.js + npm
- MySQL Server running locally

### Backend

```bash
cd backend
python3.12 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill in your MySQL credentials and JWT_SECRET
python run_server.py
```

### Database

```bash
mysql -u root -p < db/schema.sql
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

By default, the backend runs on `http://localhost:8000` and the frontend on `http://localhost:5173`.

## Security Notes

- Passwords are never stored in plain text — hashed with PBKDF2-HMAC-SHA256 using a unique random salt per user
- Password comparison uses a constant-time check to prevent timing attacks
- JWTs are signed (HS256) and expire after 24 hours; all `/companies` routes require a valid token
- CORS is restricted to the configured frontend origin

## Roadmap

- [ ] Refresh-token flow
- [ ] Role-based access control
- [ ] Automated test suite

## Author

**Dharun** — [GitHub](https://github.com/notdharun-coder) · [LinkedIn](https://linkedin.com/in/notdharun-coder)
