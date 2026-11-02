import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Flat, Member, Chore, ChoreLog
from app.schemas import (
    ChoreCreate,
    ChoreResponse,
    ChoreFairnessResponse
)
from app.services.auth import get_current_user
from app.services.chores import rotate_chore_assignment, compute_chore_fairness
from app.api.v1.flats import get_member_in_flat

router = APIRouter(tags=["Chores"])


@router.post("/flats/{id}/chores", response_model=ChoreResponse, status_code=status.HTTP_201_CREATED)
def create_chore(
    id: int,
    chore_in: ChoreCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    member = get_member_in_flat(db, id, current_user.id)
    if not member:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized for this flat")
        
    if chore_in.assigned_to:
        assigned_member = db.query(Member).filter(Member.id == chore_in.assigned_to, Member.flat_id == id).first()
        if not assigned_member:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Assigned member is not in this flat")
            
    chore = Chore(
        flat_id=id,
        title=chore_in.title,
        assigned_to=chore_in.assigned_to,
        frequency=chore_in.frequency,
        due_day=chore_in.due_day,
        status="pending"
    )
    db.add(chore)
    db.commit()
    db.refresh(chore)
    return chore


@router.get("/flats/{id}/chores", response_model=List[ChoreResponse])
def get_chores(
    id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    member = get_member_in_flat(db, id, current_user.id)
    if not member:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized for this flat")
        
    return db.query(Chore).filter(Chore.flat_id == id).all()


@router.delete("/flats/{id}/chores/{chore_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_chore(
    id: int,
    chore_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    member = get_member_in_flat(db, id, current_user.id)
    if not member:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized for this flat")
        
    chore = db.query(Chore).filter(Chore.id == chore_id, Chore.flat_id == id).first()
    if not chore:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chore not found")
        
    db.delete(chore)
    db.commit()
    return None


@router.post("/chores/{chore_id}/complete", response_model=ChoreResponse)
def complete_chore(
    chore_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    chore = db.query(Chore).filter(Chore.id == chore_id).first()
    if not chore:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chore not found")
        
    member = get_member_in_flat(db, chore.flat_id, current_user.id)
    if not member:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized for this flat")
        
    completed_by_id = chore.assigned_to or member.id
    now = datetime.datetime.utcnow()
    chore.status = "done"
    chore.last_completed_at = now
    
    # Log to ChoreLog for fairness calculation
    log = ChoreLog(
        chore_id=chore.id,
        member_id=completed_by_id,
        completed_at=now
    )
    db.add(log)
    db.commit()
    db.refresh(chore)
    return chore


@router.post("/chores/{chore_id}/rotate", response_model=ChoreResponse)
def rotate_chore(
    chore_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    chore = db.query(Chore).filter(Chore.id == chore_id).first()
    if not chore:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chore not found")
        
    member = get_member_in_flat(db, chore.flat_id, current_user.id)
    if not member:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized for this flat")
        
    members = db.query(Member).filter(Member.flat_id == chore.flat_id).order_by(Member.joined_at.asc(), Member.id.asc()).all()
    member_data = [{"id": m.id, "name": m.name} for m in members]
    
    next_assigned = rotate_chore_assignment(member_data, chore.assigned_to)
    chore.assigned_to = next_assigned
    chore.status = "pending"  # reset to pending for the next member
    db.commit()
    db.refresh(chore)
    return chore


@router.get("/flats/{id}/chores/fairness", response_model=ChoreFairnessResponse)
def get_chores_fairness(
    id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    member = get_member_in_flat(db, id, current_user.id)
    if not member:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized for this flat")
        
    members = db.query(Member).filter(Member.flat_id == id).order_by(Member.joined_at.asc()).all()
    member_data = [{"id": m.id, "name": m.name} for m in members]
    
    chores = db.query(Chore).filter(Chore.flat_id == id).all()
    chore_ids = [c.id for c in chores]
    
    logs = db.query(ChoreLog).filter(ChoreLog.chore_id.in_(chore_ids)).all() if chore_ids else []
    log_data = [{"member_id": l.member_id, "completed_at": l.completed_at} for l in logs]
    
    fairness = compute_chore_fairness(member_data, log_data, period_days=30)
    return fairness

