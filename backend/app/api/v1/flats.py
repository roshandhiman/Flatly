import random
import string
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, Flat, Member
from app.schemas import FlatCreate, FlatJoin, FlatResponse, MemberCreate, MemberResponse
from app.services.auth import get_current_user

router = APIRouter(prefix="/flats", tags=["Flats"])


def generate_invite_code(length: int = 6) -> str:
    chars = string.ascii_uppercase + string.digits
    return "".join(random.choices(chars, k=length))


def get_member_in_flat(db: Session, flat_id: int, user_id: int) -> Optional[Member]:
    return db.query(Member).filter(Member.flat_id == flat_id, Member.user_id == user_id).first()


@router.post("", response_model=FlatResponse, status_code=status.HTTP_201_CREATED)
def create_flat(
    flat_in: FlatCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Unique 6-character invite code
    invite_code = generate_invite_code()
    while db.query(Flat).filter(Flat.invite_code == invite_code).first():
        invite_code = generate_invite_code()
        
    flat = Flat(
        name=flat_in.name,
        address=flat_in.address,
        rent_total=flat_in.rent_total,
        invite_code=invite_code,
        created_by=current_user.id
    )
    db.add(flat)
    db.flush()
    
    # Creator automatically becomes admin member
    admin_member = Member(
        flat_id=flat.id,
        user_id=current_user.id,
        name=current_user.name,
        role="admin"
    )
    db.add(admin_member)
    db.commit()
    db.refresh(flat)
    return flat


@router.get("/{id}", response_model=FlatResponse)
def get_flat(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    flat = db.query(Flat).filter(Flat.id == id).first()
    if not flat:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Flat not found")
        
    # Check authorization: user must be a member
    member = get_member_in_flat(db, id, current_user.id)
    if not member:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to access this flat")
        
    return flat


@router.post("/join", response_model=FlatResponse)
def join_flat(
    join_in: FlatJoin,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    flat = db.query(Flat).filter(Flat.invite_code == join_in.invite_code.upper()).first()
    if not flat:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invalid invite code")
        
    # Check if already a member
    existing_member = get_member_in_flat(db, flat.id, current_user.id)
    if existing_member:
        return flat
        
    # Check if a placeholder member (added by name with user_id=None) matches this user's name
    placeholder = db.query(Member).filter(
        Member.flat_id == flat.id,
        Member.user_id == None,
        Member.name == current_user.name
    ).first()
    
    if placeholder:
        placeholder.user_id = current_user.id
    else:
        new_member = Member(
            flat_id=flat.id,
            user_id=current_user.id,
            name=current_user.name,
            role="member"
        )
        db.add(new_member)
        
    db.commit()
    db.refresh(flat)
    return flat


@router.post("/{id}/members", response_model=MemberResponse, status_code=status.HTTP_201_CREATED)
def add_member_by_name(
    id: int,
    member_in: MemberCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    flat = db.query(Flat).filter(Flat.id == id).first()
    if not flat:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Flat not found")
        
    current_member = get_member_in_flat(db, id, current_user.id)
    if not current_member:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a member of this flat")
        
    member = Member(
        flat_id=flat.id,
        user_id=None,
        name=member_in.name,
        role="member"
    )
    db.add(member)
    db.commit()
    db.refresh(member)
    return member


@router.delete("/{id}/members/{member_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_member(
    id: int,
    member_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    flat = db.query(Flat).filter(Flat.id == id).first()
    if not flat:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Flat not found")
        
    current_member = get_member_in_flat(db, id, current_user.id)
    if not current_member:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a member of this flat")
        
    target_member = db.query(Member).filter(Member.id == member_id, Member.flat_id == id).first()
    if not target_member:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found in flat")
        
    # Only admin can remove other members, or user can leave themselves
    if current_member.role != "admin" and current_member.id != target_member.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only admins can remove other members")
        
    db.delete(target_member)
    db.commit()
    return None

