import pytest
from fastapi.testclient import TestClient



# ================= AUTH INTEGRATION TESTS =================
def test_auth_signup_and_me(client):
    # Signup
    signup_data = {
        "email": "test@flatly.app",
        "name": "Test User",
        "password": "secretpassword",
        "habits": {
            "sleep_time": "normal",
            "cleanliness": 4,
            "guests": "sometimes",
            "food": "veg",
            "smoking": "no",
            "noise_tolerance": 3,
            "wfh": True
        }
    }
    res = client.post("/api/v1/auth/signup", json=signup_data)
    assert res.status_code == 201
    token_info = res.json()
    assert "access_token" in token_info
    assert token_info["user"]["email"] == "test@flatly.app"
    token = token_info["access_token"]

    # Login
    login_res = client.post("/api/v1/auth/login", json={
        "email": "test@flatly.app",
        "password": "secretpassword"
    })
    assert login_res.status_code == 200
    assert "access_token" in login_res.json()

    # /auth/me
    headers = {"Authorization": f"Bearer {token}"}
    me_res = client.get("/api/v1/auth/me", headers=headers)
    assert me_res.status_code == 200
    assert me_res.json()["name"] == "Test User"


# ================= FULL FLAT FLOW TEST =================
# create flat -> add members -> add expenses -> get balances -> settle up
def test_full_flat_and_expense_balances_flow(client):
    # 1. Signup Alice (creator)
    alice_signup = client.post("/api/v1/auth/signup", json={
        "email": "alice@flatly.app",
        "name": "Alice",
        "password": "password123"
    })
    alice_token = alice_signup.json()["access_token"]
    alice_headers = {"Authorization": f"Bearer {alice_token}"}

    # 2. Alice creates flat
    flat_res = client.post("/api/v1/flats", json={
        "name": "Sunny Heights 302",
        "address": "Koramangala, Bangalore",
        "rent_total": 45000.0
    }, headers=alice_headers)
    assert flat_res.status_code == 201
    flat = flat_res.json()
    flat_id = flat["id"]
    invite_code = flat["invite_code"]
    alice_member_id = flat["members"][0]["id"]

    # 3. Add Bob by name
    bob_add = client.post(f"/api/v1/flats/{flat_id}/members", json={"name": "Bob"}, headers=alice_headers)
    assert bob_add.status_code == 201
    bob_member_id = bob_add.json()["id"]

    # 4. Charlie signs up and joins via invite code
    charlie_signup = client.post("/api/v1/auth/signup", json={
        "email": "charlie@flatly.app",
        "name": "Charlie",
        "password": "password123"
    })
    charlie_token = charlie_signup.json()["access_token"]
    charlie_headers = {"Authorization": f"Bearer {charlie_token}"}

    join_res = client.post("/api/v1/flats/join", json={"invite_code": invite_code}, headers=charlie_headers)
    assert join_res.status_code == 200
    flat_updated = join_res.json()
    charlie_member = next(m for m in flat_updated["members"] if m["name"] == "Charlie")
    charlie_member_id = charlie_member["id"]

    # 5. Add Expense: Alice pays 300 for Groceries, split equally among Alice, Bob, Charlie
    exp_res = client.post(f"/api/v1/flats/{flat_id}/expenses", json={
        "title": "Weekly Groceries",
        "amount": 300.0,
        "paid_by": alice_member_id,
        "split_among": [alice_member_id, bob_member_id, charlie_member_id],
        "split_type": "equal",
        "category": "Groceries"
    }, headers=alice_headers)
    assert exp_res.status_code == 201

    # 6. Check Balances
    bal_res = client.get(f"/api/v1/flats/{flat_id}/balances", headers=alice_headers)
    assert bal_res.status_code == 200
    balances = bal_res.json()["balances"]
    suggested = bal_res.json()["suggested_settlements"]

    # Net balance check: Alice paid 300, share 100 -> net +200
    # Bob paid 0, share 100 -> net -100
    # Charlie paid 0, share 100 -> net -100
    # Total sum of all net balances MUST equal 0.00
    total_net = sum(b["net_balance"] for b in balances)
    assert round(total_net, 2) == 0.00
    assert len(suggested) == 2  # Bob pays Alice 100, Charlie pays Alice 100

    # 7. Bob settles up with Alice
    settle_res = client.post(f"/api/v1/flats/{flat_id}/settlements", json={
        "from_member": bob_member_id,
        "to_member": alice_member_id,
        "amount": 100.0
    }, headers=alice_headers)
    assert settle_res.status_code == 201

    # Re-check balances
    bal_res_after = client.get(f"/api/v1/flats/{flat_id}/balances", headers=alice_headers)
    balances_after = bal_res_after.json()["balances"]
    bob_after = next(b for b in balances_after if b["member_id"] == bob_member_id)
    assert bob_after["net_balance"] == 0.00
    assert round(sum(b["net_balance"] for b in balances_after), 2) == 0.00


# ================= CHORES & FAIRNESS FLOW =================
def test_chores_and_fairness_flow(client):
    # Setup Alice
    alice_res = client.post("/api/v1/auth/signup", json={
        "email": "chore_alice@flatly.app",
        "name": "Alice",
        "password": "password"
    })
    token = alice_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Flat
    flat = client.post("/api/v1/flats", json={"name": "Chore House", "address": "Indiranagar", "rent_total": 30000}, headers=headers).json()
    flat_id = flat["id"]
    alice_m_id = flat["members"][0]["id"]

    # Create Chore
    chore_res = client.post(f"/api/v1/flats/{flat_id}/chores", json={
        "title": "Clean Kitchen",
        "assigned_to": alice_m_id,
        "frequency": "weekly",
        "due_day": "Sunday"
    }, headers=headers)
    assert chore_res.status_code == 201
    chore_id = chore_res.json()["id"]

    # Complete Chore
    comp_res = client.post(f"/api/v1/chores/{chore_id}/complete", headers=headers)
    assert comp_res.status_code == 200
    assert comp_res.json()["status"] == "done"

    # Fairness
    fairness_res = client.get(f"/api/v1/flats/{flat_id}/chores/fairness", headers=headers)
    assert fairness_res.status_code == 200
    assert fairness_res.json()["total_completed"] == 1


# ================= RULES & LISTINGS FLOW =================
def test_rules_and_listings_flow(client):
    user_res = client.post("/api/v1/auth/signup", json={
        "email": "listing_user@flatly.app",
        "name": "Rohan",
        "password": "password"
    })
    token = user_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Flat & Rule
    flat = client.post("/api/v1/flats", json={"name": "Rule House", "address": "HSR Layout", "rent_total": 20000}, headers=headers).json()
    rule_res = client.post(f"/api/v1/flats/{flat['id']}/rules", json={"text": "No loud music after 11 PM"}, headers=headers)
    assert rule_res.status_code == 201
    rule_id = rule_res.json()["id"]

    # Toggle approve
    toggle_res = client.post(f"/api/v1/rules/{rule_id}/approve", headers=headers)
    assert toggle_res.status_code == 200

    # Post Listing
    list_res = client.post("/api/v1/listings", json={
        "title": "Spacious Room in HSR Layout",
        "location": "HSR Layout Sector 2",
        "rent": 12000.0,
        "seats_available": 1,
        "description": "Furnished room with attached washroom",
        "tags": ["wifi", "ac"]
    }, headers=headers)
    assert list_res.status_code == 201
    listing_id = list_res.json()["id"]

    # Query listings
    query_res = client.get("/api/v1/listings?location=HSR&max_rent=15000")
    assert query_res.status_code == 200
    assert len(query_res.json()) >= 1
