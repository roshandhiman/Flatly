# API Contract (Flatly Backend v1)

Base URL: `http://localhost:8000/api/v1`  
Interactive Docs: `http://localhost:8000/docs`  
OpenAPI Schema: `openapi.json` (exported at repository root)

---

## Standard Response Conventions
- All authenticated requests require header: `Authorization: Bearer <access_token>`
- Validation errors return HTTP `422 Unprocessable Entity` in standard format:
```json
{
  "detail": "Validation error",
  "errors": [
    {
      "field": "body -> habits -> cleanliness",
      "message": "Input should be less than or equal to 5",
      "type": "less_than_equal"
    }
  ]
}
```

---

## 1. Auth & Profile Endpoints

### POST `/auth/signup`
Creates a user account and returns an access token.
- **Request Body**:
```json
{
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
}
```
- **Response `201 Created`**:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "name": "Aarav Sharma",
    "email": "aarav@flatly.app",
    "habits": { ... },
    "created_at": "2026-11-02T05:30:00"
  }
}
```

### POST `/auth/login`
- **Request Body**:
```json
{
  "email": "aarav@flatly.app",
  "password": "password123"
}
```
- **Response `200 OK`**:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "user": { ... }
}
```

### GET `/auth/me`
- **Headers**: `Authorization: Bearer <token>`
- **Response `200 OK`**:
```json
{
  "id": 1,
  "name": "Aarav Sharma",
  "email": "aarav@flatly.app",
  "habits": { ... },
  "created_at": "2026-11-02T05:30:00"
}
```

### PUT `/users/me/habits`
Updates the user's living habits.
- **Request Body**:
```json
{
  "habits": {
    "sleep_time": "late",
    "cleanliness": 5,
    "guests": "often",
    "food": "non_veg",
    "smoking": "outside_only",
    "noise_tolerance": 4,
    "wfh": false
  }
}
```
- **Response `200 OK`**: User object with updated habits.

---

## 2. Flats & Members Endpoints

### POST `/flats`
Create a flat. The creator is automatically added as admin member.
- **Request Body**:
```json
{
  "name": "Palm Meadows 404",
  "address": "12th Main, Indiranagar, Bengaluru",
  "rent_total": 54000.0
}
```
- **Response `201 Created`**:
```json
{
  "id": 1,
  "name": "Palm Meadows 404",
  "address": "12th Main, Indiranagar, Bengaluru",
  "rent_total": 54000.0,
  "invite_code": "IND404",
  "created_by": 1,
  "created_at": "2026-11-02T05:30:00",
  "members": [
    {
      "id": 1,
      "flat_id": 1,
      "user_id": 1,
      "name": "Aarav Sharma",
      "role": "admin",
      "joined_at": "2026-11-02T05:30:00"
    }
  ]
}
```

### GET `/flats/{id}`
Returns flat details and members list. Must be a flat member.

### POST `/flats/join`
Join a flat using the 6-character unique invite code.
- **Request Body**:
```json
{
  "invite_code": "IND404"
}
```

### POST `/flats/{id}/members`
Add a member by name only (without user account).
- **Request Body**:
```json
{
  "name": "Kabir"
}
```

### DELETE `/flats/{id}/members/{member_id}`
Removes a member from flat (admin only, or leaving member).

---

## 3. Expenses & Balances

### POST `/flats/{id}/expenses`
Add an expense.
- **Equal Split Example**:
```json
{
  "title": "Groceries",
  "amount": 3000.0,
  "paid_by": 1,
  "split_among": [1, 2, 3],
  "split_type": "equal",
  "category": "Groceries"
}
```
- **Custom Split Example**:
```json
{
  "title": "Electricity Bill",
  "amount": 1500.0,
  "paid_by": 1,
  "split_among": [1, 2],
  "split_type": "custom",
  "custom_shares": {
    "1": 500.0,
    "2": 1000.0
  },
  "category": "Utilities"
}
```

### GET `/flats/{id}/expenses`
List expenses for the flat, newest first.

### DELETE `/flats/{id}/expenses/{expense_id}`
Deletes an expense.

