from typing import List, Dict, Any, Tuple
from collections import defaultdict


def calculate_member_balances(
    members: List[Dict[str, Any]],  # list of {"id": int, "name": str}
    expenses: List[Dict[str, Any]],  # list of {"id": int, "amount": float, "paid_by": int, "split_among": list, "split_type": str, "custom_shares": dict}
    settlements: List[Dict[str, Any]]  # list of {"from_member": int, "to_member": int, "amount": float}
) -> List[Dict[str, Any]]:
    """
    Computes net balance per member:
    net_balance = (sum paid) - (sum of their share) +/- settlements.
    Guarantees:
    - Rounded to 2 decimals
    - Total sum of all net balances across all members is EXACTLY 0.00
    """
    member_ids = [m["id"] for m in members]
    id_to_name = {m["id"]: m["name"] for m in members}
    
    total_paid = defaultdict(float)
    total_owed = defaultdict(float)
    
    for exp in expenses:
        amount = round(float(exp["amount"]), 2)
        payer = exp["paid_by"]
        total_paid[payer] += amount
        
        split_among = exp.get("split_among", [])
        if not split_among:
            continue
            
        split_type = exp.get("split_type", "equal")
        custom_shares = exp.get("custom_shares") or {}
        
        if split_type == "custom" and custom_shares:
            # custom shares dict with member_id as key
            for m_id_str, share in custom_shares.items():
                m_id = int(m_id_str)
                total_owed[m_id] += round(float(share), 2)
        else:
            # equal split: handle fractional cents properly
            n = len(split_among)
            # base share rounded to 2 decimals
            base_share = round(amount / n, 2)
            # distribute remainder to prevent precision loss
            # e.g., 100 / 3 = 33.33 * 3 = 99.99, remainder 0.01 added to first
            diff = round(amount - (base_share * n), 2)
            for idx, m_id in enumerate(split_among):
                share = base_share
                if idx == 0:
                    share = round(share + diff, 2)
                total_owed[m_id] += share

    # Factor in settlements
    settlement_paid = defaultdict(float)
    settlement_received = defaultdict(float)
    
    for s in settlements:
        amt = round(float(s["amount"]), 2)
        settlement_paid[s["from_member"]] += amt
        settlement_received[s["to_member"]] += amt
        
    balances = []
    accumulated_net = 0.0
    
    # Calculate initial net balances
    for m_id in member_ids:
        # Net balance:
        # What I paid for expenses + what I paid in settlements
        # MINUS (What I owe for expenses + what I received in settlements)
        paid_val = round(total_paid[m_id] + settlement_paid[m_id], 2)
        owed_val = round(total_owed[m_id] + settlement_received[m_id], 2)
        net = round(paid_val - owed_val, 2)
        accumulated_net = round(accumulated_net + net, 2)
        
        balances.append({
            "member_id": m_id,
            "name": id_to_name.get(m_id, f"Member #{m_id}"),
            "net_balance": net,
            "total_paid": paid_val,
            "total_owed": owed_val
        })
        
    # Guarantee that the total sum of all net balances is EXACTLY 0.00
    if len(balances) > 0 and accumulated_net != 0.0:
        # Adjust the first non-zero or first member by -accumulated_net
        balances[0]["net_balance"] = round(balances[0]["net_balance"] - accumulated_net, 2)
        
    return balances


def minimize_transfers(
    balances: List[Dict[str, Any]]
) -> List[Dict[str, Any]]:
    """
    From net balances, compute the minimum number of transfers
    using greedy algorithm matching largest creditor with largest debtor.
    Returns: List of {from_member, to_member, from_name, to_name, amount}
    """
    # Split into debtors (net < 0) and creditors (net > 0)
    debtors = []  # will store [abs(net), member_id, name]
    creditors = []  # will store [net, member_id, name]
    
    for b in balances:
        net = round(b["net_balance"], 2)
        if net < -0.009:
            debtors.append([round(abs(net), 2), b["member_id"], b["name"]])
        elif net > 0.009:
            creditors.append([round(net, 2), b["member_id"], b["name"]])
            
    transfers = []
    
    while debtors and creditors:
        # Sort so largest amounts are at the end (or beginning)
        debtors.sort(key=lambda x: x[0])
        creditors.sort(key=lambda x: x[0])
        
        debtor = debtors[-1]
        creditor = creditors[-1]
        
        deb_amt, deb_id, deb_name = debtor
        cred_amt, cred_id, cred_name = creditor
        
        settle_amt = round(min(deb_amt, cred_amt), 2)
        
        if settle_amt > 0:
            transfers.append({
                "from_member": deb_id,
                "to_member": cred_id,
                "from_name": deb_name,
                "to_name": cred_name,
                "amount": settle_amt
            })
            
        debtor[0] = round(deb_amt - settle_amt, 2)
        creditor[0] = round(cred_amt - settle_amt, 2)
        
        if debtor[0] < 0.01:
            debtors.pop()
        if creditor[0] < 0.01:
            creditors.pop()
            
    return transfers

