import pytest
import uuid
from unittest.mock import patch
from fastapi.testclient import TestClient

from app.schemas.ai import (
    MatchExplanationResponse,
    HouseRulesResponse,
    PoliteRewriteResponse
)


@pytest.fixture
def auth_headers(client):
    unique_id = str(uuid.uuid4())[:8]
    user_data = {
        "email": f"ai_{unique_id}@flatly.app",
        "name": "AI Tester",
        "password": "password123"
    }
    signup = client.post("/api/v1/auth/signup", json=user_data)
    token = signup.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@patch("app.ai.client.LLMClient.generate_json")
def test_ai_match_explanation_mocked(mock_generate, client, auth_headers):
    # Mock LLM response
    mock_generate.return_value = MatchExplanationResponse(
        summary="You two have aligned habits and clear boundaries.",
        pros=["Identical quiet sleep hours", "Shared cleanliness expectation"],
        watch_outs=["Slight guest frequency difference"],
        tips=["Discuss weekend guests beforehand"],
        ai_available=True
    )

    req_payload = {
        "user_habits": {
            "sleep_time": "normal",
            "cleanliness": 4,
            "guests": "sometimes",
            "food": "veg",
            "smoking": "no",
            "noise_tolerance": 3,
            "wfh": True
        },
        "flat_members_habits": [
            {
                "member_id": 1,
                "name": "Alice",
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
        ],
        "deterministic_breakdown": {
            "group_score": 100.0,
            "is_dealbreaker": False,
            "summary": "High compatibility",
            "group_breakdown": [
                {"factor": "sleep_time", "status": "match", "user_value": "normal", "flat_value": "normal", "score": 20, "max_score": 20, "detail": "Aligned"}
            ],
            "member_breakdowns": []
        }
    }

    res = client.post("/api/v1/ai/match-explanation", json=req_payload, headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["ai_available"] is True
    assert len(data["pros"]) == 2
    assert "You two have aligned habits" in data["summary"]


@patch("app.ai.client.LLMClient.generate_json")
def test_ai_match_explanation_fallback_when_llm_fails(mock_generate, client, auth_headers):
    # Mock LLM failure (returns None)
    mock_generate.return_value = None

    req_payload = {
        "user_habits": {"sleep_time": "normal", "cleanliness": 4, "guests": "sometimes", "food": "veg", "smoking": "no", "noise_tolerance": 3, "wfh": True},
        "flat_members_habits": [],
        "deterministic_breakdown": {
            "group_score": 75.0,
            "is_dealbreaker": False,
            "group_breakdown": [
                {"factor": "cleanliness", "status": "match", "detail": "Identical cleanliness standard"}
            ]
        }
    }

    res = client.post("/api/v1/ai/match-explanation", json=req_payload, headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    # Graceful fallback returns ai_available=False instead of 500
    assert data["ai_available"] is False
    assert "75.0" in data["summary"]
    assert len(data["pros"]) > 0


@patch("app.ai.client.LLMClient.generate_json")
def test_ai_polite_rewrite(mock_generate, client, auth_headers):
    mock_generate.return_value = PoliteRewriteResponse(
        rewritten="Hey, could you please help clear the sink when you have a moment? Thank you!",
        tone="Polite & considerate",
        ai_available=True
    )

    res = client.post("/api/v1/ai/polite-rewrite", json={
        "complaint_text": "Clean your dirty dishes right now, it's disgusting!"
    }, headers=auth_headers)

    assert res.status_code == 200
    assert res.json()["tone"] == "Polite & considerate"
    assert "clean the sink" in res.json()["rewritten"].lower() or "dishes" in res.json()["rewritten"].lower() or "clear" in res.json()["rewritten"].lower()


@patch("app.ai.client.LLMClient.generate_json")
def test_ai_house_rules_and_confirmation(mock_generate, client, auth_headers):
    # 1. Create a Flat
    flat = client.post("/api/v1/flats", json={"name": "AI Rule Flat", "address": "Indiranagar", "rent_total": 25000}, headers=auth_headers).json()
    flat_id = flat["id"]

    mock_generate.return_value = HouseRulesResponse(
        rules=[
            "Quiet hours: 11 PM to 7 AM",
            "Guests: Please notify roommates 4 hours prior",
            "Dishes: Clean after every meal",
            "Chores: Rotate weekly"
        ],
        ai_available=True
    )

    gen_res = client.post("/api/v1/ai/house-rules", json={
        "flat_habits_summary": {"sleep_time": "normal"},
        "optional_notes": "We love quiet evenings"
    }, headers=auth_headers)
    assert gen_res.status_code == 200
    generated_rules = gen_res.json()["rules"]
    assert len(generated_rules) == 4

    # 2. Confirm to save as source='ai'
    confirm_res = client.post(f"/api/v1/ai/flats/{flat_id}/rules/confirm", json={
        "rules": generated_rules
    }, headers=auth_headers)
    assert confirm_res.status_code == 201
    assert confirm_res.json()["count"] == 4

    # Check that rules were actually persisted with source='ai'
    rules_in_db = client.get(f"/api/v1/flats/{flat_id}/rules", headers=auth_headers).json()
    assert len(rules_in_db) == 4
    assert all(r["source"] == "ai" for r in rules_in_db)
