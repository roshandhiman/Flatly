import datetime
from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    Boolean,
    DateTime,
    ForeignKey,
    JSON,
    Text,
)
from sqlalchemy.orm import relationship
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    habits = Column(JSON, nullable=True)  # JSON field matching Habits schema
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    memberships = relationship("Member", back_populates="user")
    created_flats = relationship("Flat", back_populates="creator")
    listings = relationship("Listing", back_populates="poster")


class Flat(Base):
    __tablename__ = "flats"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    address = Column(String(255), nullable=False)
    rent_total = Column(Float, nullable=False, default=0.0)
    invite_code = Column(String(6), unique=True, index=True, nullable=False)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    creator = relationship("User", back_populates="created_flats")
    members = relationship("Member", back_populates="flat", cascade="all, delete-orphan")
    expenses = relationship("Expense", back_populates="flat", cascade="all, delete-orphan")
    settlements = relationship("Settlement", back_populates="flat", cascade="all, delete-orphan")
    chores = relationship("Chore", back_populates="flat", cascade="all, delete-orphan")
    rules = relationship("Rule", back_populates="flat", cascade="all, delete-orphan")
    listings = relationship("Listing", back_populates="flat")


class Member(Base):
    __tablename__ = "members"

    id = Column(Integer, primary_key=True, index=True)
    flat_id = Column(Integer, ForeignKey("flats.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # nullable for name-only members
    name = Column(String(100), nullable=False)
    role = Column(String(20), default="member", nullable=False)  # admin | member
    joined_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    flat = relationship("Flat", back_populates="members")
    user = relationship("User", back_populates="memberships")


class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True)
    flat_id = Column(Integer, ForeignKey("flats.id"), nullable=False)
    title = Column(String(150), nullable=False)
    amount = Column(Float, nullable=False)
    paid_by = Column(Integer, ForeignKey("members.id"), nullable=False)
    split_among = Column(JSON, nullable=False)  # list of member_ids
    split_type = Column(String(20), default="equal", nullable=False)  # equal | custom
    custom_shares = Column(JSON, nullable=True)  # dict/JSON: {member_id_str: amount}
    category = Column(String(50), default="General", nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    flat = relationship("Flat", back_populates="expenses")
    payer = relationship("Member")


class Settlement(Base):
    __tablename__ = "settlements"

    id = Column(Integer, primary_key=True, index=True)
    flat_id = Column(Integer, ForeignKey("flats.id"), nullable=False)
    from_member = Column(Integer, ForeignKey("members.id"), nullable=False)
    to_member = Column(Integer, ForeignKey("members.id"), nullable=False)
    amount = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    flat = relationship("Flat", back_populates="settlements")
    debtor = relationship("Member", foreign_keys=[from_member])
    creditor = relationship("Member", foreign_keys=[to_member])


class Chore(Base):
    __tablename__ = "chores"

    id = Column(Integer, primary_key=True, index=True)
    flat_id = Column(Integer, ForeignKey("flats.id"), nullable=False)
    title = Column(String(150), nullable=False)
    assigned_to = Column(Integer, ForeignKey("members.id"), nullable=True)
    frequency = Column(String(20), default="weekly", nullable=False)  # once | weekly
    due_day = Column(String(20), nullable=True)  # e.g., "Monday" or date string
    status = Column(String(20), default="pending", nullable=False)  # pending | done
    last_completed_at = Column(DateTime, nullable=True)

    flat = relationship("Flat", back_populates="chores")
    assignee = relationship("Member")
    logs = relationship("ChoreLog", back_populates="chore", cascade="all, delete-orphan")


class ChoreLog(Base):
    __tablename__ = "chore_logs"

    id = Column(Integer, primary_key=True, index=True)
    chore_id = Column(Integer, ForeignKey("chores.id"), nullable=False)
    member_id = Column(Integer, ForeignKey("members.id"), nullable=False)
    completed_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    chore = relationship("Chore", back_populates="logs")
    member = relationship("Member")


class Rule(Base):
    __tablename__ = "rules"

    id = Column(Integer, primary_key=True, index=True)
    flat_id = Column(Integer, ForeignKey("flats.id"), nullable=False)
    text = Column(Text, nullable=False)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    approvals = Column(JSON, default=list, nullable=False)  # list of member_ids
    source = Column(String(20), default="manual", nullable=False)  # manual | ai

    flat = relationship("Flat", back_populates="rules")
    creator = relationship("User")


class Listing(Base):
    __tablename__ = "listings"

    id = Column(Integer, primary_key=True, index=True)
    flat_id = Column(Integer, ForeignKey("flats.id"), nullable=True)
    posted_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(200), nullable=False)
    location = Column(String(255), nullable=False)
    rent = Column(Float, nullable=False)
    seats_available = Column(Integer, default=1, nullable=False)
    description = Column(Text, nullable=False)
    tags = Column(JSON, default=list, nullable=False)  # list of string tags
    status = Column(String(20), default="open", nullable=False)  # open | closed
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    flat = relationship("Flat", back_populates="listings")
    poster = relationship("User", back_populates="listings")

