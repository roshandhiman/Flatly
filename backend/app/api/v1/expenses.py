from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Flat, Member, Expense, Settlement
from app.schemas import (
    ExpenseCreate,
    ExpenseResponse,
    SettlementCreate,
    SettlementResponse,
    BalancesResponse,
)
from app.services.auth import get_current_user
from app.services.balances import calculate_member_balances, minimize_transfers
from app.api.v1.flats import get_member_in_flat

router = APIRouter(prefix="/flats/{id}", tags=["Expenses & Balances"])


@router.post("/expenses", response_model=ExpenseResponse, status_code=status.HTTP_201_CREATED)
def create_expense(
    id: int,
    expense_in: ExpenseCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    member = get_member_in_flat(db, id, current_user.id)
    if not member:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized for this flat")
        
    flat_members = db.query(Member).filter(Member.flat_id == id).all()
    flat_member_ids = {m.id for m in flat_members}
    
    if expense_in.paid_by not in flat_member_ids:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Payer is not a member of this flat")
        
    for m_id in expense_in.split_among:
        if m_id not in flat_member_ids:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Member {m_id} in split_among is not in this flat")
            
    if expense_in.split_type == "custom":
        if not expense_in.custom_shares:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="custom_shares must be provided for custom split_type")
        total_custom = sum(float(v) for v in expense_in.custom_shares.values())
        if abs(total_custom - expense_in.amount) > 0.01:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Sum of custom shares ({total_custom}) does not equal total amount ({expense_in.amount})")
            
    expense = Expense(
        flat_id=id,
        title=expense_in.title,
        amount=round(expense_in.amount, 2),
        paid_by=expense_in.paid_by,
        split_among=expense_in.split_among,
        split_type=expense_in.split_type,
        custom_shares=expense_in.custom_shares,
        category=expense_in.category
    )
    db.add(expense)
    db.commit()
    db.refresh(expense)
    return expense


@router.get("/expenses", response_model=List[ExpenseResponse])
def get_expenses(
    id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    member = get_member_in_flat(db, id, current_user.id)
    if not member:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized for this flat")
        
    return db.query(Expense).filter(Expense.flat_id == id).order_by(Expense.created_at.desc()).all()


@router.delete("/expenses/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_expense(
    id: int,
    expense_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    member = get_member_in_flat(db, id, current_user.id)
    if not member:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized for this flat")
        
    expense = db.query(Expense).filter(Expense.id == expense_id, Expense.flat_id == id).first()
    if not expense:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expense not found")
        
    db.delete(expense)
    db.commit()
    return None


@router.get("/balances", response_model=BalancesResponse)
def get_flat_balances(
    id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    member = get_member_in_flat(db, id, current_user.id)
    if not member:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized for this flat")
        
    members = db.query(Member).filter(Member.flat_id == id).all()
    expenses = db.query(Expense).filter(Expense.flat_id == id).all()
    settlements = db.query(Settlement).filter(Settlement.flat_id == id).all()
    
    member_data = [{"id": m.id, "name": m.name} for m in members]
    expense_data = [
        {
            "id": e.id,
            "amount": e.amount,
            "paid_by": e.paid_by,
            "split_among": e.split_among,
            "split_type": e.split_type,
            "custom_shares": e.custom_shares
        }
        for e in expenses
    ]
    settlement_data = [
        {
            "from_member": s.from_member,
            "to_member": s.to_member,
            "amount": s.amount
        }
        for s in settlements
    ]
    
    balances = calculate_member_balances(member_data, expense_data, settlement_data)
    transfers = minimize_transfers(balances)
    
    return {
        "balances": balances,
        "suggested_settlements": transfers
    }


@router.post("/settlements", response_model=SettlementResponse, status_code=status.HTTP_201_CREATED)
def create_settlement(
    id: int,
    settlement_in: SettlementCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    member = get_member_in_flat(db, id, current_user.id)
    if not member:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized for this flat")
        
    flat_members = db.query(Member).filter(Member.flat_id == id).all()
    flat_member_ids = {m.id for m in flat_members}
    
    if settlement_in.from_member not in flat_member_ids or settlement_in.to_member not in flat_member_ids:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Members must belong to this flat")
        
    if settlement_in.from_member == settlement_in.to_member:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="from_member and to_member cannot be the same")
        
    settlement = Settlement(
        flat_id=id,
        from_member=settlement_in.from_member,
        to_member=settlement_in.to_member,
        amount=round(settlement_in.amount, 2)
    )
    db.add(settlement)
    db.commit()
    db.refresh(settlement)
    return settlement

