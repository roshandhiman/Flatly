import pytest
from app.services.balances import calculate_member_balances, minimize_transfers
from app.services.chores import rotate_chore_assignment, compute_chore_fairness
from app.services.matching import (
    compute_pairwise_compatibility,
    compute_group_compatibility,
    score_smoking
)
from datetime import datetime, timedelta


# ==================== BALANCES TESTS ====================
def test_balances_equal_split_sums_to_zero():
    members = [{"id": 1, "name": "Alice"}, {"id": 2, "name": "Bob"}, {"id": 3, "name": "Charlie"}]
    # 100 split equally among 3 members -> 33.34, 33.33, 33.33
    expenses = [
        {
            "id": 1,
            "amount": 100.0,
            "paid_by": 1,
            "split_among": [1, 2, 3],
            "split_type": "equal",
            "custom_shares": None
        }
    ]
    settlements = []
    
    balances = calculate_member_balances(members, expenses, settlements)
    assert len(balances) == 3
    
    # Alice paid 100, owes 33.34 => net +66.66
    # Bob paid 0, owes 33.33 => net -33.33
    # Charlie paid 0, owes 33.33 => net -33.33
    total_net = sum(b["net_balance"] for b in balances)
    assert round(total_net, 2) == 0.00
    
    alice = next(b for b in balances if b["member_id"] == 1)
    bob = next(b for b in balances if b["member_id"] == 2)
    charlie = next(b for b in balances if b["member_id"] == 3)
    
    assert alice["net_balance"] == 66.66
    assert bob["net_balance"] == -33.33
    assert charlie["net_balance"] == -33.33


def test_balances_custom_split_and_settlements():
    members = [{"id": 1, "name": "Alice"}, {"id": 2, "name": "Bob"}]
    expenses = [
        {
            "id": 1,
            "amount": 150.0,
            "paid_by": 1,
            "split_among": [1, 2],
            "split_type": "custom",
            "custom_shares": {"1": 50.0, "2": 100.0}
        }
    ]
    # Bob paid 40 settlement to Alice
    settlements = [
        {"from_member": 2, "to_member": 1, "amount": 40.0}
    ]
    
    balances = calculate_member_balances(members, expenses, settlements)
    total_net = sum(b["net_balance"] for b in balances)
    assert round(total_net, 2) == 0.00
    
    alice = next(b for b in balances if b["member_id"] == 1)
    bob = next(b for b in balances if b["member_id"] == 2)
    
    # Alice: paid 150, owes 50 + received 40 settlement => net = 150 - (50 + 40) = +60
    # Bob: paid 40 in settlement, owes 100 => net = 40 - 100 = -60
    assert alice["net_balance"] == 60.0
    assert bob["net_balance"] == -60.0


def test_minimize_transfers():
    balances = [
        {"member_id": 1, "name": "Alice", "net_balance": 70.0},
        {"member_id": 2, "name": "Bob", "net_balance": -50.0},
        {"member_id": 3, "name": "Charlie", "net_balance": -20.0}
    ]
    transfers = minimize_transfers(balances)
    # Bob pays Alice 50, Charlie pays Alice 20
    assert len(transfers) == 2
    
    transfer_pairs = {(t["from_member"], t["to_member"]): t["amount"] for t in transfers}
    assert transfer_pairs.get((2, 1)) == 50.0
    assert transfer_pairs.get((3, 1)) == 20.0


# ==================== CHORES TESTS ====================
def test_chore_rotation_wrap_around():
    members = [{"id": 10}, {"id": 20}, {"id": 30}]
    
    # First rotation from None -> 10
    next_id = rotate_chore_assignment(members, None)
    assert next_id == 10
    
    # 10 -> 20
    next_id = rotate_chore_assignment(members, 10)
    assert next_id == 20
    
    # 20 -> 30
    next_id = rotate_chore_assignment(members, 20)
    assert next_id == 30
    
    # 30 -> wraps around to 10
    next_id = rotate_chore_assignment(members, 30)
    assert next_id == 10


def test_chore_fairness():
    members = [{"id": 1, "name": "Alice"}, {"id": 2, "name": "Bob"}]
    now = datetime(2026, 11, 2, 12, 0, 0)
    
    logs = [
        {"member_id": 1, "completed_at": now - timedelta(days=2)},
        {"member_id": 1, "completed_at": now - timedelta(days=5)},
        {"member_id": 2, "completed_at": now - timedelta(days=10)},
        {"member_id": 2, "completed_at": now - timedelta(days=40)}, # older than 30 days
    ]
    
    res = compute_chore_fairness(members, logs, period_days=30, reference_time=now)
    assert res["total_completed"] == 3
    
    alice_stat = next(s for s in res["stats"] if s["member_id"] == 1)
    bob_stat = next(s for s in res["stats"] if s["member_id"] == 2)
    
    assert alice_stat["completed_count"] == 2
    assert alice_stat["percentage_share"] == 66.7
    assert bob_stat["completed_count"] == 1
    assert bob_stat["percentage_share"] == 33.3


# ==================== COMPATIBILITY & DEALBREAKER TESTS ====================
def test_smoking_dealbreaker_cap():
    user_habits = {
        "sleep_time": "normal",
        "cleanliness": 5,
        "guests": "sometimes",
        "food": "veg",
        "smoking": "no",
        "noise_tolerance": 3,
        "wfh": True
    }
    # Matches on everything except smoking is "yes"
    other_habits = {
        "sleep_time": "normal",
        "cleanliness": 5,
        "guests": "sometimes",
        "food": "veg",
        "smoking": "yes",  # Hard dealbreaker: yes vs no
        "noise_tolerance": 3,
        "wfh": True
    }
    
    res = compute_pairwise_compatibility(user_habits, other_habits)
    assert res["is_dealbreaker"] is True
    # Without cap, score would be 80. With cap, it MUST be capped at 40
    assert res["score"] == 40.0
    
    # Group compatibility check
    flat_members = [{"member_id": 2, "name": "Bob", "habits": other_habits}]
    group_res = compute_group_compatibility(user_habits, flat_members)
    assert group_res["is_dealbreaker"] is True
    assert group_res["group_score"] == 40.0


def test_perfect_compatibility():
    habits = {
        "sleep_time": "normal",
        "cleanliness": 4,
        "guests": "sometimes",
        "food": "veg",
        "smoking": "no",
        "noise_tolerance": 3,
        "wfh": True
    }
    res = compute_pairwise_compatibility(habits, habits)
    assert res["is_dealbreaker"] is False
    assert res["score"] == 100.0

