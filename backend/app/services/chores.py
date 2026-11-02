from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta


def rotate_chore_assignment(
    members: List[Dict[str, Any]],  # members in joined_at order: [{"id": 1, ...}, {"id": 2, ...}]
    current_assigned_to: Optional[int]
) -> Optional[int]:
    """
    Moves chore assignment to the next member in joined order, wrapping around.
    If no members exist, returns None.
    If current_assigned_to is not found or None, returns the first member.
    """
    if not members:
        return None
        
    member_ids = [m["id"] for m in members]
    
    if current_assigned_to is None or current_assigned_to not in member_ids:
        return member_ids[0]
        
    current_idx = member_ids.index(current_assigned_to)
    next_idx = (current_idx + 1) % len(member_ids)
    return member_ids[next_idx]


def compute_chore_fairness(
    members: List[Dict[str, Any]],  # [{"id": 1, "name": "Alice"}, ...]
    logs: List[Dict[str, Any]],     # [{"member_id": 1, "completed_at": datetime}, ...]
    period_days: int = 30,
    reference_time: Optional[datetime] = None
) -> Dict[str, Any]:
    """
    Per member, calculates chores completed in the last `period_days` (default 30)
    from ChoreLog, plus percentage share of total.
    """
    now = reference_time or datetime.utcnow()
    cutoff = now - timedelta(days=period_days)
    
    # Filter logs within period
    recent_logs = [log for log in logs if log["completed_at"] >= cutoff]
    total_completed = len(recent_logs)
    
    counts = {m["id"]: 0 for m in members}
    for log in recent_logs:
        m_id = log["member_id"]
        if m_id in counts:
            counts[m_id] += 1
            
    stats = []
    for m in members:
        m_id = m["id"]
        c_count = counts.get(m_id, 0)
        percentage = round((c_count / total_completed * 100.0), 1) if total_completed > 0 else 0.0
        stats.append({
            "member_id": m_id,
            "name": m["name"],
            "completed_count": c_count,
            "percentage_share": percentage
        })
        
    return {
        "period_days": period_days,
        "total_completed": total_completed,
        "stats": stats
    }

