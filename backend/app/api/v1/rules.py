from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Flat, Member, Rule
from app.schemas import RuleCreate, RuleResponse
from app.services.auth import get_current_user
from app.api.v1.flats import get_member_in_flat

router = APIRouter(tags=["Rules"])


@router.post("/flats/{id}/rules", response_model=RuleResponse, status_code=status.HTTP_201_CREATED)
def create_rule(
    id: int,
    rule_in: RuleCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    member = get_member_in_flat(db, id, current_user.id)
    if not member:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized for this flat")
        
    rule = Rule(
        flat_id=id,
        text=rule_in.text,
        created_by=current_user.id,
        approvals=[member.id],  # creator auto-approves
        source=rule_in.source
    )
    db.add(rule)
    db.commit()
    db.refresh(rule)
    return rule


@router.get("/flats/{id}/rules", response_model=List[RuleResponse])
def get_rules(
    id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    member = get_member_in_flat(db, id, current_user.id)
    if not member:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized for this flat")
        
    return db.query(Rule).filter(Rule.flat_id == id).all()


@router.delete("/flats/{id}/rules/{rule_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_rule(
    id: int,
    rule_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    member = get_member_in_flat(db, id, current_user.id)
    if not member:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized for this flat")
        
    rule = db.query(Rule).filter(Rule.id == rule_id, Rule.flat_id == id).first()
    if not rule:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rule not found")
        
    db.delete(rule)
    db.commit()
    return None


@router.post("/rules/{id}/approve", response_model=RuleResponse)
def toggle_approve_rule(
    id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    rule = db.query(Rule).filter(Rule.id == id).first()
    if not rule:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rule not found")
        
    member = get_member_in_flat(db, rule.flat_id, current_user.id)
    if not member:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized for this flat")
        
    approvals = list(rule.approvals or [])
    if member.id in approvals:
        approvals.remove(member.id)
    else:
        approvals.append(member.id)
        
    rule.approvals = approvals
    db.commit()
    db.refresh(rule)
    return rule

