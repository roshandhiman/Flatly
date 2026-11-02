from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


# AI Match Explanation
class MatchExplanationRequest(BaseModel):
    user_habits: Dict[str, Any]
    flat_members_habits: List[Dict[str, Any]]
    deterministic_breakdown: Dict[str, Any]


class MatchExplanationResponse(BaseModel):
    summary: str
    pros: List[str]
    watch_outs: List[str]
    tips: List[str]
    ai_available: bool = True


# AI House Rules
class HouseRulesRequest(BaseModel):
    flat_habits_summary: Dict[str, Any]
    optional_notes: Optional[str] = None


class HouseRulesResponse(BaseModel):
    rules: List[str] = Field(description="List of 6-10 concise house rules")
    ai_available: bool = True


class ConfirmRulesRequest(BaseModel):
    rules: List[str]


# AI Polite Rewrite
class PoliteRewriteRequest(BaseModel):
    complaint_text: str


class PoliteRewriteResponse(BaseModel):
    rewritten: str
    tone: str
    ai_available: bool = True


# AI Weekly Summary
class WeeklySummaryResponse(BaseModel):
    summary: str
    stats: Dict[str, Any]
    ai_available: bool = True


# Condition Diff (Move-in vs Move-out)
class ConditionDiffRequest(BaseModel):
    move_in_notes_or_urls: List[str]
    move_out_notes_or_urls: List[str]


class ConditionItem(BaseModel):
    area: str
    difference: str
    confidence: float
    note: str = "AI suggestion, needs human confirmation"


class ConditionDiffResponse(BaseModel):
    disclaimer: str = "AI suggestion, needs human confirmation"
    detected_differences: List[ConditionItem]
    ai_available: bool = True

