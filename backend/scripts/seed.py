"""
Optional development seed script for Flatly.
DO NOT RUN IN PRODUCTION. Run manually via:
python scripts/seed.py
"""
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.database import SessionLocal, Base, engine
from app.models import User, Flat, Member, Expense, Chore, Rule, Listing
from app.services.auth import get_password_hash


def seed():
    print("🌱 Starting Flatly seed script...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Check if already seeded
        if db.query(User).filter(User.email == "aarav@flatly.app").first():
            print("Database already contains seed data. Exiting.")
            return

        # 1. Create Users with diverse Habits
        aarav = User(
            name="Aarav Sharma",
            email="aarav@flatly.app",
            password_hash=get_password_hash("password123"),
            habits={
                "sleep_time": "normal",
                "cleanliness": 4,
                "guests": "sometimes",
                "food": "veg",
                "smoking": "no",
                "noise_tolerance": 3,
                "wfh": True
            }
        )
        rohan = User(
            name="Rohan Verma",
            email="rohan@flatly.app",
            password_hash=get_password_hash("password123"),
            habits={
                "sleep_time": "late",
                "cleanliness": 4,
                "guests": "sometimes",
                "food": "non_veg",
                "smoking": "outside_only",
                "noise_tolerance": 4,
                "wfh": False
            }
        )
        priya = User(
            name="Priya Nair",
            email="priya@flatly.app",
            password_hash=get_password_hash("password123"),
            habits={
                "sleep_time": "early",
                "cleanliness": 5,
                "guests": "never",
                "food": "veg",
                "smoking": "no",
                "noise_tolerance": 2,
                "wfh": True
            }
        )
        db.add_all([aarav, rohan, priya])
        db.flush()

        # 2. Create Flat
        flat = Flat(
            name="Palm Meadows 404",
            address="12th Main, Indiranagar, Bengaluru",
            rent_total=54000.0,
            invite_code="IND404",
            created_by=aarav.id
        )
        db.add(flat)
        db.flush()

        # 3. Create Members
        m_aarav = Member(flat_id=flat.id, user_id=aarav.id, name=aarav.name, role="admin")
        m_rohan = Member(flat_id=flat.id, user_id=rohan.id, name=rohan.name, role="member")
        m_priya = Member(flat_id=flat.id, user_id=priya.id, name=priya.name, role="member")
        m_placeholder = Member(flat_id=flat.id, user_id=None, name="Kabir", role="member")
        db.add_all([m_aarav, m_rohan, m_priya, m_placeholder])
        db.flush()

        # 4. Create Expenses
        e1 = Expense(
            flat_id=flat.id,
            title="WiFi & Fiber Bill",
            amount=1500.0,
            paid_by=m_aarav.id,
            split_among=[m_aarav.id, m_rohan.id, m_priya.id],
            split_type="equal",
            category="Utilities"
        )
        e2 = Expense(
            flat_id=flat.id,
            title="Groceries & Essentials",
            amount=3600.0,
            paid_by=m_rohan.id,
            split_among=[m_aarav.id, m_rohan.id, m_priya.id],
            split_type="equal",
            category="Groceries"
        )
        db.add_all([e1, e2])

        # 5. Create Chores
        c1 = Chore(
            flat_id=flat.id,
            title="Kitchen Counter & Stove Wipe",
            assigned_to=m_aarav.id,
            frequency="weekly",
            due_day="Saturday",
            status="pending"
        )
        c2 = Chore(
            flat_id=flat.id,
            title="Trash disposal & recycling",
            assigned_to=m_rohan.id,
            frequency="weekly",
            due_day="Tuesday",
            status="pending"
        )
        db.add_all([c1, c2])

        # 6. House Rules
        r1 = Rule(
            flat_id=flat.id,
            text="Quiet hours start at 11:30 PM on weekdays.",
            created_by=aarav.id,
            approvals=[m_aarav.id, m_rohan.id],
            source="manual"
        )
        db.add(r1)

        # 7. Listings
        l1 = Listing(
            flat_id=flat.id,
            posted_by=aarav.id,
            title="Master Bedroom with Balcony in Indiranagar 3BHK",
            location="Indiranagar, Bangalore",
            rent=18000.0,
            seats_available=1,
            description="Sunlit master bedroom with attached bathroom and private balcony in a cozy, chill apartment.",
            tags=["balcony", "attached_washroom", "wifi", "veg_friendly"],
            status="open"
        )
        db.add(l1)

        db.commit()
        print("✅ Flatly seed data created successfully!")
        print(f"   Flat Invite Code: {flat.invite_code}")
        print("   Users: aarav@flatly.app, rohan@flatly.app, priya@flatly.app (Password: password123)")

    except Exception as e:
        db.rollback()
        print(f"❌ Error seeding database: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    seed()

