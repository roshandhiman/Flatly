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
  Calculator,
  ShieldCheck,
  Check,
  Sparkles
} from 'lucide-react';

export default function ExpensesPage() {
  const { flat, expenses, settlements, addExpense, deleteExpense, addSettlement, isHydrated } = useStore();
  const [activeTab, setActiveTab] = useState<'expenses' | 'balances'>('expenses');
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState('');
  const [splitBetween, setSplitBetween] = useState<string[]>([]);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [successNote, setSuccessNote] = useState(false);

  // AI Expense Analyzer State
  const [expAiLoading, setExpAiLoading] = useState(false);
  const [expAiResult, setExpAiResult] = useState<{ analysis: string; provider: string } | null>(null);
  const [expAiError, setExpAiError] = useState<string | null>(null);

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

    setTitle('');
    setAmount('');
    setSuccessNote(true);
    setTimeout(() => setSuccessNote(false), 2000);
    setIsSheetOpen(false);
  };

  // Balances
  const balances = calculateBalances(expenses, settlements, members);

  // Total monthly spend
  const totalSpend = expenses.reduce((sum, e) => sum + e.amount, 0);

  // If not hydrated yet
  if (!isHydrated) {
    return (
      <div className="p-8 text-center font-heading font-black text-sm text-[#111]">
        Loading your pad hisab... 💸
      </div>
    );
  }

  // If no flat yet
  if (!flat) {
    return (
      <div className="p-6 md:p-8">
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

  // Qwen AI Expense Analyzer
  const handleExpenseAI = async () => {
    setExpAiLoading(true);
    setExpAiError(null);
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'analyze-expenses',
          payload: {
            flatName: flat?.name,
            totalRent: flat?.rent,
            expenses,
            members,
          },
        }),
      });
      const data = await res.json();
      if (res.ok && data.analysis) {
        setExpAiResult({ analysis: data.analysis, provider: data.provider });
      } else {
        setExpAiError(data.error || 'AI service unreachable. Thodi der baad try karo.');
      }
    } catch {
      setExpAiError('AI service unreachable. Thodi der baad try karo.');
    } finally {
      setExpAiLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      {/* Top Bar with back link & title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/live"
            className="w-9 h-9 rounded-[10px] bg-white border-[2px] border-[#111] shadow-[2px_2px_0_#111] flex items-center justify-center hover:bg-gray-100"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="font-heading text-xl md:text-2xl font-black text-[#111]">
              Hisab-Kitab (Expenses) 💸
            </h1>
            <p className="text-xs font-semibold text-gray-500">
              {flat.name} • Splitting bills among {members.length} flatmates
            </p>
          </div>
        </div>

        <Button onClick={handleOpenAdd} size="md" variant="primary" className="self-start sm:self-auto">
          <Plus size={16} />
          <span>+ Add Expense</span>
        </Button>
      </div>

      {/* Main Responsive Grid Layout (Desktop 2-Col, Mobile 1-Col) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Section: Expenses Feed & Balances (Col 7) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Spend Counter Card */}
          <div className="p-5 bg-white border-[2.5px] border-[#111] rounded-[20px] shadow-[5px_5px_0_#111]">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-black uppercase text-gray-500 tracking-wider">
                  TOTAL SPEND RECORDED
                </span>
                <div className="font-heading font-black text-2xl md:text-3xl text-[#111] mt-0.5">
                  {formatINR(totalSpend)}
                </div>
                <p className="text-xs text-gray-500 font-semibold mt-1">
                  Across {expenses.length} transactions
                </p>
              </div>
              <div className="w-12 h-12 rounded-[14px] bg-[#FFD23F] border-[2px] border-[#111] flex items-center justify-center text-2xl shadow-[2.5px_2.5px_0_#111]">
                🧾
              </div>
            </div>
          </div>

          {/* Tab Switcher: Expenses | Balances */}
          <div className="flex gap-2 p-1.5 bg-white border-[2px] border-[#111] rounded-[16px] shadow-[3px_3px_0_#111]">
            <button
              onClick={() => setActiveTab('expenses')}
              className={`flex-1 py-2 rounded-[10px] text-xs font-black transition-all cursor-pointer ${
                activeTab === 'expenses'
                  ? 'bg-[#FFD23F] text-[#111] shadow-[2px_2px_0_#111] border-[1.5px] border-[#111]'
                  : 'text-gray-500 hover:text-[#111]'
              }`}
            >
              All Expenses ({expenses.length})
            </button>
            <button
              onClick={() => setActiveTab('balances')}
              className={`flex-1 py-2 rounded-[10px] text-xs font-black transition-all cursor-pointer ${
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
            <div className="space-y-4">
              {expenses.length === 0 ? (
                <EmptyState
                  emoji="💸"
                  title="Koi kharcha nahi!"
                  description="No expenses recorded yet. Add your first grocery or electricity bill."
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
                      className="p-4 bg-white border-[2.5px] border-[#111] rounded-[18px] shadow-[4px_4px_0_#111] space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-heading font-black text-base text-[#111]">
                            {expense.title}
                          </h3>
                          <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                            <Avatar
                              name={payer?.name || 'User'}
                              color={payer?.avatarColor || '#FFD23F'}
                              size="sm"
                            />
                            <span>
                              Paid by <strong className="text-[#111]">{payer?.name || 'Someone'}</strong>
                            </span>
                            <span>·</span>
                            <span>{formatDate(expense.date)}</span>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="font-heading font-black text-lg md:text-xl text-[#111]">
                            {formatINR(expense.amount)}
                          </div>
                          <span className="text-[11px] font-bold text-gray-500">
                            {formatINR(perPersonShare)} / share
                          </span>
                        </div>
                      </div>

                      {/* Split avatars & Delete action */}
                      <div className="flex items-center justify-between pt-2.5 border-t-[1.5px] border-gray-100">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold text-gray-500">
                            Split among {splitMembers.length}:
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
                          className="p-1.5 text-gray-400 hover:text-red-600 transition-colors cursor-pointer"
                          title="Delete expense"
                        >
                          <Trash2 size={16} />
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
            <div className="space-y-4">
              {balances.length === 0 ? (
                <EmptyState
                  emoji="🎉"
                  title="Sab Hisab Barabar!"
                  description="No outstanding dues. Everyone is completely settled up."
                />
              ) : (
                balances.map((balance, idx) => {
                  const debtor = members.find((m) => m.id === balance.from);
                  const creditor = members.find((m) => m.id === balance.to);

                  return (
                    <div
                      key={`${balance.from}-${balance.to}-${idx}`}
                      className="p-4 bg-white border-[2.5px] border-[#111] rounded-[18px] shadow-[4px_4px_0_#111] flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
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
                          <div className="text-xs md:text-sm font-black text-[#111]">
                            {debtor?.name} owes {creditor?.name}
                          </div>
                          <div className="font-heading font-black text-base text-[#FF3B3B]">
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
                        <CheckCircle size={15} />
                        <span>Settle</span>
                      </Button>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Right Section: Add Expense Sidebar Form & Settle-Up Explainer (Col 5) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Direct Add Form Card on Desktop */}
          <div className="p-6 bg-white border-[2.5px] border-[#111] rounded-[24px] shadow-[6px_6px_0_#111] space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b-[2px] border-[#111]">
              <Receipt size={18} />
              <h2 className="font-heading font-black text-base md:text-lg text-[#111]">
                Quick Split an Expense
              </h2>
            </div>

            {successNote && (
              <div className="p-3 bg-[#3DDC97] text-[#111] rounded-[10px] border-[1.5px] border-[#111] text-xs font-black flex items-center gap-1.5 shadow-[2px_2px_0_#111]">
                <Check size={16} strokeWidth={3} />
                <span>Expense added and hisab updated!</span>
              </div>
            )}

            {members.length === 0 ? (
              <p className="text-xs text-gray-500 font-semibold py-4 text-center">
                Add roommates to your flat first before splitting expenses!
              </p>
            ) : (
              <form onSubmit={handleSubmitExpense} className="space-y-4">
                <Input
                  label="Expense Title"
                  placeholder="e.g. WiFi Bill, Swiggy Instamart"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (formErrors.title) setFormErrors({ ...formErrors, title: '' });
                  }}
                  error={formErrors.title}
                />

                <Input
                  label="Amount (₹)"
                  placeholder="e.g. 1500"
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
                  <label className="block text-xs font-black uppercase tracking-wider text-gray-600">
                    Who Paid?
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
                            : 'bg-white shadow-[1px_1px_0_#111]'
                        }`}
                      >
                        <Avatar name={m.name} color={m.avatarColor} size="sm" />
                        <span className="truncate">{m.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Split between */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-black uppercase tracking-wider text-gray-600">
                    Split Among Flatmates
                  </label>
                  <div className="space-y-1.5">
                    {members.map((m) => {
                      const isChecked = splitBetween.includes(m.id);
                      return (
                        <label
                          key={m.id}
                          className={`flex items-center justify-between p-2 rounded-[10px] border-[1.5px] border-[#111] cursor-pointer transition-all ${
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
                </div>

                <Button type="submit" variant="primary" fullWidth size="lg">
                  <Plus size={16} />
                  <span>Save & Split Expense</span>
                </Button>
              </form>
            )}
          </div>

          {/* Settle Up Info Card */}
          <div className="p-5 bg-[#FFF8EC] border-[2.5px] border-[#111] rounded-[20px] shadow-[5px_5px_0_#111] space-y-2">
            <div className="flex items-center gap-2">
              <Calculator size={18} />
              <h4 className="font-heading font-black text-sm text-[#111]">
                Zero-Loss Greedy Minimization
              </h4>
            </div>
            <p className="text-xs font-semibold text-gray-600 leading-relaxed">
              Flatly automatically pairs the biggest debtor with the biggest creditor. This minimizes the number of bank/UPI transfers needed and guarantees net balances sum to <strong>₹0.00</strong>.
            </p>
          </div>

          {/* AI Expense Advisor Card (cloud LLM: Groq / Gemini) */}
          <div className="p-6 bg-[#6EC6FF]/20 border-[2.5px] border-[#111] rounded-[24px] shadow-[6px_6px_0_#111] space-y-4">
            <div className="flex items-center justify-between pb-2 border-b-[2px] border-[#111]">
              <div className="flex items-center gap-2">
                <span className="text-xl">🤖</span>
                <h3 className="font-heading font-black text-sm text-[#111]">AI Expense Advisor</h3>
              </div>
              <span className="px-2 py-0.5 bg-[#3DDC97] border border-[#111] rounded-full text-[10px] font-black shadow-[1px_1px_0_#111]">
                {expAiResult ? expAiResult.provider.split('(')[1]?.replace(')', '') || 'Cloud AI' : 'Live AI'}
              </span>
            </div>
            <p className="text-xs font-semibold text-gray-700">
              Your flat&apos;s hisab is analyzed by a real cloud AI model — only live provider output is shown, no canned/fake text.
            </p>
            {expAiError && (
              <div className="p-4 bg-[#FF6B57]/15 border-[2px] border-[#FF6B57] rounded-[16px] space-y-1.5 shadow-[2px_2px_0_#111]">
                <div className="text-[10px] font-black text-[#FF3B30] uppercase">AI UNAVAILABLE</div>
                <div className="text-xs font-medium text-gray-800">{expAiError}</div>
              </div>
            )}
            {expAiResult && (
              <div className="p-4 bg-white border-[2px] border-[#111] rounded-[16px] space-y-2 shadow-[2px_2px_0_#111]">
                <div className="text-[10px] font-black text-emerald-700 pb-1 border-b border-gray-100">{expAiResult.provider}</div>
                <div className="text-xs font-medium text-gray-800 leading-relaxed whitespace-pre-line">{expAiResult.analysis}</div>
              </div>
            )}
            <Button type="button" variant="secondary" fullWidth size="md" disabled={expAiLoading} onClick={handleExpenseAI}>
              <Sparkles size={16} />
              <span>{expAiLoading ? 'AI is Analyzing Hisab...' : expAiResult ? 'Re-Analyze Expenses' : 'Analyze Hisab with AI'}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Add Expense Bottom Sheet (Mobile fallback) */}
      <BottomSheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        title="Add Expense 💸"
      >
        <form onSubmit={handleSubmitExpense} className="space-y-4">
          <Input
            label="Expense Title"
            placeholder="e.g. WiFi Bill, Groceries, Milk"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            error={formErrors.title}
          />

          <Input
            label="Amount (₹)"
            placeholder="e.g. 1200"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
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
                  className={`flex items-center gap-2 p-2 rounded-[10px] border-[2px] border-[#111] text-xs font-bold transition-all ${
                    paidBy === m.id ? 'bg-[#FFD23F]' : 'bg-white'
                  }`}
                >
                  <Avatar name={m.name} color={m.avatarColor} size="sm" />
                  <span className="truncate">{m.name}</span>
                </button>
              ))}
            </div>
          </div>

          <Button type="submit" variant="primary" fullWidth size="lg">
            <span>Save & Split</span>
          </Button>
        </form>
      </BottomSheet>
    </div>
  );
}
