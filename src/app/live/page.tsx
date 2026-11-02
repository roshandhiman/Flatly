'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { formatINR } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Avatar } from '@/components/ui/Avatar';
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Copy,
  DollarSign,
  Info,
  LogOut,
  Plus,
  Sparkles,
  Trash2,
  Users,
  Zap,
  Building2,
  ShieldCheck,
  RotateCw,
  Bot
} from 'lucide-react';

export default function LiveDashboardPage() {
  const router = useRouter();
  const {
    flat,
    createFlat,
    joinFlat,
    addMember,
    removeMember,
    expenses,
    chores,
    rules,
    profile,
  } = useStore();

  // Create Flat Form state
  const [flatName, setFlatName] = useState('');
  const [rent, setRent] = useState('');
  const [createError, setCreateError] = useState('');

  // Join Flat Form state
  const [joinCode, setJoinCode] = useState('');
  const [joinNote, setJoinNote] = useState(false);

  // Add Member state
  const [newMemberName, setNewMemberName] = useState('');
  const [memberError, setMemberError] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);

  // Handle Create Flat
  const handleCreateFlat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!flatName.trim()) {
      setCreateError('Please enter a flat name');
      return;
    }

    const rentNumber = parseFloat(rent) || 0;
    createFlat(flatName.trim(), rentNumber);

    // If user profile exists, automatically add them as the first member
    if (profile?.name) {
      setTimeout(() => {
        addMember(`${profile.name} (You)`);
      }, 50);
    }
  };

  // Handle Join Flat
  const handleJoinFlat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;
    joinFlat(joinCode.trim().toUpperCase());
    setJoinNote(true);
    if (profile?.name) {
      setTimeout(() => {
        addMember(`${profile.name} (You)`);
      }, 50);
    }
  };

  // Handle Add Member
  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim()) {
      setMemberError('Enter a roommate name');
      return;
    }
    addMember(newMemberName.trim());
    setNewMemberName('');
    setMemberError('');
  };

  const copyCodeToClipboard = () => {
    if (flat?.code) {
      navigator.clipboard?.writeText(flat.code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  // 1. NO FLAT CREATED YET
  if (!flat) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-6">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl font-black text-[#111]">
            Live Flat Mode 🏠
          </h1>
          <p className="text-xs md:text-sm font-semibold text-gray-500 mt-1">
            Set up your shared flat or enter an invite code to manage hisab, chores, and house rules
          </p>
        </div>

        {/* Responsive Grid: 1 col on mobile, 2 cols on tablet & desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* Create Flat Form */}
          <Card className="bg-white p-5 md:p-6 space-y-4">
            <div className="flex items-center gap-2.5 pb-2 border-b-[2px] border-[#111]">
              <div className="w-10 h-10 rounded-[12px] bg-[#FFD23F] border-[2px] border-[#111] flex items-center justify-center font-black text-xl shadow-[2px_2px_0_#111]">
                ✨
              </div>
              <div>
                <h2 className="font-heading font-black text-lg text-[#111]">
                  Create a new flat
                </h2>
                <p className="text-xs font-semibold text-gray-500">
                  You&apos;ll get a 6-char code to invite roommates
                </p>
              </div>
            </div>

            <form onSubmit={handleCreateFlat} className="space-y-4">
              <Input
                label="Flat Name / Nickname"
                placeholder="e.g. Koramangala 3BHK Chill Pad"
                value={flatName}
                onChange={(e) => {
                  setFlatName(e.target.value);
                  if (createError) setCreateError('');
                }}
                error={createError}
              />

              <Input
                label="Monthly Total Rent (Optional)"
                placeholder="e.g. 45000"
                type="number"
                value={rent}
                onChange={(e) => setRent(e.target.value)}
              />

              <Button type="submit" variant="primary" fullWidth size="lg">
                <span>Create Flat Now</span>
                <ArrowRight size={18} />
              </Button>
            </form>
          </Card>

          {/* Join Flat With Code */}
          <div className="space-y-5">
            <Card className="bg-[#FFF8EC] border-[2.5px] border-[#111] p-5 md:p-6 space-y-4 shadow-[5px_5px_0_#111]">
              <div className="flex items-center gap-2.5 pb-2 border-b-[2px] border-[#111]">
                <div className="w-10 h-10 rounded-[12px] bg-[#6EC6FF] border-[2px] border-[#111] flex items-center justify-center font-black text-xl shadow-[2px_2px_0_#111]">
                  🔑
                </div>
                <div>
                  <h2 className="font-heading font-black text-lg text-[#111]">
                    Join with invite code
                  </h2>
                  <p className="text-xs font-semibold text-gray-500">
                    Got a 6-character code from your flatmate?
                  </p>
                </div>
              </div>

              <form onSubmit={handleJoinFlat} className="space-y-4">
                <Input
                  placeholder="Enter 6-char code (e.g. IND404)"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                />

                <Button type="submit" variant="secondary" fullWidth size="lg">
                  <span>Join Flat</span>
                  <ArrowRight size={18} />
                </Button>
              </form>

              <div className="p-3 bg-white border-[1.5px] border-[#111] rounded-[12px] text-xs text-gray-700 flex items-start gap-2 shadow-[2px_2px_0_#111]">
                <Info size={16} className="mt-0.5 text-blue-600 flex-shrink-0" />
                <span className="leading-snug">
                  <strong>Flatly Sync:</strong> Entering the invite code connects your habits profile and links you to the flat hisab immediately.
                </span>
              </div>
            </Card>

            <div className="p-5 bg-white border-[2.5px] border-[#111] rounded-[20px] shadow-[4px_4px_0_#111] space-y-2">
              <h4 className="font-heading font-black text-sm text-[#111]">
                What you get with Flatly Live:
              </h4>
              <ul className="text-xs font-semibold text-gray-600 space-y-1.5 list-disc pl-4">
                <li>Automated fair expense split & debt minimization algorithm.</li>
                <li>Weekly circular chores rotation so nobody does dishes twice.</li>
                <li>Democratic house rules with member vote approvals.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. FLAT EXISTS -> DASHBOARD
  const pendingChores = chores.filter((c) => c.status === 'pending');

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      {/* Flat Info Banner */}
      <div className="p-5 md:p-7 bg-[#FFD23F] border-[2.5px] border-[#111] rounded-[24px] shadow-[6px_6px_0_#111] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-3 py-0.5 bg-[#111] text-[#FFF8EC] rounded-full text-[10px] font-black uppercase tracking-wider">
              ACTIVE FLAT
            </span>
            <span className="text-xs font-black text-gray-800">
              {flat.members.length} Flatmates
            </span>
          </div>
          <h1 className="font-heading font-black text-2xl md:text-3xl text-[#111]">
            {flat.name}
          </h1>
          {flat.rent > 0 && (
            <p className="text-xs md:text-sm font-bold text-gray-800 mt-1">
              Monthly Total Rent: <span className="font-black text-[#111]">{formatINR(flat.rent)}/mo</span>
            </p>
          )}
        </div>

        {/* Invite Code Box */}
        <div className="flex items-center gap-2 p-2.5 bg-white border-[2px] border-[#111] rounded-[16px] shadow-[3px_3px_0_#111] self-start md:self-auto">
          <div className="px-2">
            <span className="text-[10px] font-black uppercase text-gray-400 block">
              INVITE CODE
            </span>
            <code className="font-mono font-black text-lg tracking-wider text-[#111]">
              {flat.code}
            </code>
          </div>

          <button
            onClick={copyCodeToClipboard}
            className="flex items-center gap-1.5 text-xs font-black px-3 py-2 rounded-[10px] border-[1.5px] border-[#111] bg-[#FFD23F] hover:bg-[#ffe17d] transition-all cursor-pointer shadow-[1.5px_1.5px_0_#111]"
          >
            {copiedCode ? (
              <>
                <Check size={14} className="text-green-700 font-black" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy size={14} />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 3 Core Section Action Cards (Responsive Grid: 1 col on mobile, 3 cols on tablet & desktop) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Expenses */}
        <Link
          href="/live/expenses"
          className="flex flex-col justify-between p-5 bg-white border-[2.5px] border-[#111] rounded-[20px] shadow-[5px_5px_0_#111] hover:shadow-[2px_2px_0_#111] hover:translate-x-[2px] hover:translate-y-[2px] transition-all group"
        >
          <div>
            <div className="w-12 h-12 rounded-[14px] bg-[#FFD23F] border-[2px] border-[#111] flex items-center justify-center text-2xl shadow-[2px_2px_0_#111] mb-3">
              💸
            </div>
            <h3 className="font-heading font-black text-lg md:text-xl text-[#111]">
              Expenses & Balances
            </h3>
            <p className="text-xs font-semibold text-gray-600 mt-1 leading-relaxed">
              {expenses.length} expenses recorded · Split with equal and custom shares with settle-up minimization.
            </p>
          </div>

          <div className="mt-5 pt-3 border-t-[1.5px] border-gray-100 flex items-center justify-between text-xs font-black text-[#111] group-hover:text-black">
            <span>Manage Hisab</span>
            <ArrowRight size={16} />
          </div>
        </Link>

        {/* Chores */}
        <Link
          href="/live/chores"
          className="flex flex-col justify-between p-5 bg-white border-[2.5px] border-[#111] rounded-[20px] shadow-[5px_5px_0_#111] hover:shadow-[2px_2px_0_#111] hover:translate-x-[2px] hover:translate-y-[2px] transition-all group"
        >
          <div>
            <div className="w-12 h-12 rounded-[14px] bg-[#3DDC97] border-[2px] border-[#111] flex items-center justify-center text-2xl shadow-[2px_2px_0_#111] mb-3">
              🧹
            </div>
            <h3 className="font-heading font-black text-lg md:text-xl text-[#111]">
              Chores & Aaj ki Baari
            </h3>
            <p className="text-xs font-semibold text-gray-600 mt-1 leading-relaxed">
              {pendingChores.length} pending chores · Auto-rotate tasks in circular order & 30-day fairness stats.
            </p>
          </div>

          <div className="mt-5 pt-3 border-t-[1.5px] border-gray-100 flex items-center justify-between text-xs font-black text-[#111] group-hover:text-black">
            <span>View Chores Board</span>
            <ArrowRight size={16} />
          </div>
        </Link>

        {/* Rules */}
        <Link
          href="/live/rules"
          className="flex flex-col justify-between p-5 bg-white border-[2.5px] border-[#111] rounded-[20px] shadow-[5px_5px_0_#111] hover:shadow-[2px_2px_0_#111] hover:translate-x-[2px] hover:translate-y-[2px] transition-all group"
        >
          <div>
            <div className="w-12 h-12 rounded-[14px] bg-[#6EC6FF] border-[2px] border-[#111] flex items-center justify-center text-2xl shadow-[2px_2px_0_#111] mb-3">
              📜
            </div>
            <h3 className="font-heading font-black text-lg md:text-xl text-[#111]">
              House Rules & AI
            </h3>
            <p className="text-xs font-semibold text-gray-600 mt-1 leading-relaxed">
              {rules.length} active rules · Generate rules with AI and polite complaints rewriter.
            </p>
          </div>

          <div className="mt-5 pt-3 border-t-[1.5px] border-gray-100 flex items-center justify-between text-xs font-black text-[#111] group-hover:text-black">
            <span>Explore Rules</span>
            <ArrowRight size={16} />
          </div>
        </Link>
      </div>

      {/* Flat Members Management Section */}
      <Card className="bg-white p-5 md:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b-[2px] border-[#111]">
          <div className="flex items-center gap-2.5">
            <Users size={20} />
            <h2 className="font-heading font-black text-lg text-[#111]">
              Flatmates Roster ({flat.members.length})
            </h2>
          </div>
          <span className="text-xs font-bold text-gray-500">
            All members can be selected when splitting expenses
          </span>
        </div>

        {/* Members List */}
        {flat.members.length === 0 ? (
          <div className="p-4 bg-[#FFF8EC] border-[2px] border-dashed border-[#111] rounded-[14px] text-center">
            <p className="text-xs font-bold text-gray-600">
              No flatmates added yet! Add yourself and roommates below.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {flat.members.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between p-3 bg-[#FFF8EC] border-[2px] border-[#111] rounded-[14px] shadow-[2.5px_2.5px_0_#111]"
              >
                <div className="flex items-center gap-2.5">
                  <Avatar name={m.name} color={m.avatarColor} size="sm" />
                  <span className="text-xs font-bold text-[#111] truncate max-w-[130px]">{m.name}</span>
                </div>
                <button
                  type="button"
                  onClick={() => removeMember(m.id)}
                  className="w-6 h-6 rounded-full bg-white border border-[#111] flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 cursor-pointer transition-colors"
                  title="Remove member"
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add Member Form */}
        <form onSubmit={handleAddMember} className="flex flex-col sm:flex-row gap-2 pt-2 max-w-md">
          <div className="flex-1">
            <input
              placeholder="Add flatmate by name (e.g. Aman, Priya)"
              value={newMemberName}
              onChange={(e) => {
                setNewMemberName(e.target.value);
                if (memberError) setMemberError('');
              }}
              className="w-full px-3.5 py-2.5 text-xs font-bold bg-white border-[2px] border-[#111] rounded-[12px] shadow-[2px_2px_0_#111] focus:outline-none placeholder:text-gray-400"
            />
            {memberError && (
              <p className="text-[10px] font-bold text-red-600 mt-1">{memberError}</p>
            )}
          </div>
          <Button type="submit" variant="secondary" size="md">
            <Plus size={16} />
            <span>Add Member</span>
          </Button>
        </form>
      </Card>
    </div>
  );
}
