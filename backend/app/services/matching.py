from typing import Dict, Any, List, Tuple

# Weights according to spec:
# sleep_time: 20
# cleanliness: 20
# guests: 15
# food: 10
# smoking: 20 (hard dealbreaker: if smoking mismatch is "yes" vs "no", cap score at 40)
# noise_tolerance: 10
# wfh: 5
# Total weight = 20 + 20 + 15 + 10 + 20 + 10 + 5 = 100

SLEEP_ORDER = {"early": 0, "normal": 1, "late": 2, "night_owl": 3}
GUEST_ORDER = {"never": 0, "sometimes": 1, "often": 2}


def score_sleep_time(val1: str, val2: str) -> Tuple[float, str, str]:
    if val1 == val2:
        return 20.0, "match", "Sleep schedules align perfectly"
    diff = abs(SLEEP_ORDER.get(val1, 1) - SLEEP_ORDER.get(val2, 1))
    if diff == 1:
        return 12.0, "partial", f"Close sleep schedules ({val1} vs {val2})"
    return 4.0, "mismatch", f"Divergent sleep schedules ({val1} vs {val2})"


def score_cleanliness(val1: int, val2: int) -> Tuple[float, str, str]:
    diff = abs(val1 - val2)
    if diff == 0:
        return 20.0, "match", f"Identical cleanliness standard ({val1}/5)"
    elif diff == 1:
        return 14.0, "partial", f"Compatible cleanliness expectations ({val1} vs {val2})"
    elif diff == 2:
        return 8.0, "partial", f"Moderate cleanliness difference ({val1} vs {val2})"
    else:
        return 2.0, "mismatch", f"Significant cleanliness divergence ({val1} vs {val2})"


def score_guests(val1: str, val2: str) -> Tuple[float, str, str]:
    if val1 == val2:
        return 15.0, "match", f"Both prefer guests '{val1}'"
    diff = abs(GUEST_ORDER.get(val1, 1) - GUEST_ORDER.get(val2, 1))
    if diff == 1:
        return 9.0, "partial", f"Manageable guest preference ({val1} vs {val2})"
    return 3.0, "mismatch", f"Conflicting guest comfort ({val1} vs {val2})"


def score_food(val1: str, val2: str) -> Tuple[float, str, str]:
    if val1 == val2 or val1 == "any" or val2 == "any":
        return 10.0, "match", f"Dietary lifestyle compatible ({val1} & {val2})"
    
    compatible_pairs = [
        {"veg", "eggetarian"},
        {"non_veg", "eggetarian"}
    ]
    if {val1, val2} in compatible_pairs:
        return 6.0, "partial", f"Partially overlapping dietary choices ({val1} vs {val2})"
    
    # veg vs non_veg
    return 2.0, "mismatch", f"Vegetarian vs Non-vegetarian dietary difference"


def score_smoking(val1: str, val2: str) -> Tuple[float, str, str, bool]:
    """
    Returns (score, status, detail, is_hard_dealbreaker)
    Dealbreaker: "yes" vs "no"
    """
    if val1 == val2:
        return 20.0, "match", f"Identical smoking habit ({val1})", False
    
    is_dealbreaker = ({val1, val2} == {"yes", "no"})
    
    if is_dealbreaker:
        return 0.0, "mismatch", "Dealbreaker: Non-smoker paired with regular smoker", True
    
    # one is outside_only
    return 10.0, "partial", f"Smoking preference managed ({val1} vs {val2})", False


def score_noise(val1: int, val2: int) -> Tuple[float, str, str]:
    diff = abs(val1 - val2)
    if diff == 0:
        return 10.0, "match", f"Identical noise tolerance ({val1}/5)"
    elif diff == 1:
        return 7.0, "partial", f"Similar noise tolerance ({val1} vs {val2})"
    elif diff == 2:
        return 4.0, "partial", f"Moderate noise difference ({val1} vs {val2})"
    else:
        return 1.0, "mismatch", f"Conflicting noise expectations ({val1} vs {val2})"


def score_wfh(val1: bool, val2: bool) -> Tuple[float, str, str]:
    if val1 == val2:
        txt = "Both work from home" if val1 else "Both work outside/office"
        return 5.0, "match", txt
    return 2.5, "partial", "One works from home, one from office"


