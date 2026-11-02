import { Expense, Settlement, Member } from './types';

export interface Balance {
  from: string; // member id
  to: string; // member id
  amount: number; // positive means "from" owes "to"
}

/**
 * Calculate balances from expenses and settlements.
 * Returns simplified debts: who owes whom and how much.
 * Pure function - no side effects.
 */
export function calculateBalances(
  expenses: Expense[],
  settlements: Settlement[],
  members: Member[]
): Balance[] {
  // Net balance for each member (positive = they are owed, negative = they owe)
  const netBalance: Record<string, number> = {};

  // Initialize all members to 0
  members.forEach(m => { netBalance[m.id] = 0; });

  // Process expenses
  expenses.forEach(expense => {
    const splitCount = expense.splitBetween.length;
    if (splitCount === 0) return;

    const sharePerPerson = expense.amount / splitCount;

    // The payer gets credited
    if (netBalance[expense.paidBy] !== undefined) {
      netBalance[expense.paidBy] += expense.amount;
    }

    // Each person in the split gets debited
    expense.splitBetween.forEach(memberId => {
      if (netBalance[memberId] !== undefined) {
        netBalance[memberId] -= sharePerPerson;
      }
    });
  });

  // Process settlements
  settlements.forEach(s => {
    if (netBalance[s.from] !== undefined) {
      netBalance[s.from] += s.amount; // settler's debt reduces
    }
    if (netBalance[s.to] !== undefined) {
      netBalance[s.to] -= s.amount; // creditor's credit reduces
    }
  });

  // Simplify debts using the greedy algorithm
  const debtors: { id: string; amount: number }[] = [];
  const creditors: { id: string; amount: number }[] = [];

  Object.entries(netBalance).forEach(([id, balance]) => {
    if (balance < -0.01) {
      debtors.push({ id, amount: -balance }); // amount they owe (positive)
    } else if (balance > 0.01) {
      creditors.push({ id, amount: balance }); // amount they are owed (positive)
    }
  });

  // Sort for greedy matching
  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  const balances: Balance[] = [];

  let i = 0, j = 0;
  while (i < debtors.length && j < creditors.length) {
    const amount = Math.min(debtors[i].amount, creditors[j].amount);
    if (amount > 0.01) {
      balances.push({
        from: debtors[i].id,
        to: creditors[j].id,
        amount: Math.round(amount * 100) / 100,
      });
    }
    debtors[i].amount -= amount;
    creditors[j].amount -= amount;
    if (debtors[i].amount < 0.01) i++;
    if (creditors[j].amount < 0.01) j++;
  }

  return balances;
}

/**
 * Get total balance for a specific member.
 * Positive = they get money, negative = they owe money.
 */
export function getMemberBalance(
  memberId: string,
  balances: Balance[]
): number {
  let total = 0;
  balances.forEach(b => {
    if (b.from === memberId) total -= b.amount;
    if (b.to === memberId) total += b.amount;
  });
  return Math.round(total * 100) / 100;
}
