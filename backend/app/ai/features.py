import os
import time
from typing import Dict, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from app.config import settings
from app.database import get_db
from app.models import Flat, Member, Expense, Chore, Rule
from app.services.auth import get_current_user
from app.api.v1.flats import get_member_in_flat
from app.ai.client import LLMClient
from app.schemas.ai import (
    MatchExplanationRequest,
    MatchExplanationResponse,
    HouseRulesRequest,
    HouseRulesResponse,
    ConfirmRulesRequest,
    PoliteRewriteRequest,
    PoliteRewriteResponse,
    WeeklySummaryResponse,
    ConditionDiffRequest,
    ConditionDiffResponse,
)

router = APIRouter(prefix="/ai", tags=["AI"])

# In-memory simple rate limiting: 20/min per user
user_request_times: Dict[int, List[float]] = {}


def check_ai_rate_limit(current_user = Depends(get_current_user)):
    now = time.time()
    user_id = current_user.id
    timestamps = user_request_times.get(user_id, [])
    # keep only within last 60 seconds
    valid_timestamps = [t for t in timestamps if now - t < 60]
    if len(valid_timestamps) >= settings.AI_RATE_LIMIT_PER_MINUTE:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"AI rate limit exceeded ({settings.AI_RATE_LIMIT_PER_MINUTE} requests/minute). Please try again shortly."
        )
    valid_timestamps.append(now)
    user_request_times[user_id] = valid_timestamps
    return current_user


def load_prompt_template(filename: str) -> str:
    prompt_path = os.path.join(os.path.dirname(__file__), "prompts", filename)
    with open(prompt_path, "r", encoding="utf-8") as f:
        return f.read()


@router.post("/match-explanation", response_model=MatchExplanationResponse)
async def explain_match(
    req: MatchExplanationRequest,
    current_user = Depends(check_ai_rate_limit)
):
    """
    Explains the deterministically computed compatibility breakdown.
    Does NOT alter the score. Fallback provided if LLM is unavailable.
    """
    client = LLMClient()
    system_prompt = load_prompt_template("match_explanation.txt")
    
    user_prompt = (
        f"{system_prompt}\n\n"
        f"INPUT DATA:\n"
        f"Candidate Habits: {req.user_habits}\n"
        f"Flat Members Habits: {req.flat_members_habits}\n"
        f"Computed Breakdown: {req.deterministic_breakdown}\n"
    )
    
    result = await client.generate_json(user_prompt, MatchExplanationResponse)
    if result:
        result.ai_available = True
        return result
        
    # Safe graceful fallback
    score = req.deterministic_breakdown.get("group_score", 0)
    is_dealbreaker = req.deterministic_breakdown.get("is_dealbreaker", False)
    
    pros = []
    watch_outs = []
    for item in req.deterministic_breakdown.get("group_breakdown", []):
        if item.get("status") == "match":
            pros.append(f"Strong alignment on {item.get('factor')}: {item.get('detail')}")
        elif item.get("status") == "mismatch":
            watch_outs.append(f"Lifestyle difference in {item.get('factor')}: {item.get('detail')}")
            
    if not pros:
        pros = ["Opportunity to align on shared expectations from day one."]
    if not watch_outs:
        watch_outs = ["No severe conflicts detected; standard roommate adjustments apply."]
        
    summary = f"Compatibility score is {score}/100. "
    if is_dealbreaker:
        summary += "A key lifestyle dealbreaker (such as smoking preference) was flagged."
    else:
        summary += "Lifestyles show solid common ground with manageable differences."
        
    return MatchExplanationResponse(
        summary=summary,
        pros=pros[:3],
        watch_outs=watch_outs[:3],
        tips=[
            "Establish quiet hours early on.",
            "Use Flatly chores and expenses to keep everything transparent."
        ],
        ai_available=False
    )


@router.post("/house-rules", response_model=HouseRulesResponse)
async def generate_house_rules(
    req: HouseRulesRequest,
    current_user = Depends(check_ai_rate_limit)
):
    """
    Generates 6-10 concise house rules.
    NOTE: Does NOT save to database automatically.
    Client must call /flats/{id}/rules/confirm to save.
    """
    client = LLMClient()
    system_prompt = load_prompt_template("house_rules.txt")
    
    user_prompt = (
        f"{system_prompt}\n\n"
        f"Flat Habits Summary: {req.flat_habits_summary}\n"
        f"User Notes: {req.optional_notes or 'None'}\n"
    )
    
    result = await client.generate_json(user_prompt, HouseRulesResponse)
    if result:
        result.ai_available = True
        return result
        
    # Graceful fallback rules
    return HouseRulesResponse(
        rules=[
            "Quiet hours are observed from 11:00 PM to 7:00 AM on weekdays.",
            "Inform roommates at least 4 hours in advance before inviting overnight guests.",
            "All rent and utility shares must be settled within 3 days of generation.",
            "Clean kitchen counters and wash dishes immediately after cooking.",
            "Rotate chores weekly as scheduled on the Flatly chores board.",
            "Label personal grocery items; shared staples are split equally.",
            "Resolve any disagreements calmly through direct discussion or flat meetings."
        ],
        ai_available=False
    )


