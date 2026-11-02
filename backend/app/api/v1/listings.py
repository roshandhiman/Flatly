from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Listing, Flat, Member, User
from app.schemas import ListingCreate, ListingResponse, CompatibilityResponse
from app.services.auth import get_current_user
from app.services.matching import compute_group_compatibility

router = APIRouter(prefix="/listings", tags=["Listings"])


@router.post("", response_model=ListingResponse, status_code=status.HTTP_201_CREATED)
def create_listing(
    listing_in: ListingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if listing_in.flat_id:
        flat = db.query(Flat).filter(Flat.id == listing_in.flat_id).first()
        if not flat:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Flat not found")
        # Ensure user is a member of this flat
        member = db.query(Member).filter(Member.flat_id == listing_in.flat_id, Member.user_id == current_user.id).first()
        if not member:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Must be a member of the flat to list it")

    listing = Listing(
        flat_id=listing_in.flat_id,
        posted_by=current_user.id,
        title=listing_in.title,
        location=listing_in.location,
        rent=listing_in.rent,
        seats_available=listing_in.seats_available,
        description=listing_in.description,
        tags=listing_in.tags,
        status="open"
    )
    db.add(listing)
    db.commit()
    db.refresh(listing)
    return listing


@router.get("", response_model=List[ListingResponse])
def get_listings(
    q: Optional[str] = None,
    min_rent: Optional[float] = None,
    max_rent: Optional[float] = None,
    location: Optional[str] = None,
    tags: Optional[List[str]] = Query(None),
    status_filter: Optional[str] = Query("open", alias="status"),
    db: Session = Depends(get_db)
):
    query = db.query(Listing)
    
    if status_filter:
        query = query.filter(Listing.status == status_filter)
        
    if location:
        query = query.filter(Listing.location.ilike(f"%{location}%"))
        
    if min_rent is not None:
        query = query.filter(Listing.rent >= min_rent)
        
    if max_rent is not None:
        query = query.filter(Listing.rent <= max_rent)
        
    if q:
        query = query.filter(
            (Listing.title.ilike(f"%{q}%")) |
            (Listing.description.ilike(f"%{q}%")) |
            (Listing.location.ilike(f"%{q}%"))
        )
        
    listings = query.order_by(Listing.created_at.desc()).all()
    
    # Filter by tags if provided
    if tags:
        target_tags = {t.lower() for t in tags}
        listings = [
            l for l in listings
            if any(t.lower() in target_tags for t in (l.tags or []))
        ]
        
    return listings


@router.get("/{id}", response_model=ListingResponse)
def get_listing(id: int, db: Session = Depends(get_db)):
    listing = db.query(Listing).filter(Listing.id == id).first()
    if not listing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Listing not found")
    return listing


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_listing(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    listing = db.query(Listing).filter(Listing.id == id).first()
    if not listing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Listing not found")
        
    # Authorization: Only the poster can delete a listing
    if listing.posted_by != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the poster can delete this listing")
        
    db.delete(listing)
    db.commit()
    return None


@router.get("/{id}/compatibility", response_model=CompatibilityResponse)
def get_listing_compatibility(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    listing = db.query(Listing).filter(Listing.id == id).first()
    if not listing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Listing not found")
        
    if not current_user.habits:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You must set your habits in profile (/users/me/habits) before checking compatibility"
        )
        
    # Find flat members to compare against
    flat_members_habits = []
    if listing.flat_id:
        members = db.query(Member).filter(Member.flat_id == listing.flat_id).all()
        for m in members:
            h = None
            if m.user_id:
                u = db.query(User).filter(User.id == m.user_id).first()
                if u:
                    h = u.habits
            flat_members_habits.append({
                "member_id": m.id,
                "name": m.name,
                "habits": h
            })
    else:
        # Standalone listing: compare against the poster
        poster = db.query(User).filter(User.id == listing.posted_by).first()
        flat_members_habits.append({
            "member_id": 0,
            "name": poster.name if poster else "Poster",
            "habits": poster.habits if poster else None
        })
        
    compatibility = compute_group_compatibility(current_user.habits, flat_members_habits)
    return compatibility

