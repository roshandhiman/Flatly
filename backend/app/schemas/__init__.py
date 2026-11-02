from typing import Optional, List, Dict, Any, Literal
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field


# ===================== Habits Schema =====================
class Habits(BaseModel):
    sleep_time: Literal["early", "normal", "late", "night_owl"]
    cleanliness: int = Field(ge=1, le=5)
    guests: Literal["never", "sometimes", "often"]
    food: Literal["veg", "non_veg", "eggetarian", "any"]
    smoking: Literal["no", "outside_only", "yes"]
    noise_tolerance: int = Field(ge=1, le=5)
    wfh: bool


class HabitsUpdate(BaseModel):
    habits: Habits


# ===================== User Schemas =====================
class UserBase(BaseModel):
    email: EmailStr
    name: str


class UserCreate(UserBase):
    password: str = Field(min_length=6)
    habits: Optional[Habits] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(UserBase):
    id: int
    habits: Optional[Habits] = None
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# ===================== Member Schemas =====================
class MemberCreate(BaseModel):
    name: str


class MemberResponse(BaseModel):
    id: int
    flat_id: int
    user_id: Optional[int] = None
    name: str
    role: str
    joined_at: datetime

    class Config:
        from_attributes = True


# ===================== Flat Schemas =====================
class FlatCreate(BaseModel):
    name: str
    address: str
    rent_total: float = 0.0


class FlatJoin(BaseModel):
    invite_code: str


class FlatResponse(BaseModel):
    id: int
    name: str
    address: str
    rent_total: float
    invite_code: str
    created_by: int
    created_at: datetime
    members: List[MemberResponse] = []

    class Config:
        from_attributes = True


# ===================== Expense & Balance Schemas =====================
class ExpenseCreate(BaseModel):
    title: str
    amount: float = Field(gt=0)
    paid_by: int  # member_id
    split_among: List[int]  # list of member_ids
    split_type: Literal["equal", "custom"] = "equal"
    custom_shares: Optional[Dict[str, float]] = None  # key is str(member_id)
    category: str = "General"


class ExpenseResponse(BaseModel):
    id: int
    flat_id: int
    title: str
    amount: float
    paid_by: int
    split_among: List[int]
    split_type: str
    custom_shares: Optional[Dict[str, float]] = None
    category: str
    created_at: datetime

    class Config:
        from_attributes = True


class SettlementCreate(BaseModel):
    from_member: int
    to_member: int
    amount: float = Field(gt=0)


class SettlementResponse(BaseModel):
    id: int
    flat_id: int
    from_member: int
    to_member: int
    amount: float
    created_at: datetime

    class Config:
        from_attributes = True


class TransferSuggestion(BaseModel):
    from_member: int
    to_member: int
    from_name: str
    to_name: str
    amount: float


class MemberBalance(BaseModel):
    member_id: int
    name: str
    net_balance: float
    total_paid: float
    total_owed: float


class BalancesResponse(BaseModel):
    balances: List[MemberBalance]
    suggested_settlements: List[TransferSuggestion]


# ===================== Chore Schemas =====================
class ChoreCreate(BaseModel):
    title: str
    assigned_to: Optional[int] = None  # member_id
    frequency: Literal["once", "weekly"] = "weekly"
    due_day: Optional[str] = "Monday"


class ChoreResponse(BaseModel):
    id: int
    flat_id: int
    title: str
    assigned_to: Optional[int]
    frequency: str
    due_day: Optional[str]
    status: str
    last_completed_at: Optional[datetime]

    class Config:
        from_attributes = True


class ChoreFairnessItem(BaseModel):
    member_id: int
    name: str
    completed_count: int
    percentage_share: float


class ChoreFairnessResponse(BaseModel):
    period_days: int = 30
    total_completed: int
    stats: List[ChoreFairnessItem]


# ===================== Rule Schemas =====================
class RuleCreate(BaseModel):
    text: str
    source: Literal["manual", "ai"] = "manual"


class RuleResponse(BaseModel):
    id: int
    flat_id: int
    text: str
    created_by: int
    approvals: List[int]
    source: str

    class Config:
        from_attributes = True


# ===================== Listing Schemas =====================
class ListingCreate(BaseModel):
    flat_id: Optional[int] = None
    title: str
    location: str
    rent: float = Field(gt=0)
    seats_available: int = Field(ge=1, default=1)
    description: str
    tags: List[str] = []


class ListingResponse(BaseModel):
    id: int
    flat_id: Optional[int] = None
    posted_by: int
    title: str
    location: str
    rent: float
    seats_available: int
    description: str
    tags: List[str]
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


# ===================== Compatibility Schemas =====================
class FactorBreakdown(BaseModel):
    factor: str
    status: Literal["match", "partial", "mismatch"]
    user_value: Any
    flat_value: Any
    score: float
    max_score: float
    detail: str


class MemberCompatibility(BaseModel):
    member_id: int
    member_name: str
    score: float
    breakdown: List[FactorBreakdown]


class CompatibilityResponse(BaseModel):
    group_score: float
    is_dealbreaker: bool
    summary: str
    group_breakdown: List[FactorBreakdown]
    member_breakdowns: List[MemberCompatibility]

