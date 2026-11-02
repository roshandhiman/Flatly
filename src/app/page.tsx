'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { calculateBalances, getMemberBalance } from '@/lib/balance';
import { formatINR } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ArrowRight, CheckCircle2, Home, PlusCircle, Search, Sparkles, Users, Zap } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const { profile, flat, expenses, settlements, chores, markChoreDone } = useStore();
  const [selectedMode, setSelectedMode] = useState<'find' | 'live'>('live');

  // Find user's member ID in flat if matched by name
  const userMember = flat?.members.find(
    (m) => m.name.toLowerCase() === profile?.name.toLowerCase() || m.name.includes('(You)')
  ) || flat?.members[0];

  const balances = flat ? calculateBalances(expenses, settlements, flat.members) : [];
  
  // Specific user balances
  const userOwes = userMember
    ? balances.filter((b) => b.from === userMember.id)
    : [];
  const owesUser = userMember
    ? balances.filter((b) => b.to === userMember.id)
    : [];

  const netUserBalance = userMember ? getMemberBalance(userMember.id, balances) : 0;

  // Today's chore
  const todayChore = chores.find((c) => c.status === 'pending') || chores[0];
  const choreAssignee = todayChore
    ? flat?.members.find((m) => m.id === todayChore.assignedTo)
    : null;

  return (
    <div className="p-4 space-y-4">
      {/* Top Welcome & Flat badge */}
      <div className="flex items-start justify-between gap-2 pt-1">
        <div>
          <h1 className="font-heading text-2xl font-black text-[#111] flex items-center gap-1.5">
            Hey {profile?.name || 'Dost'}! 👋
          </h1>
          <p className="text-xs font-semibold text-gray-500 mt-0.5">
            Welcome to your shared living space
          </p>
        </div>

        {flat ? (
          <Link
            href="/live"
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border-[2px] border-[#111] rounded-full shadow-[2px_2px_0_#111] text-xs font-bold hover:bg-[#FFD23F] transition-colors"
          >
            <span className="w-2 h-2 rounded-full bg-[#3DDC97] animate-pulse" />
            <span className="truncate max-w-[130px]">{flat.name}</span>
          </Link>
        ) : (
          <Link
            href="/live"
            className="inline-flex items-center gap-1 px-3 py-1 bg-[#FFD23F] border-[2px] border-[#111] rounded-full shadow-[2px_2px_0_#111] text-xs font-bold hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
          >
            <PlusCircle size={14} />
            <span>Setup Flat</span>
          </Link>
        )}
      </div>

      {/* Mode Switcher Toggle */}
      <div className="flex gap-2 p-1.5 bg-white border-[2.5px] border-[#111] rounded-[16px] shadow-[4px_4px_0_#111]">
        <button
          onClick={() => setSelectedMode('find')}
          className={`flex-1 py-2 rounded-[12px] font-heading font-black text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            selectedMode === 'find'
              ? 'bg-[#FFD23F] text-[#111] border-[2px] border-[#111] shadow-[2px_2px_0_#111]'
              : 'text-gray-500 hover:text-[#111]'
          }`}
        >
          <Search size={16} strokeWidth={2.5} />
          <span>Find Flat</span>
        </button>
        <button
          onClick={() => setSelectedMode('live')}
          className={`flex-1 py-2 rounded-[12px] font-heading font-black text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            selectedMode === 'live'
              ? 'bg-[#FFD23F] text-[#111] border-[2px] border-[#111] shadow-[2px_2px_0_#111]'
              : 'text-gray-500 hover:text-[#111]'
          }`}
        >
          <Zap size={16} strokeWidth={2.5} />
          <span>Live Mode</span>
        </button>
      </div>

      {/* Action Cards: Find & Post */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/find?tab=rooms"
          className="group block p-3.5 bg-white border-[2.5px] border-[#111] rounded-[16px] shadow-[4px_4px_0_#111] hover:shadow-[2px_2px_0_#111] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
        >
          <div className="w-9 h-9 rounded-[10px] bg-[#6EC6FF] border-[2px] border-[#111] flex items-center justify-center text-lg mb-2 shadow-[2px_2px_0_#111]">
            🔍
          </div>
          <h3 className="font-heading font-black text-sm text-[#111] leading-tight mb-1">
            Mujhe flat chahiye
          </h3>
          <p className="text-[11px] font-semibold text-gray-500">
            Browse rooms & vacancies
          </p>
        </Link>

        <Link
          href="/find?tab=post"
          className="group block p-3.5 bg-white border-[2.5px] border-[#111] rounded-[16px] shadow-[4px_4px_0_#111] hover:shadow-[2px_2px_0_#111] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
        >
          <div className="w-9 h-9 rounded-[10px] bg-[#FFD23F] border-[2px] border-[#111] flex items-center justify-center text-lg mb-2 shadow-[2px_2px_0_#111]">
            📢
          </div>
          <h3 className="font-heading font-black text-sm text-[#111] leading-tight mb-1">
            Roommate chahiye
          </h3>
          <p className="text-[11px] font-semibold text-gray-500">
            Post an open vacancy
          </p>
        </Link>
      </div>

      {/* Flat Summary Section OR Empty Flat Card */}
      {flat ? (
        <div className="space-y-4">
          {/* Balance Summary Card: Kaun kisko dega? */}
          <Card className="bg-white">
            <div className="flex items-center justify-between pb-3 border-b-[2px] border-[#111] mb-3">
              <h2 className="font-heading font-black text-base text-[#111] flex items-center gap-1.5">
                <span>Kaun kisko dega?</span>
              </h2>
              <span className="text-xs font-bold text-gray-500">
                {expenses.length} expenses
              </span>
            </div>

            {balances.length === 0 ? (
              <div className="py-4 text-center">
                <p className="text-sm font-bold text-gray-600">
                  🎉 Sab hisab barabar! All settled up.
                </p>
                <Link
                  href="/live/expenses"
                  className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-[#111] underline"
                >
                  View expense history &rarr;
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {/* Highlights */}
                {userOwes.slice(0, 1).map((b, idx) => {
                  const creditor = flat.members.find((m) => m.id === b.to);
                  return (
                    <div
                      key={`owe-${idx}`}
                      className="flex items-center justify-between p-2.5 bg-[#FFF0F0] border-[2px] border-[#111] rounded-[10px]"
                    >
                      <span className="text-xs font-bold text-[#111]">
                        You owe {creditor?.name || 'flatmate'}
                      </span>
                      <span className="text-xs font-black px-2 py-0.5 bg-[#FF3B3B] text-white rounded-[6px] border-[1.5px] border-[#111]">
                        {formatINR(b.amount)}
                      </span>
                    </div>
                  );
                })}

                {owesUser.slice(0, 1).map((b, idx) => {
                  const debtor = flat.members.find((m) => m.id === b.from);
                  return (
                    <div
                      key={`get-${idx}`}
                      className="flex items-center justify-between p-2.5 bg-[#E6F9F0] border-[2px] border-[#111] rounded-[10px]"
                    >
                      <span className="text-xs font-bold text-[#111]">
                        {debtor?.name || 'Flatmate'} owes you
                      </span>
                      <span className="text-xs font-black px-2 py-0.5 bg-[#3DDC97] text-[#111] rounded-[6px] border-[1.5px] border-[#111]">
                        {formatINR(b.amount)}
                      </span>
                    </div>
                  );
                })}

                {userOwes.length === 0 && owesUser.length === 0 && balances.length > 0 && (
                  <div className="p-2.5 bg-gray-50 border-[2px] border-[#111] rounded-[10px] text-xs font-bold text-gray-600">
                    {balances[0].amount ? (
                      <span>
                        {flat.members.find((m) => m.id === balances[0].from)?.name} owes{' '}
                        {flat.members.find((m) => m.id === balances[0].to)?.name}:{' '}
                        {formatINR(balances[0].amount)}
                      </span>
                    ) : null}
                  </div>
                )}

                <Button
                  onClick={() => router.push('/live/expenses')}
                  variant="primary"
                  fullWidth
                  size="md"
                  className="mt-3"
                >
                  <CheckCircle2 size={16} />
                  <span>Settle Up / View Hisab</span>
                </Button>
              </div>
            )}
          </Card>

          {/* Today's Chore: AAJ KI BAARI */}
          {todayChore ? (
            <div className="p-4 bg-[#3DDC97] border-[2.5px] border-[#111] rounded-[16px] shadow-[4px_4px_0_#111] text-[#111]">
              <div className="flex items-center justify-between mb-2">
                <span className="px-2.5 py-0.5 bg-[#111] text-[#FFF8EC] text-[10px] font-black uppercase tracking-wider rounded-full">
                  AAJ KI BAARI
                </span>
                <span className="text-xs font-bold">
                  Due {todayChore.dueDay}
                </span>
              </div>

              <h3 className="font-heading font-black text-lg text-[#111] leading-tight">
                {todayChore.task}
              </h3>
              <p className="text-xs font-semibold text-gray-900 mt-1 mb-3">
                Assigned to{' '}
                <span className="font-bold underline">
                  {choreAssignee?.name || 'Roommate'}
                </span>
                . Keep the flat shining!
              </p>

              <div className="flex items-center gap-2">
                {todayChore.status === 'pending' ? (
                  <Button
                    onClick={() => markChoreDone(todayChore.id)}
                    variant="secondary"
                    size="sm"
                    fullWidth
                  >
                    <CheckCircle2 size={16} className="text-[#3DDC97]" />
                    <span>Mark as Done</span>
                  </Button>
                ) : (
                  <div className="w-full py-1.5 text-center bg-white border-[2px] border-[#111] rounded-[10px] text-xs font-bold text-[#111]">
                    ✅ Completed today!
                  </div>
                )}

                <Link
                  href="/live/chores"
                  className="px-3 py-1.5 bg-white border-[2px] border-[#111] rounded-[10px] shadow-[2px_2px_0_#111] text-xs font-bold whitespace-nowrap hover:bg-gray-100 transition-colors"
                >
                  All chores &rarr;
                </Link>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-white border-[2.5px] border-[#111] rounded-[16px] shadow-[4px_4px_0_#111] flex items-center justify-between">
              <div>
                <span className="text-xs font-black uppercase text-gray-400">
                  AAJ KI BAARI
                </span>
                <p className="text-sm font-bold text-[#111]">
                  No chores scheduled yet
                </p>
              </div>
              <Link
                href="/live/chores"
                className="px-3 py-1.5 bg-[#FFD23F] border-[2px] border-[#111] rounded-[10px] shadow-[2px_2px_0_#111] text-xs font-bold hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
              >
                + Add chore
              </Link>
            </div>
          )}
        </div>
      ) : (
        /* Empty State: No Flat Yet */
        <Card className="bg-white text-center py-6 px-4">
          <div className="w-14 h-14 bg-[#FFD23F] border-[2.5px] border-[#111] shadow-[4px_4px_0_#111] rounded-[16px] flex items-center justify-center text-3xl mx-auto mb-3">
            🏠
          </div>
          <h2 className="font-heading font-black text-lg text-[#111] mb-1">
            Abhi koi flat connected nahi!
          </h2>
          <p className="text-xs font-medium text-gray-600 max-w-[280px] mx-auto mb-4">
            Create your flat to split rent, track kharcha, and manage daily chores with flatmates.
          </p>

          <Button
            onClick={() => router.push('/live')}
            variant="primary"
            fullWidth
            size="md"
          >
            <span>Create or Join Flat</span>
            <ArrowRight size={16} />
          </Button>
        </Card>
      )}

      {/* Quick Navigation Cards */}
      <div className="pt-2">
        <h4 className="text-xs font-black uppercase tracking-wider text-gray-500 mb-2">
          Explore Flatly
        </h4>
        <div className="space-y-2">
          <Link
            href="/live/expenses"
            className="flex items-center justify-between p-3 bg-white border-[2px] border-[#111] rounded-[12px] shadow-[3px_3px_0_#111] hover:bg-yellow-50 transition-all"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">💰</span>
              <div>
                <div className="font-heading font-bold text-sm text-[#111]">
                  Hisab-Kitab (Expenses)
                </div>
                <div className="text-[11px] text-gray-500">
                  {expenses.length > 0 ? `${expenses.length} expenses recorded` : 'Start splitting bills'}
                </div>
              </div>
            </div>
            <ArrowRight size={16} />
          </Link>

          <Link
            href="/live/rules"
            className="flex items-center justify-between p-3 bg-white border-[2px] border-[#111] rounded-[12px] shadow-[3px_3px_0_#111] hover:bg-yellow-50 transition-all"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">📜</span>
              <div>
                <div className="font-heading font-bold text-sm text-[#111]">
                  House Rules
                </div>
                <div className="text-[11px] text-gray-500">
                  Agree on common flat agreements
                </div>
              </div>
            </div>
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}
