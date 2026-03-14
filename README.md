# CoreInventory 🏭

A modular Inventory Management System built with **FastAPI + React + Supabase**.

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 18 + TypeScript + Tailwind CSS |
| Backend | FastAPI + Python |
| ORM | SQLAlchemy |
| Database | PostgreSQL (Supabase) |
| Auth | JWT (python-jose) |
| State | Zustand |

---

## Setup Instructions

### 1. Supabase Setup
1. Go to [supabase.com](https://supabase.com) → New Project
2. Go to **Settings → Database** → copy the **Connection String (URI)**
3. Replace `[YOUR-PASSWORD]` with your DB password

---

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate        # Mac/Linux
venv\Scripts\activate           # Windows

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env and fill in your DATABASE_URL and SECRET_KEY

# Run the server
uvicorn app.main:app --reload --port 8000
```

API docs available at: **http://localhost:8000/docs**

---

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Run dev server
npm run dev
```

App runs at: **http://localhost:5173**

---

## Project Structure

```
CoreInventory/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app entry
│   │   ├── core/
│   │   │   ├── config.py        # Settings
│   │   │   ├── security.py      # JWT + bcrypt
│   │   │   └── deps.py          # Auth dependency
│   │   ├── db/
│   │   │   └── database.py      # SQLAlchemy engine
│   │   ├── models/
│   │   │   └── models.py        # All DB models
│   │   └── api/routes/
│   │       ├── auth.py
│   │       ├── products.py
│   │       ├── receipts.py
│   │       ├── deliveries.py
│   │       ├── transfers.py
│   │       ├── adjustments.py
│   │       ├── dashboard.py
│   │       └── warehouses.py
│   ├── requirements.txt
│   └── .env.example
│
└── frontend/
    └── src/
        ├── App.tsx
        ├── pages/               # One page per module
        ├── components/layout/   # Sidebar + Layout
        ├── store/               # Zustand auth store
        └── utils/api.ts         # Axios instance
```

---

## Features

- ✅ Auth (Register / Login / JWT)
- ✅ Dashboard with live KPIs
- ✅ Product Management (SKU, Category, Reorder Level)
- ✅ Receipts — incoming stock with auto stock update
- ✅ Delivery Orders — outgoing stock with stock validation
- ✅ Internal Transfers — between warehouses
- ✅ Stock Adjustments — fix physical count mismatches
- ✅ Move History — full stock ledger
- ✅ Multi-warehouse support
- ✅ Low stock alerts
- ✅ Auto Swagger docs at `/docs`