### GET `/flats/{id}/balances`
Returns net balances for all members (exact sum zero guarantee) + greedy minimized settle-up transfers.
- **Response `200 OK`**:
```json
{
  "balances": [
    {
      "member_id": 1,
      "name": "Aarav Sharma",
      "net_balance": 2000.0,
      "total_paid": 3000.0,
      "total_owed": 1000.0
    },
    {
      "member_id": 2,
      "name": "Rohan Verma",
      "net_balance": -1000.0,
      "total_paid": 0.0,
      "total_owed": 1000.0
    },
    {
      "member_id": 3,
      "name": "Priya Nair",
      "net_balance": -1000.0,
      "total_paid": 0.0,
      "total_owed": 1000.0
    }
  ],
  "suggested_settlements": [
    {
      "from_member": 2,
      "to_member": 1,
      "from_name": "Rohan Verma",
      "to_name": "Aarav Sharma",
      "amount": 1000.0
    },
    {
      "from_member": 3,
      "to_member": 1,
      "from_name": "Priya Nair",
      "to_name": "Aarav Sharma",
      "amount": 1000.0
    }
  ]
}
```

### POST `/flats/{id}/settlements`
Records a direct settlement payment between members.
- **Request Body**:
```json
{
  "from_member": 2,
  "to_member": 1,
  "amount": 1000.0
}
```

---

## 4. Chores & Fairness

### POST `/flats/{id}/chores`
Create a chore.
- **Request Body**:
```json
{
  "title": "Clean Kitchen Counter",
  "assigned_to": 1,
  "frequency": "weekly",
  "due_day": "Sunday"
}
```

### POST `/chores/{id}/complete`
Marks chore done and records to ChoreLog.

### POST `/chores/{id}/rotate`
Rotates assignment to next flat member in join order (wrapping around).

### GET `/flats/{id}/chores/fairness`
Returns stats for the last 30 days.
- **Response `200 OK`**:
```json
{
  "period_days": 30,
  "total_completed": 8,
  "stats": [
    {
      "member_id": 1,
      "name": "Aarav Sharma",
      "completed_count": 5,
      "percentage_share": 62.5
    },
    {
      "member_id": 2,
      "name": "Rohan Verma",
      "completed_count": 3,
      "percentage_share": 37.5
    }
  ]
}
```

---

## 5. Rules

### POST `/flats/{id}/rules`
- **Request Body**:
```json
{
  "text": "Quiet hours after 11 PM",
  "source": "manual"
}
```

### POST `/rules/{id}/approve`
Toggles approval of the requesting member.

---

## 6. Listings & Compatibility

### POST `/listings`
- **Request Body**:
```json
{
  "flat_id": 1,
  "title": "Sunlit Room in Indiranagar 3BHK",
  "location": "Indiranagar, Bangalore",
  "rent": 18000.0,
  "seats_available": 1,
  "description": "Attached washroom, high speed fiber internet, fully furnished.",
  "tags": ["attached_washroom", "wifi", "veg_friendly"]
}
```

### GET `/listings`
Query parameters: `q`, `min_rent`, `max_rent`, `location`, `tags`, `status` (`open` | `closed`).

### GET `/listings/{id}/compatibility`
Computes deterministic 0-100 match between candidate user habits and flat members habits.
- **Response `200 OK`**:
```json
{
  "group_score": 86.5,
  "is_dealbreaker": false,
  "summary": "High compatibility with current flatmates.",
  "group_breakdown": [
    {
      "factor": "sleep_time",
      "status": "match",
      "user_value": "normal",
      "flat_value": "Aggregated across 2 member(s)",
      "score": 18.0,
      "max_score": 20.0,
      "detail": "Group average 18.0/20.0"
    }
  ],
  "member_breakdowns": [ ... ]
}
```

---

## 7. AI Module Endpoints (Powered by Qwen 2.5 1.5B Local LLM)

All AI endpoints have:
- Rate limit: 20 req/min per user
- Graceful fallbacks (`"ai_available": false`) if LLM is offline

### POST `/ai/match-explanation`
Takes user habits + flat habits + deterministic breakdown and returns friendly prose explanation.

### POST `/ai/house-rules`
Generates 6-10 concise rules. (Use `/ai/flats/{id}/rules/confirm` to persist).

### POST `/ai/flats/{id}/rules/confirm`
Saves confirmed rules as `Rule(source="ai")`.

### POST `/ai/polite-rewrite`
Input: blunt complaint. Output: polite, constructive phrasing without hiding the core issue.

### GET `/ai/weekly-summary/{flat_id}`
Summarizes verified flat metrics from database in light Hinglish.

### POST `/ai/condition-diff`
Inspects move-in vs move-out room observations, labeled with AI suggestion disclaimer.