@router.post("/flats/{id}/rules/confirm", status_code=status.HTTP_201_CREATED)
def confirm_house_rules(
    id: int,
    req: ConfirmRulesRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Saves confirmed AI-generated rules with source='ai'."""
    member = get_member_in_flat(db, id, current_user.id)
    if not member:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized for this flat")
        
    created_rules = []
    for rule_text in req.rules:
        r = Rule(
            flat_id=id,
            text=rule_text,
            created_by=current_user.id,
            approvals=[member.id],
            source="ai"
        )
        db.add(r)
        created_rules.append(r)
        
    db.commit()
    return {"message": f"Successfully created {len(created_rules)} AI rules", "count": len(created_rules)}


@router.post("/polite-rewrite", response_model=PoliteRewriteResponse)
async def polite_rewrite(
    req: PoliteRewriteRequest,
    current_user = Depends(check_ai_rate_limit)
):
    """Rewrites blunt/rude text politely without obscuring the underlying issue."""
    client = LLMClient()
    system_prompt = load_prompt_template("polite_rewrite.txt")
    
    user_prompt = (
        f"{system_prompt}\n\n"
        f"ORIGINAL MESSAGE: \"{req.complaint_text}\"\n"
    )
    
    result = await client.generate_json(user_prompt, PoliteRewriteResponse)
    if result:
        result.ai_available = True
        return result
        
    # Fallback
    cleaned = req.complaint_text.strip()
    return PoliteRewriteResponse(
        rewritten=f"Hey folks, quick reminder regarding our shared space: could we please ensure '{cleaned}' is addressed? Appreciate the support!",
        tone="Courteous & direct",
        ai_available=False
    )


@router.get("/weekly-summary/{flat_id}", response_model=WeeklySummaryResponse)
async def get_weekly_summary(
    flat_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(check_ai_rate_limit)
):
    """
    Summarizes last 7 days of real flat data:
    total spent, top category, balances/debts, pending chores.
    Phrased in 3-4 friendly lines in light Hinglish.
    """
    member = get_member_in_flat(db, flat_id, current_user.id)
    if not member:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized for this flat")
        
    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    recent_expenses = db.query(Expense).filter(
        Expense.flat_id == flat_id,
        Expense.created_at >= seven_days_ago
    ).all()
    
    total_spent = round(sum(e.amount for e in recent_expenses), 2)
    categories: Dict[str, float] = {}
    for e in recent_expenses:
        categories[e.category] = categories.get(e.category, 0.0) + e.amount
    top_category = max(categories, key=categories.get) if categories else "None"
    
    pending_chores = db.query(Chore).filter(
        Chore.flat_id == flat_id,
        Chore.status == "pending"
    ).all()
    
    stats_data = {
        "total_spent_last_7_days": total_spent,
        "top_category": top_category,
        "expense_count": len(recent_expenses),
        "pending_chores_count": len(pending_chores),
        "pending_chore_titles": [c.title for c in pending_chores[:5]]
    }
    
    client = LLMClient()
    system_prompt = load_prompt_template("weekly_summary.txt")
    
    user_prompt = (
        f"{system_prompt}\n\n"
        f"REAL FLAT DATA:\n{stats_data}\n"
    )
    
    class SummaryOut(BaseModel):
        summary: str
        
    result = await client.generate_json(user_prompt, SummaryOut)
    if result:
        return WeeklySummaryResponse(
            summary=result.summary,
            stats=stats_data,
            ai_available=True
        )
        
    # Hinglish Fallback
    fallback_summary = (
        f"Hey folks! This week total ₹{total_spent} spend hua hai (top category: {top_category}). "
        f"Abhi {len(pending_chores)} chores pending hain table pe. "
        f"Ek baar settle-up check kar lo aur chores nipta lo so scene remains totally sorted!"
    )
    return WeeklySummaryResponse(
        summary=fallback_summary,
        stats=stats_data,
        ai_available=False
    )


@router.post("/condition-diff", response_model=ConditionDiffResponse)
async def check_condition_diff(
    req: ConditionDiffRequest,
    current_user = Depends(check_ai_rate_limit)
):
    """
    Accepts descriptions/notes of room condition (move-in vs move-out).
    Returns suggested differences with confidence.
    Clearly labeled 'AI suggestion, needs human confirmation'.
    """
    client = LLMClient()
    system_prompt = load_prompt_template("condition_diff.txt")
    
    user_prompt = (
        f"{system_prompt}\n\n"
        f"Move-in observations: {req.move_in_notes_or_urls}\n"
        f"Move-out observations: {req.move_out_notes_or_urls}\n"
    )
    
    result = await client.generate_json(user_prompt, ConditionDiffResponse)
    if result:
        result.ai_available = True
        return result
        
    # Fallback
    return ConditionDiffResponse(
        disclaimer="AI suggestion, needs human confirmation",
        detected_differences=[
            {
                "area": "General Inspection",
                "difference": "Comparing move-in notes against move-out items. Please review wall scuffs and appliance cleanliness manually.",
                "confidence": 0.5,
                "note": "AI suggestion, needs human confirmation"
            }
        ],
        ai_available=False
    )

