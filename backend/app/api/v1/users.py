from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User
from app.schemas import HabitsUpdate, UserResponse
from app.services.auth import get_current_user

router = APIRouter(prefix="/users", tags=["Users"])


@router.put("/me/habits", response_model=UserResponse)
def update_my_habits(
    habits_in: HabitsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    current_user.habits = habits_in.habits.model_dump()
    db.commit()
    db.refresh(current_user)
    return current_user

