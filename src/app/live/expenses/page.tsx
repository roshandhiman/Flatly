'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useStore } from '@/lib/store';
import { calculateBalances } from '@/lib/balance';
import { formatINR, formatDate } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Avatar } from '@/components/ui/Avatar';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Plus,
  Receipt,
  Trash2,
  Users,
  Wallet,
} from 'lucide-react';

export default function ExpensesPage() {
  const { flat, expenses, settlements, addExpense, deleteExpense, addSettlement } = useStore();
  const [activeTab, setActiveTab] = useState<'expenses' | 'balances'>('expenses');
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState('');
  const [splitBetween, setSplitBetween] = useState<string[]>([]);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const members = flat?.members || [];

  // Initialize modal defaults when opening
  const handleOpenAdd = () => {
    setTitle('');
    setAmount('');
    setPaidBy(members[0]?.id || '');
    setSplitBetween(members.map((m) => m.id));
    setFormErrors({});
    setIsSheetOpen(true);
  };

  const handleToggleSplitMember = (memberId: string) => {
    setSplitBetween((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId]
    );
  };

  const handleSubmitExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!title.trim()) errors.title = 'Title is required (e.g. Groceries)';
    const parsedAmount = parseFloat(amount);
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      errors.amount = 'Enter a valid amount';
    }
    if (!paidBy) errors.paidBy = 'Please select who paid';
    if (splitBetween.length === 0) {
      errors.split = 'Select at least one member to split with';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    addExpense({
      title: title.trim(),
      amount: parsedAmount,
      paidBy,
      splitBetween,
      date: new Date().toISOString(),
    });

    setIsSheetOpen(false);
  };

  // Balances
  const balances = calculateBalances(expenses, settlements, members);

  // Total monthly spend
  const totalSpend = expenses.reduce((sum, e) => sum + e.amount, 0);

  // If no flat yet
  if (!flat) {
    return (
      <div className="p-4">
        <EmptyState
          emoji="🏠"
          title="No Flat Connected"
          description="You need to create or join a flat first before managing expenses."
          actionLabel="Go to Flat Setup"
          onAction={() => (window.location.href = '/live')}
        />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Top Bar with back link & title */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link
            href="/live"
            className="w-8 h-8 rounded-[8px] bg-white border-[2px] border-[#111] shadow-[2px_2px_0_#111] flex items-center justify-center hover:bg-gray-100"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="font-heading text-xl font-black text-[#111]">
              Hisab-Kitab
            </h1>
            <p className="text-[11px] font-semibold text-gray-500">
              {flat.name}
            </p>
          </div>
        </div>

        <Button onClick={handleOpenAdd} size="sm" variant="primary">
          <Plus size={16} />
          <span>Add Expense</span>
        </Button>
      </div>

      {/* Spend Counter Card */}
      <div className="p-4 bg-white border-[2.5px] border-[#111] rounded-[16px] shadow-[4px_4px_0_#111]">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[11px] font-black uppercase text-gray-500 tracking-wider">
              TOTAL SPEND RECORDED
            </span>
            <div className="font-heading font-black text-2xl text-[#111] mt-0.5">
              {formatINR(totalSpend)}
            </div>
          </div>
          <div className="w-10 h-10 rounded-[10px] bg-[#FFD23F] border-[2px] border-[#111] flex items-center justify-center text-xl shadow-[2px_2px_0_#111]">
            🧾
          </div>
        </div>
      </div>

      {/* Tab Switcher: Expenses | Balances */}
      <div className="flex gap-2 p-1 bg-white border-[2px] border-[#111] rounded-[12px] shadow-[3px_3px_0_#111]">
        <button
          onClick={() => setActiveTab('expenses')}
          className={`flex-1 py-1.5 rounded-[8px] text-xs font-black transition-all cursor-pointer ${
            activeTab === 'expenses'
              ? 'bg-[#FFD23F] text-[#111] shadow-[2px_2px_0_#111] border-[1.5px] border-[#111]'
              : 'text-gray-500 hover:text-[#111]'
          }`}
        >
          Expenses ({expenses.length})
        </button>
        <button
          onClick={() => setActiveTab('balances')}
          className={`flex-1 py-1.5 rounded-[8px] text-xs font-black transition-all cursor-pointer ${
            activeTab === 'balances'
              ? 'bg-[#FFD23F] text-[#111] shadow-[2px_2px_0_#111] border-[1.5px] border-[#111]'
              : 'text-gray-500 hover:text-[#111]'
          }`}
        >
          Kaun Kisko Dega ({balances.length})
        </button>
      </div>

      {/* TAB 1: EXPENSES LIST */}
      {activeTab === 'expenses' && (
        <div className="space-y-3">
          {expenses.length === 0 ? (
            <EmptyState
              emoji="💸"
              title="Koi kharcha nahi!"
              description="No expenses recorded yet. Tap + Add Expense to split your first grocery or electricity bill."
              actionLabel="+ Add First Expense"
              onAction={handleOpenAdd}
            />
          ) : (
            expenses.map((expense) => {
              const payer = members.find((m) => m.id === expense.paidBy);
              const splitMembers = members.filter((m) =>
                expense.splitBetween.includes(m.id)
              );
              const perPersonShare =
                expense.amount / (expense.splitBetween.length || 1);

              return (
                <div
                  key={expense.id}
                  className="p-3.5 bg-white border-[2.5px] border-[#111] rounded-[14px] shadow-[3px_3px_0_#111] space-y-2.5"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-heading font-black text-sm text-[#111]">
                        {expense.title}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-0.5">
                        <Avatar
                          name={payer?.name || 'User'}
                          color={payer?.avatarColor || '#FFD23F'}
                          size="sm"
                        />
                        <span>
                          Paid by{' '}
                          <strong className="text-[#111]">
                            {payer?.name || 'Someone'}
                          </strong>
                        </span>
                        <span>·</span>
                        <span>{formatDate(expense.date)}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-heading font-black text-base text-[#111]">
                        {formatINR(expense.amount)}
                      </div>
                      <span className="text-[10px] font-bold text-gray-500">
                        {formatINR(perPersonShare)} / person
                      </span>
                    </div>
                  </div>

                  {/* Split avatars & Delete action */}
                  <div className="flex items-center justify-between pt-2 border-t-[1.5px] border-gray-100">
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] font-bold text-gray-500 mr-1">
                        Split ({splitMembers.length}):
                      </span>
                      <div className="flex -space-x-1.5">
                        {splitMembers.map((sm) => (
                          <Avatar
                            key={sm.id}
                            name={sm.name}
                            color={sm.avatarColor}
                            size="sm"
                          />
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => deleteExpense(expense.id)}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors cursor-pointer"
                      title="Delete expense"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB 2: BALANCES (KAUN KISKO DEGA) */}
      {activeTab === 'balances' && (
        <div className="space-y-3">
          {balances.length === 0 ? (
            <EmptyState
              emoji="🎉"
              title="Sab Hisab Barabar!"
              description="No outstanding dues. Everyone is all squared up."
            />
          ) : (
            balances.map((balance, idx) => {
              const debtor = members.find((m) => m.id === balance.from);
              const creditor = members.find((m) => m.id === balance.to);

              return (
                <div
                  key={`${balance.from}-${balance.to}-${idx}`}
                  className="p-3.5 bg-white border-[2.5px] border-[#111] rounded-[14px] shadow-[3px_3px_0_#111] flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2.5">
                    <Avatar
                      name={debtor?.name || 'A'}
                      color={debtor?.avatarColor || '#FF6B57'}
                      size="md"
                    />
                    <ArrowRight size={16} className="text-gray-400" />
                    <Avatar
                      name={creditor?.name || 'B'}
                      color={creditor?.avatarColor || '#3DDC97'}
                      size="md"
                    />
                    <div>
                      <div className="text-xs font-black text-[#111]">
                        {debtor?.name} owes {creditor?.name}
                      </div>
                      <div className="font-heading font-black text-sm text-[#FF3B3B]">
                        {formatINR(balance.amount)}
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={() =>
                      addSettlement(balance.from, balance.to, balance.amount)
                    }
                    variant="mint"
                    size="sm"
                  >
                    <CheckCircle size={14} />
                    <span>Settle</span>
                  </Button>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Add Expense Bottom Sheet */}
      <BottomSheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        title="Add Expense 💸"
      >
        {members.length === 0 ? (
          <div className="text-center py-4 space-y-3">
            <p className="text-sm font-bold text-gray-700">
              You need flatmates to split with! Add roommates to your flat first.
            </p>
            <Button
              onClick={() => {
                setIsSheetOpen(false);
                window.location.href = '/live';
              }}
              variant="primary"
            >
              Add Flatmates
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmitExpense} className="space-y-4">
            <Input
              label="Expense Title"
              placeholder="e.g. WiFi Bill, Groceries, Milk"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (formErrors.title) setFormErrors({ ...formErrors, title: '' });
              }}
              error={formErrors.title}
            />

            <Input
              label="Amount (₹)"
              placeholder="e.g. 1200"
              type="number"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                if (formErrors.amount) setFormErrors({ ...formErrors, amount: '' });
              }}
              error={formErrors.amount}
            />

            {/* Paid By selector */}
            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-[#111]">
                Paid By
              </label>
              <div className="grid grid-cols-2 gap-2">
                {members.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaidBy(m.id)}
                    className={`flex items-center gap-2 p-2 rounded-[10px] border-[2px] border-[#111] text-xs font-bold transition-all cursor-pointer ${
                      paidBy === m.id
                        ? 'bg-[#FFD23F] shadow-[2px_2px_0_#111]'
                        : 'bg-white shadow-[2px_2px_0_#111]'
                    }`}
                  >
                    <Avatar name={m.name} color={m.avatarColor} size="sm" />
                    <span className="truncate">{m.name}</span>
                  </button>
                ))}
              </div>
              {formErrors.paidBy && (
                <p className="text-xs font-bold text-red-600">{formErrors.paidBy}</p>
              )}
            </div>

            {/* Split between checkboxes */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-bold text-[#111]">
                  Split Between (Equal Shares)
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setSplitBetween(
                      splitBetween.length === members.length
                        ? [members[0]?.id || '']
                        : members.map((m) => m.id)
                    )
                  }
                  className="text-xs font-bold text-blue-600 underline cursor-pointer"
                >
                  {splitBetween.length === members.length ? 'Deselect all' : 'Select all'}
                </button>
              </div>

              <div className="space-y-1.5">
                {members.map((m) => {
                  const isChecked = splitBetween.includes(m.id);
                  return (
                    <label
                      key={m.id}
                      className={`flex items-center justify-between p-2 rounded-[10px] border-[2px] border-[#111] cursor-pointer transition-all ${
                        isChecked ? 'bg-yellow-50' : 'bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Avatar name={m.name} color={m.avatarColor} size="sm" />
                        <span className="text-xs font-bold text-[#111]">{m.name}</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleSplitMember(m.id)}
                        className="w-4 h-4 accent-[#111]"
                      />
                    </label>
                  );
                })}
              </div>
              {formErrors.split && (
                <p className="text-xs font-bold text-red-600">{formErrors.split}</p>
              )}
            </div>

            <Button type="submit" variant="primary" fullWidth size="lg">
              <span>Save & Split</span>
              <Receipt size={18} />
            </Button>
          </form>
        )}
      </BottomSheet>
    </div>
  );
}

