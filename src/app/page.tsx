'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { calculateBalances, getMemberBalance } from '@/lib/balance';
import { formatINR } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import {
  ArrowRight,
  CheckCircle2,
  Copy,
  Check,
  Home,
  PlusCircle,
  Search,
  Sparkles,
  Users,
  DollarSign,
  Receipt,
  RotateCw,
  ShieldCheck,
  Bot,
  MessageSquare
} from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const { profile, flat, expenses, settlements, chores, rules, listings, markChoreDone, rotateChore } = useStore();
  const [copiedCode, setCopiedCode] = useState(false);

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

  const copyCode = () => {
    if (flat?.code) {
      navigator.clipboard.writeText(flat.code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  // Recent 3 expenses
  const recentExpenses = [...expenses].reverse().slice(0, 3);
  const totalSpent = expenses.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      {/* Top Welcome & Flat badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl font-black text-[#111] flex items-center gap-2">
            Hey {profile?.name || 'Dost'}! 👋
          </h1>
          <p className="text-xs md:text-sm font-semibold text-gray-600 mt-0.5">
            Welcome to your shared living dashboard • India
          </p>
        </div>

        <div className="flex items-center gap-2">
          {flat ? (
            <Link
              href="/live"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white border-[2px] border-[#111] rounded-full shadow-[2.5px_2.5px_0_#111] text-xs font-bold hover:bg-[#FFD23F] transition-colors"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-[#3DDC97] animate-pulse" />
              <span className="truncate max-w-[160px]">{flat.name}</span>
            </Link>
          ) : (
            <Link
              href="/live"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#FFD23F] border-[2px] border-[#111] rounded-full shadow-[2.5px_2.5px_0_#111] text-xs font-black hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
            >
              <PlusCircle size={15} />
              <span>Setup Your Flat</span>
            </Link>
          )}

          <Link
            href="/find?tab=post"
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white border-[2px] border-[#111] rounded-full shadow-[2.5px_2.5px_0_#111] text-xs font-bold hover:bg-gray-100 transition-all"
          >
            <span>📢 Post Vacancy</span>
          </Link>
        </div>
      </div>

      {/* Action Cards: Find & Post (Mobile grid, wide on desktop) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <Link
          href="/find?tab=rooms"
          className="group block p-4 bg-white border-[2.5px] border-[#111] rounded-[18px] shadow-[4px_4px_0_#111] hover:shadow-[2px_2px_0_#111] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
        >
          <div className="w-10 h-10 rounded-[12px] bg-[#6EC6FF] border-[2px] border-[#111] flex items-center justify-center text-xl mb-3 shadow-[2px_2px_0_#111]">
            🔍
          </div>
          <h3 className="font-heading font-black text-sm md:text-base text-[#111] leading-tight mb-1">
            Mujhe flat chahiye
          </h3>
          <p className="text-xs font-semibold text-gray-500">
            Search verified rooms & vacancies with compatibility
          </p>
        </Link>

        <Link
          href="/find?tab=post"
          className="group block p-4 bg-white border-[2.5px] border-[#111] rounded-[18px] shadow-[4px_4px_0_#111] hover:shadow-[2px_2px_0_#111] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
        >
          <div className="w-10 h-10 rounded-[12px] bg-[#FFD23F] border-[2px] border-[#111] flex items-center justify-center text-xl mb-3 shadow-[2px_2px_0_#111]">
            📢
          </div>
          <h3 className="font-heading font-black text-sm md:text-base text-[#111] leading-tight mb-1">
            Roommate chahiye
          </h3>
          <p className="text-xs font-semibold text-gray-500">
            Post an open vacancy in your current apartment
          </p>
        </Link>

        <Link
          href="/live/expenses"
          className="group block p-4 bg-white border-[2.5px] border-[#111] rounded-[18px] shadow-[4px_4px_0_#111] hover:shadow-[2px_2px_0_#111] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
        >
          <div className="w-10 h-10 rounded-[12px] bg-[#3DDC97] border-[2px] border-[#111] flex items-center justify-center text-xl mb-3 shadow-[2px_2px_0_#111]">
            💰
          </div>
          <h3 className="font-heading font-black text-sm md:text-base text-[#111] leading-tight mb-1">
            Split Kharcha
          </h3>
          <p className="text-xs font-semibold text-gray-500">
            Equal & custom splits with zero-loss settle-up
          </p>
        </Link>

        <Link
          href="/live/chores"
          className="group block p-4 bg-white border-[2.5px] border-[#111] rounded-[18px] shadow-[4px_4px_0_#111] hover:shadow-[2px_2px_0_#111] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
        >
          <div className="w-10 h-10 rounded-[12px] bg-[#FF80BF] border-[2px] border-[#111] flex items-center justify-center text-xl mb-3 shadow-[2px_2px_0_#111]">
            🧹
          </div>
          <h3 className="font-heading font-black text-sm md:text-base text-[#111] leading-tight mb-1">
            Chore Rotation
          </h3>
          <p className="text-xs font-semibold text-gray-500">
            Auto circular rotation & 30-day fairness stats
          </p>
        </Link>
      </div>

      {/* Main Responsive Grid Layout (Desktop & Tablet) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Left / Main Section (Col 7 on LG, Col 8 on XL) */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-6">
          {flat ? (
            <div className="space-y-6">
              {/* Balance Summary Card: Kaun kisko dega? */}
              <Card className="bg-white p-5 md:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b-[2px] border-[#111] mb-4">
                  <div>
                    <h2 className="font-heading font-black text-lg md:text-xl text-[#111] flex items-center gap-2">
                      <span>Kaun Kisko Dega?</span>
                      <span className="text-xs font-bold px-2 py-0.5 bg-[#FFD23F] border-[1.5px] border-[#111] rounded-full">
                        Live Balances
                      </span>
                    </h2>
                    <p className="text-xs text-gray-500 font-semibold mt-0.5">
                      Greedy settle-up algorithm minimizes transactions
                    </p>
                  </div>
                  <div className="text-xs font-black px-3 py-1 bg-gray-100 rounded-full border-[1.5px] border-[#111] self-start sm:self-auto">
                    {expenses.length} Expenses Recorded
                  </div>
                </div>

                {balances.length === 0 ? (
                  <div className="py-8 text-center bg-[#F9F7F1] rounded-[16px] border-[2px] border-dashed border-[#111]/30">
                    <span className="text-3xl">🎉</span>
                    <p className="text-sm md:text-base font-black text-[#111] mt-2">
                      Sab hisab barabar! All settled up.
                    </p>
                    <p className="text-xs font-semibold text-gray-500 mt-1">
                      No pending debts between flatmates right now.
                    </p>
                    <Link
                      href="/live/expenses"
                      className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white border-[2px] border-[#111] rounded-full shadow-[2px_2px_0_#111] text-xs font-black hover:bg-[#FFD23F] transition-all"
                    >
                      <Receipt size={14} />
                      <span>View expense history &rarr;</span>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* You owe */}
                      {userOwes.length > 0 ? (
                        userOwes.map((b, idx) => {
                          const creditor = flat.members.find((m) => m.id === b.to);
                          return (
                            <div
                              key={`owe-${idx}`}
                              className="flex items-center justify-between p-3.5 bg-[#FFF0F0] border-[2px] border-[#111] rounded-[14px] shadow-[2px_2px_0_#111]"
                            >
                              <div>
                                <span className="text-[11px] font-black uppercase tracking-wider text-[#FF3B3B] block">
                                  You Owe
                                </span>
                                <span className="text-xs md:text-sm font-bold text-[#111]">
                                  {creditor?.name || 'Flatmate'}
                                </span>
                              </div>
                              <span className="text-sm font-black px-2.5 py-1 bg-[#FF3B3B] text-white rounded-[8px] border-[1.5px] border-[#111] shadow-[1px_1px_0_#111]">
                                {formatINR(b.amount)}
                              </span>
                            </div>
                          );
                        })
                      ) : (
                        <div className="p-3.5 bg-[#F9F7F1] border-[2px] border-[#111] rounded-[14px] flex items-center justify-between">
                          <span className="text-xs font-bold text-gray-600">You don&apos;t owe anyone!</span>
                          <span className="text-xs font-black text-[#3DDC97]">₹0.00</span>
                        </div>
                      )}

                      {/* Owes you */}
                      {owesUser.length > 0 ? (
                        owesUser.map((b, idx) => {
                          const debtor = flat.members.find((m) => m.id === b.from);
                          return (
                            <div
                              key={`get-${idx}`}
                              className="flex items-center justify-between p-3.5 bg-[#E6F9F0] border-[2px] border-[#111] rounded-[14px] shadow-[2px_2px_0_#111]"
                            >
                              <div>
                                <span className="text-[11px] font-black uppercase tracking-wider text-[#00A86B] block">
                                  Owes You
                                </span>
                                <span className="text-xs md:text-sm font-bold text-[#111]">
                                  {debtor?.name || 'Flatmate'}
                                </span>
                              </div>
                              <span className="text-sm font-black px-2.5 py-1 bg-[#3DDC97] text-[#111] rounded-[8px] border-[1.5px] border-[#111] shadow-[1px_1px_0_#111]">
                                {formatINR(b.amount)}
                              </span>
                            </div>
                          );
                        })
                      ) : (
                        <div className="p-3.5 bg-[#F9F7F1] border-[2px] border-[#111] rounded-[14px] flex items-center justify-between">
                          <span className="text-xs font-bold text-gray-600">Nobody owes you right now</span>
                          <span className="text-xs font-black text-gray-400">₹0.00</span>
                        </div>
                      )}
                    </div>

                    <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                      <Button
                        onClick={() => router.push('/live/expenses')}
                        variant="primary"
                        size="md"
                        className="w-full sm:flex-1"
                      >
                        <CheckCircle2 size={16} />
                        <span>Settle Up / View Full Hisab</span>
                      </Button>
                      <Button
                        onClick={() => router.push('/live/expenses?add=true')}
                        variant="secondary"
                        size="md"
                        className="w-full sm:w-auto"
                      >
                        <PlusCircle size={16} />
                        <span>Add Expense</span>
                      </Button>
                    </div>
                  </div>
                )}
              </Card>

              {/* Sub-Grid: Today's Chore + Recent Expenses */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Today's Chore: AAJ KI BAARI */}
                {todayChore ? (
                  <div className="p-5 bg-[#3DDC97] border-[2.5px] border-[#111] rounded-[20px] shadow-[5px_5px_0_#111] text-[#111] flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="px-2.5 py-0.5 bg-[#111] text-[#FFF8EC] text-[10px] font-black uppercase tracking-wider rounded-full">
                          AAJ KI BAARI
                        </span>
                        <span className="text-xs font-black px-2 py-0.5 bg-white/70 border-[1.5px] border-[#111] rounded-full">
                          Due {todayChore.dueDay}
                        </span>
                      </div>

                      <h3 className="font-heading font-black text-lg md:text-xl text-[#111] leading-tight mt-1">
                        {todayChore.task}
                      </h3>
                      <p className="text-xs font-semibold text-gray-900 mt-1 mb-4">
                        Assigned to{' '}
                        <span className="font-black underline bg-white/40 px-1.5 py-0.5 rounded-md">
                          {choreAssignee?.name || 'Roommate'}
                        </span>
                      </p>
                    </div>

                    <div className="space-y-2 pt-2 border-t-[2px] border-[#111]/20">
                      <div className="flex items-center gap-2">
                        {todayChore.status === 'pending' ? (
                          <Button
                            onClick={() => markChoreDone(todayChore.id)}
                            variant="secondary"
                            size="sm"
                            className="flex-1"
                          >
                            <CheckCircle2 size={15} className="text-[#3DDC97]" />
                            <span>Mark Done</span>
                          </Button>
                        ) : (
                          <div className="flex-1 py-1.5 text-center bg-white border-[2px] border-[#111] rounded-[10px] text-xs font-black text-[#111]">
                            ✅ Completed today!
                          </div>
                        )}

                        <button
                          onClick={() => rotateChore(todayChore.id)}
                          title="Rotate to next flatmate"
                          className="p-2 bg-white border-[2px] border-[#111] rounded-[10px] shadow-[2px_2px_0_#111] hover:bg-gray-100 transition-all cursor-pointer"
                        >
                          <RotateCw size={15} />
                        </button>
                      </div>

                      <Link
                        href="/live/chores"
                        className="inline-block text-[11px] font-black text-gray-900 underline hover:text-black"
                      >
                        View all chores & 30-day fairness &rarr;
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="p-5 bg-white border-[2.5px] border-[#111] rounded-[20px] shadow-[5px_5px_0_#111] flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-black uppercase text-gray-400 block mb-1">
                        AAJ KI BAARI
                      </span>
                      <h3 className="font-heading font-black text-base text-[#111]">
                        No chores scheduled yet
                      </h3>
                      <p className="text-xs text-gray-500 font-semibold mt-1">
                        Set up chores so everyone shares the cleaning burden fairly.
                      </p>
                    </div>
                    <Link
                      href="/live/chores"
                      className="mt-4 px-3.5 py-2 bg-[#FFD23F] border-[2px] border-[#111] rounded-[12px] shadow-[2px_2px_0_#111] text-xs font-black text-center hover:translate-x-[1px] hover:translate-y-[1px] transition-all inline-block"
                    >
                      + Add First Chore
                    </Link>
                  </div>
                )}

                {/* Recent Expenses Snapshot */}
                <div className="p-5 bg-white border-[2.5px] border-[#111] rounded-[20px] shadow-[5px_5px_0_#111] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-heading font-black text-sm text-[#111]">
                        Recent Kharcha
                      </span>
                      <span className="text-xs font-bold text-gray-500">
                        Total {formatINR(totalSpent)}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {recentExpenses.length > 0 ? (
                        recentExpenses.map((exp) => (
                          <div
                            key={exp.id}
                            className="flex items-center justify-between p-2 bg-[#F9F7F1] border-[1.5px] border-[#111] rounded-[10px]"
                          >
                            <div className="truncate mr-2">
                              <p className="text-xs font-bold text-[#111] truncate">{exp.title}</p>
                              <p className="text-[10px] text-gray-500 font-medium">
                                Paid by {flat.members.find((m) => m.id === exp.paidBy)?.name || 'Member'}
                              </p>
                            </div>
                            <span className="text-xs font-black text-[#111] whitespace-nowrap">
                              {formatINR(exp.amount)}
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-gray-400 font-medium py-2">
                          No expenses added yet.
                        </p>
                      )}
                    </div>
                  </div>

                  <Link
                    href="/live/expenses"
                    className="mt-4 inline-flex items-center justify-between w-full text-xs font-black text-[#111] hover:underline"
                  >
                    <span>View all {expenses.length} expenses</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>

              {/* Roommate Listings Showcase / Teaser */}
              <div className="p-5 bg-white border-[2.5px] border-[#111] rounded-[20px] shadow-[5px_5px_0_#111]">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-heading font-black text-base text-[#111]">
                      Looking for another room or flatmate?
                    </h3>
                    <p className="text-xs font-semibold text-gray-500">
                      Explore active listings in Bengaluru, Delhi NCR, and Mumbai
                    </p>
                  </div>
                  <Link
                    href="/find"
                    className="text-xs font-black px-3 py-1 bg-[#FFD23F] border-[2px] border-[#111] rounded-full shadow-[2px_2px_0_#111] hover:bg-[#ffe17d] transition-all"
                  >
                    View All &rarr;
                  </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                  {listings.slice(0, 2).map((item) => (
                    <Link
                      key={item.id}
                      href={`/find/${item.id}`}
                      className="p-3.5 bg-[#FFF8EC] border-[2px] border-[#111] rounded-[14px] hover:shadow-[3px_3px_0_#111] hover:-translate-y-0.5 transition-all"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-black px-2 py-0.5 bg-[#6EC6FF] text-[#111] border-[1.5px] border-[#111] rounded-full">
                          {formatINR(item.rent)}/mo
                        </span>
                        <span className="text-[10px] font-bold text-gray-500">
                          {item.seats} spot available
                        </span>
                      </div>
                      <h4 className="font-heading font-black text-sm text-[#111] truncate mt-1">
                        {item.title}
                      </h4>
                      <p className="text-[11px] font-semibold text-gray-600 truncate mt-0.5">
                        📍 {item.location}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Empty State: No Flat Yet */
            <Card className="bg-white text-center py-8 px-6">
              <div className="w-16 h-16 bg-[#FFD23F] border-[2.5px] border-[#111] shadow-[4px_4px_0_#111] rounded-[20px] flex items-center justify-center text-3xl mx-auto mb-4">
                🏠
              </div>
              <h2 className="font-heading font-black text-xl md:text-2xl text-[#111] mb-2">
                Abhi koi flat connected nahi!
              </h2>
              <p className="text-xs md:text-sm font-semibold text-gray-600 max-w-md mx-auto mb-6">
                Create your flat to split rent, track kharcha with exact zero-loss settlement, and manage daily chores with flatmates.
              </p>

              <div className="flex flex-col sm:flex-row justify-center items-center gap-3 max-w-sm mx-auto">
                <Button
                  onClick={() => router.push('/live')}
                  variant="primary"
                  fullWidth
                  size="md"
                >
                  <span>Create or Join Flat</span>
                  <ArrowRight size={16} />
                </Button>
                <Button
                  onClick={() => router.push('/find')}
                  variant="secondary"
                  fullWidth
                  size="md"
                >
                  <Search size={16} />
                  <span>Browse Vacancies</span>
                </Button>
              </div>
            </Card>
          )}
        </div>

        {/* Right / Sidebar Section (Col 5 on LG, Col 4 on XL) */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-6">
          {/* Flat Community & Invite Code Card */}
          {flat && (
            <div className="p-5 bg-white border-[2.5px] border-[#111] rounded-[20px] shadow-[5px_5px_0_#111] space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                    YOUR FLAT
                  </span>
                  <h3 className="font-heading font-black text-lg text-[#111]">
                    {flat.name}
                  </h3>
                  <p className="text-xs font-semibold text-gray-500">
                    Rent Total: {formatINR(flat.rent)}/month
                  </p>
                </div>
                <div className="w-8 h-8 rounded-full bg-[#FFD23F] border-[2px] border-[#111] flex items-center justify-center text-sm shadow-[1.5px_1.5px_0_#111]">
                  🏡
                </div>
              </div>

              {/* Invite Code Box */}
              <div className="p-3 bg-[#FFF8EC] border-[2px] border-[#111] rounded-[14px]">
                <div className="flex items-center justify-between text-xs font-bold text-gray-500 mb-1">
                  <span>FLAT INVITE CODE</span>
                  <span>Share with flatmates</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-heading font-black text-xl tracking-wider text-[#111]">
                    {flat.code}
                  </span>
                  <button
                    onClick={copyCode}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#111] text-[#FFF8EC] rounded-[8px] text-xs font-bold hover:bg-gray-800 transition-all cursor-pointer"
                  >
                    {copiedCode ? <Check size={14} className="text-[#3DDC97]" /> : <Copy size={14} />}
                    <span>{copiedCode ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              {/* Members List */}
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-gray-500 block mb-2">
                  Flatmates ({flat.members.length})
                </span>
                <div className="space-y-2">
                  {flat.members.map((member, idx) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-2 bg-[#F9F7F1] border-[1.5px] border-[#111] rounded-[10px]"
                    >
                      <div className="flex items-center gap-2">
                        <Avatar name={member.name} color={member.avatarColor || '#FFD23F'} size="sm" />
                        <span className="text-xs font-bold text-[#111]">{member.name}</span>
                      </div>
                      <span className="text-[10px] font-black px-2 py-0.5 bg-white border-[1px] border-[#111] rounded-md">
                        {idx === 0 ? 'Admin' : 'Member'}
                      </span>
                    </div>
                  ))}
                </div>

                <Link
                  href="/live"
                  className="mt-3 block text-center py-1.5 text-xs font-black text-[#111] bg-gray-100 hover:bg-[#FFD23F] border-[1.5px] border-[#111] rounded-[10px] transition-colors"
                >
                  Manage Flatmates &rarr;
                </Link>
              </div>
            </div>
          )}

          {/* Flatly AI Brain Card */}
          <div className="p-5 bg-[#FFE17D] border-[2.5px] border-[#111] rounded-[20px] shadow-[5px_5px_0_#111] space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-[8px] bg-[#111] text-[#FFD23F] flex items-center justify-center">
                <Bot size={16} />
              </div>
              <h3 className="font-heading font-black text-sm md:text-base text-[#111]">
                Flatly AI Roommate Brain
              </h3>
            </div>

            <p className="text-xs font-semibold text-[#111] bg-white/70 p-3 rounded-[12px] border-[1.5px] border-[#111] leading-relaxed">
              💡 <span className="font-bold">Weekly Wrap-up:</span> &ldquo;Hey folks! Total ₹{totalSpent} spend hua hai table pe. Chores smoothly rotate ho rahe hain. Settle-up check kar lo so scene remains sorted!&rdquo;
            </p>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <Link
                href="/live/rules"
                className="p-2 bg-white border-[2px] border-[#111] rounded-[10px] shadow-[2px_2px_0_#111] text-[11px] font-black text-center hover:bg-gray-50 transition-all"
              >
                Draft AI Rules 📜
              </Link>
              <Link
                href="/live/rules"
                className="p-2 bg-white border-[2px] border-[#111] rounded-[10px] shadow-[2px_2px_0_#111] text-[11px] font-black text-center hover:bg-gray-50 transition-all"
              >
                Polite Rewrite ✍️
              </Link>
            </div>
          </div>

          {/* House Rules Snapshot */}
          <div className="p-5 bg-white border-[2.5px] border-[#111] rounded-[20px] shadow-[5px_5px_0_#111]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-heading font-black text-sm md:text-base text-[#111] flex items-center gap-1.5">
                <ShieldCheck size={16} />
                <span>House Rules</span>
              </h3>
              <span className="text-[11px] font-bold text-gray-500">
                {rules.length} Active
              </span>
            </div>

            <div className="space-y-2">
              {rules.slice(0, 3).map((r) => (
                <div
                  key={r.id}
                  className="p-2.5 bg-[#FFF8EC] border-[1.5px] border-[#111] rounded-[10px] text-xs font-medium text-[#111] flex items-start gap-2"
                >
                  <span className="text-sm">📌</span>
                  <span className="leading-snug">{r.text}</span>
                </div>
              ))}
            </div>

            <Link
              href="/live/rules"
              className="mt-3 block text-center py-1.5 text-xs font-black text-[#111] underline hover:text-black"
            >
              View & agree on all rules &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
