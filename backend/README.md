# Flatly Backend + AI Brain

Flatly is a shared-living backend for students and young professionals in India, featuring:
- **FIND Mode**: Listings, roommate matching, deterministic lifestyle compatibility scoring.
- **LIVE Mode**: Expenses split, greedy settle-up minimization, chore rotations, 30-day fairness stats, and house rules.
- **AI Brain**: Local LLM integration (Ollama with `qwen2.5:1.5b`) for match explanations, house rule drafting, polite complaint rewriting, light Hinglish weekly summaries, and move-in/out condition differences.

---

## 🛠 Tech Stack
- **Python 3.11+ / 3.12**
- **FastAPI** + **Pydantic v2**
- **SQLAlchemy 2.0** + **Alembic** migrations
- **SQLite** for development, Postgres-ready via `DATABASE_URL`
- **JWT Authentication** (email + bcrypt)
- **Local LLM**: Ollama (`qwen2.5:1.5b`), provider-agnostic `LLMClient`
- **Pytest** with comprehensive unit & integration tests

---

## 🚀 Setup Instructions

### 1. Prerequisites
- Python 3.11 or 3.12 installed
- Ollama installed with `qwen2.5:1.5b`:
```bash
ollama run qwen2.5:1.5b
```

### 2. Virtual Environment & Dependencies
```bash
cd backend
python3.12 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 3. Environment Configuration
Copy the `.env.example` file:
```bash
cp .env.example .env
```
Default `.env` configuration:
```ini
DATABASE_URL=sqlite:///./flatly.db
JWT_SECRET=super-secret-key-change-this-in-production-flatly
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080
CORS_ORIGINS=http://localhost:3000

# Local Ollama with Qwen 2.5 1.5B
LLM_PROVIDER=ollama
LLM_BASE_URL=http://127.0.0.1:11434
LLM_API_KEY=ollama
LLM_MODEL=qwen2.5:1.5b
AI_RATE_LIMIT_PER_MINUTE=20
```

### 4. Database Migrations
Run Alembic migrations to initialize the schema:
```bash
alembic upgrade head
```

### 5. Optional Dev Seed Data
Populate realistic Indian flatmate data (users, habits, flat, expenses, chores, rules, listing):
```bash
python scripts/seed.py
```
*Note: Seed script is strictly manual and optional; never run automatically.*

### 6. Run the Development Server
```bash
uvicorn app.main:app --reload --port 8000
```
- API Documentation (Swagger UI): [http://localhost:8000/docs](http://localhost:8000/docs)
- OpenAPI Specification: `openapi.json` is exported to root on startup.

---

## 🧪 Running Tests
```bash
PYTHONPATH=. pytest
```
All 15 unit and integration tests will run:
- Deterministic net balances and exact sum zero guarantees
- Greedy settle-up minimization
- Chore rotation wrap-around & 30-day fairness stats
- Compatibility scoring with hard smoking dealbreaker cap (capped at 40)
- End-to-end integration flows (Auth, Flats, Expenses, Balances, Chores, Rules, Listings)
- AI endpoint contract and graceful fallbacks when LLM is offline

---

## 📡 Example cURL Commands

### 1. Signup
```bash
curl -X POST http://localhost:8000/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Aarav Sharma",
    "email": "aarav@flatly.app",
    "password": "password123",
    "habits": {
      "sleep_time": "normal",
      "cleanliness": 4,
      "guests": "sometimes",
      "food": "veg",
      "smoking": "no",
      "noise_tolerance": 3,
      "wfh": true
    }
  }'
```

### 2. Login
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "aarav@flatly.app",
    "password": "password123"
  }'
```

### 3. Create a Flat
```bash
curl -X POST http://localhost:8000/api/v1/flats \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Palm Meadows 404",
    "address": "Indiranagar, Bengaluru",
    "rent_total": 54000.0
  }'
```

### 4. Add an Expense
```bash
curl -X POST http://localhost:8000/api/v1/flats/1/expenses \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Groceries",
    "amount": 3000.0,
    "paid_by": 1,
    "split_among": [1, 2, 3],
    "split_type": "equal",
    "category": "Groceries"
  }'
```

### 5. Get Balances & Minimized Settle-up Transfers
```bash
curl -X GET http://localhost:8000/api/v1/flats/1/balances \
  -H "Authorization: Bearer <TOKEN>"
```

### 6. AI: Polite Rewrite
```bash
curl -X POST http://localhost:8000/api/v1/ai/polite-rewrite \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "complaint_text": "Who left the dirty dishes in the sink again? Clean it right now!"
  }'
```

### 7. AI: Weekly Summary (Light Hinglish)
```bash
curl -X GET http://localhost:8000/api/v1/ai/weekly-summary/1 \
  -H "Authorization: Bearer <TOKEN>"
```

---

## 🚫 What is Intentionally Not Done
To keep the backend focused, clean, and reliable, the following features are intentionally deferred:
1. **Payments / Real UPI Gateway Integration**: Settlements calculate balances and suggest transfers; actual banking/UPI payment initiation (Razorpay/Cashfree/UPI deep links) is deferred.
2. **Push / Realtime Notifications**: WebSockets / FCM / SMS alerts are not implemented; client polling or webhooks can be hooked in future.
3. **Cloud File Storage for Photos**: Condition diff takes text notes or image URLs; direct S3/GCS multipart photo bucket uploads are not implemented.
4. **Email Verification / Password Reset**: JWT auth with bcrypt is implemented; OTP / SMTP verification flows are deferred.