def compute_pairwise_compatibility(
    user_habits: Dict[str, Any],
    other_habits: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Computes pairwise compatibility between user and another person.
    """
    breakdowns = []
    total_score = 0.0
    has_smoking_dealbreaker = False

    # 1. Sleep Time
    s_score, s_status, s_detail = score_sleep_time(user_habits.get("sleep_time"), other_habits.get("sleep_time"))
    total_score += s_score
    breakdowns.append({
        "factor": "sleep_time",
        "status": s_status,
        "user_value": user_habits.get("sleep_time"),
        "flat_value": other_habits.get("sleep_time"),
        "score": round(s_score, 1),
        "max_score": 20.0,
        "detail": s_detail
    })

    # 2. Cleanliness
    c_score, c_status, c_detail = score_cleanliness(int(user_habits.get("cleanliness", 3)), int(other_habits.get("cleanliness", 3)))
    total_score += c_score
    breakdowns.append({
        "factor": "cleanliness",
        "status": c_status,
        "user_value": user_habits.get("cleanliness"),
        "flat_value": other_habits.get("cleanliness"),
        "score": round(c_score, 1),
        "max_score": 20.0,
        "detail": c_detail
    })

    # 3. Guests
    g_score, g_status, g_detail = score_guests(user_habits.get("guests"), other_habits.get("guests"))
    total_score += g_score
    breakdowns.append({
        "factor": "guests",
        "status": g_status,
        "user_value": user_habits.get("guests"),
        "flat_value": other_habits.get("guests"),
        "score": round(g_score, 1),
        "max_score": 15.0,
        "detail": g_detail
    })

    # 4. Food
    f_score, f_status, f_detail = score_food(user_habits.get("food"), other_habits.get("food"))
    total_score += f_score
    breakdowns.append({
        "factor": "food",
        "status": f_status,
        "user_value": user_habits.get("food"),
        "flat_value": other_habits.get("food"),
        "score": round(f_score, 1),
        "max_score": 10.0,
        "detail": f_detail
    })

    # 5. Smoking
    sm_score, sm_status, sm_detail, is_db = score_smoking(user_habits.get("smoking"), other_habits.get("smoking"))
    total_score += sm_score
    if is_db:
        has_smoking_dealbreaker = True
    breakdowns.append({
        "factor": "smoking",
        "status": sm_status,
        "user_value": user_habits.get("smoking"),
        "flat_value": other_habits.get("smoking"),
        "score": round(sm_score, 1),
        "max_score": 20.0,
        "detail": sm_detail
    })

    # 6. Noise Tolerance
    n_score, n_status, n_detail = score_noise(int(user_habits.get("noise_tolerance", 3)), int(other_habits.get("noise_tolerance", 3)))
    total_score += n_score
    breakdowns.append({
        "factor": "noise_tolerance",
        "status": n_status,
        "user_value": user_habits.get("noise_tolerance"),
        "flat_value": other_habits.get("noise_tolerance"),
        "score": round(n_score, 1),
        "max_score": 10.0,
        "detail": n_detail
    })

    # 7. WFH
    w_score, w_status, w_detail = score_wfh(bool(user_habits.get("wfh")), bool(other_habits.get("wfh")))
    total_score += w_score
    breakdowns.append({
        "factor": "wfh",
        "status": w_status,
        "user_value": user_habits.get("wfh"),
        "flat_value": other_habits.get("wfh"),
        "score": round(w_score, 1),
        "max_score": 5.0,
        "detail": w_detail
    })

    # Hard dealbreaker cap: if smoking mismatch is "yes" vs "no", cap score at 40
    final_score = round(total_score, 1)
    if has_smoking_dealbreaker and final_score > 40.0:
        final_score = 40.0

    return {
        "score": final_score,
        "is_dealbreaker": has_smoking_dealbreaker,
        "breakdown": breakdowns
    }


def compute_group_compatibility(
    user_habits: Dict[str, Any],
    flat_members_habits: List[Dict[str, Any]]  # list of {"member_id": int, "name": str, "habits": dict}
) -> Dict[str, Any]:
    """
    Computes weighted comparison of Habits between a user and each current flat member,
    then aggregates to a GROUP score for the flat (not just pairwise).
    If no members have habits defined, returns a default neutral compatibility.
    """
    valid_members = [m for m in flat_members_habits if m.get("habits")]
    if not valid_members:
        # Default neutral compatibility
        return {
            "group_score": 75.0,
            "is_dealbreaker": False,
            "summary": "No current flat members with recorded habits. Good open canvas!",
            "group_breakdown": [],
            "member_breakdowns": []
        }

    member_results = []
    group_dealbreaker = False
    pairwise_scores = []
    factor_scores = {
        "sleep_time": [],
        "cleanliness": [],
        "guests": [],
        "food": [],
        "smoking": [],
        "noise_tolerance": [],
        "wfh": []
    }

    for member in valid_members:
        res = compute_pairwise_compatibility(user_habits, member["habits"])
        pairwise_scores.append(res["score"])
        if res["is_dealbreaker"]:
            group_dealbreaker = True
            
        member_results.append({
            "member_id": member["member_id"],
            "member_name": member["name"],
            "score": res["score"],
            "breakdown": res["breakdown"]
        })
        
        for item in res["breakdown"]:
            factor_scores[item["factor"]].append(item["score"])

    # Aggregate Group Score: Average of pairwise scores
    avg_score = round(sum(pairwise_scores) / len(pairwise_scores), 1)
    if group_dealbreaker and avg_score > 40.0:
        avg_score = 40.0

    # Build group breakdown by averaging factor scores
    max_scores = {
        "sleep_time": 20.0,
        "cleanliness": 20.0,
        "guests": 15.0,
        "food": 10.0,
        "smoking": 20.0,
        "noise_tolerance": 10.0,
        "wfh": 5.0
    }
    
    group_breakdown = []
    for factor, scores in factor_scores.items():
        factor_avg = round(sum(scores) / len(scores), 1)
        max_s = max_scores[factor]
        ratio = factor_avg / max_s
        if ratio >= 0.8:
            status = "match"
        elif ratio >= 0.5:
            status = "partial"
        else:
            status = "mismatch"
            
        group_breakdown.append({
            "factor": factor,
            "status": status,
            "user_value": user_habits.get(factor),
            "flat_value": f"Aggregated across {len(valid_members)} member(s)",
            "score": factor_avg,
            "max_score": max_s,
            "detail": f"Group average {factor_avg}/{max_s}"
        })

    summary_text = (
        "High compatibility with current flatmates." if avg_score >= 80 else
        "Good compatibility with minor compromises." if avg_score >= 60 else
        "Noticeable lifestyle differences, review details before deciding." if avg_score >= 40 else
        "High risk of friction due to major habit mismatches."
    )
    if group_dealbreaker:
        summary_text += " Note: Smoking preference dealbreaker detected."

    return {
        "group_score": avg_score,
        "is_dealbreaker": group_dealbreaker,
        "summary": summary_text,
        "group_breakdown": group_breakdown,
        "member_breakdowns": member_results
    }

