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
      <div className="p-4 space-y-5">
        <div>
          <h1 className="font-heading text-2xl font-black text-[#111]">
            Live Flat Mode 🏠
          </h1>
          <p className="text-xs font-semibold text-gray-500">
            Set up your shared flat or enter an invite code
          </p>
        </div>

        {/* Create Flat Form */}
        <Card className="bg-white space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-[8px] bg-[#FFD23F] border-[2px] border-[#111] flex items-center justify-center font-black text-sm">
              ✨
            </div>
            <div>
              <h2 className="font-heading font-black text-base text-[#111]">
                Create your flat
              </h2>
              <p className="text-[11px] font-semibold text-gray-500">
                You&apos;ll get a unique code to invite roommates
              </p>
            </div>
          </div>

          <form onSubmit={handleCreateFlat} className="space-y-3">
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
              placeholder="e.g. 35000"
              type="number"
              value={rent}
              onChange={(e) => setRent(e.target.value)}
            />

            <Button type="submit" variant="primary" fullWidth size="md">
              <span>Create Flat Now</span>
              <ArrowRight size={16} />
            </Button>
          </form>
        </Card>

        {/* Join Flat With Code */}
        <Card className="bg-[#FFF8EC] border-[2.5px] border-[#111] space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-[8px] bg-[#6EC6FF] border-[2px] border-[#111] flex items-center justify-center font-black text-sm">
              🔑
            </div>
            <div>
              <h2 className="font-heading font-black text-base text-[#111]">
                Join with invite code
              </h2>
              <p className="text-[11px] font-semibold text-gray-500">
                Got a code from your flatmate?
              </p>
            </div>
          </div>

          <form onSubmit={handleJoinFlat} className="space-y-3">
            <Input
              placeholder="Enter 6-char code (e.g. FLAT99)"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            />

            <Button type="submit" variant="secondary" fullWidth size="md">
              Join Flat
            </Button>
          </form>

          <div className="p-2.5 bg-white/80 border-[1.5px] border-[#111] rounded-[10px] text-[11px] text-gray-700 flex items-start gap-1.5">
            <Info size={14} className="mt-0.5 text-blue-600 flex-shrink-0" />
            <span>
              <strong>Stage 1 note:</strong> Live joining over internet arrives in Stage 2. Entering any code here loads a local flat session.
            </span>
          </div>
        </Card>
      </div>
    );
  }

  // 2. FLAT EXISTS -> DASHBOARD
  const pendingChores = chores.filter((c) => c.status === 'pending');

  return (
    <div className="p-4 space-y-5">
      {/* Flat Info Banner */}
      <div className="p-4 bg-[#FFD23F] border-[2.5px] border-[#111] rounded-[16px] shadow-[4px_4px_0_#111] space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <span className="px-2 py-0.5 bg-[#111] text-[#FFF8EC] rounded-full text-[10px] font-black uppercase tracking-wider">
              YOUR FLAT
            </span>
            <h1 className="font-heading font-black text-xl text-[#111] mt-1">
              {flat.name}
            </h1>
          </div>

          {flat.rent > 0 && (
            <div className="text-right">
              <span className="text-[10px] font-bold text-gray-800 block">
                Total Rent
              </span>
              <span className="text-sm font-black text-[#111]">
                {formatINR(flat.rent)}/mo
              </span>
            </div>
          )}
        </div>

        {/* Invite Code Bar */}
        <div className="flex items-center justify-between p-2 bg-white border-[2px] border-[#111] rounded-[10px]">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#111]">
            <span className="text-gray-500">Invite Code:</span>
            <code className="font-mono bg-yellow-100 px-1.5 py-0.5 rounded border border-[#111] font-black text-sm">
              {flat.code}
            </code>
          </div>

          <button
            onClick={copyCodeToClipboard}
            className="flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-[6px] border-[1.5px] border-[#111] bg-white hover:bg-gray-100 transition-colors cursor-pointer"
          >
            {copiedCode ? (
              <>
                <Check size={12} className="text-green-600" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy size={12} />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Flat Members Section */}
      <Card className="bg-white space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users size={18} />
            <h2 className="font-heading font-black text-base text-[#111]">
              Flatmates ({flat.members.length})
            </h2>
          </div>
          <span className="text-[11px] font-bold text-gray-500">
            Needed for splitting
          </span>
        </div>

        {/* Members List */}
        {flat.members.length === 0 ? (
          <div className="p-3 bg-[#FFF8EC] border-[2px] border-dashed border-[#111] rounded-[10px] text-center">
            <p className="text-xs font-bold text-gray-600">
              No flatmates added yet! Add yourself and roommates below.
            </p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {flat.members.map((m) => (
              <div
                key={m.id}
                className="flex items-center gap-2 px-2.5 py-1.5 bg-[#FFF8EC] border-[2px] border-[#111] rounded-[10px] shadow-[2px_2px_0_#111]"
              >
                <Avatar name={m.name} color={m.avatarColor} size="sm" />
                <span className="text-xs font-bold text-[#111]">{m.name}</span>
                <button
                  type="button"
                  onClick={() => removeMember(m.id)}
                  className="text-gray-400 hover:text-red-600 ml-1 cursor-pointer"
                  title="Remove member"
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add Member Form */}
        <form onSubmit={handleAddMember} className="flex gap-2 pt-2">
          <div className="flex-1">
            <input
              placeholder="Roommate name (e.g. Aman, Priya)"
              value={newMemberName}
              onChange={(e) => {
                setNewMemberName(e.target.value);
                if (memberError) setMemberError('');
              }}
              className="w-full px-3 py-2 text-xs font-bold bg-white border-[2px] border-[#111] rounded-[10px] shadow-[2px_2px_0_#111] focus:outline-none"
            />
            {memberError && (
              <p className="text-[10px] font-bold text-red-600 mt-1">{memberError}</p>
            )}
          </div>
          <Button type="submit" variant="secondary" size="sm">
            <Plus size={14} />
            <span>Add</span>
          </Button>
        </form>
      </Card>

      {/* 3 Core Section Action Cards */}
      <div className="space-y-3">
        {/* Expenses */}
        <Link
          href="/live/expenses"
          className="flex items-center justify-between p-4 bg-white border-[2.5px] border-[#111] rounded-[16px] shadow-[4px_4px_0_#111] hover:shadow-[2px_2px_0_#111] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[12px] bg-[#FFD23F] border-[2px] border-[#111] flex items-center justify-center text-xl shadow-[2px_2px_0_#111]">
              💸
            </div>
            <div>
              <h3 className="font-heading font-black text-base text-[#111]">
                Expenses & Balances
              </h3>
              <p className="text-xs font-semibold text-gray-500">
                {expenses.length} expenses recorded · Split with equal shares
              </p>
            </div>
          </div>
          <ArrowRight size={18} />
        </Link>

        {/* Chores */}
        <Link
          href="/live/chores"
          className="flex items-center justify-between p-4 bg-white border-[2.5px] border-[#111] rounded-[16px] shadow-[4px_4px_0_#111] hover:shadow-[2px_2px_0_#111] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[12px] bg-[#3DDC97] border-[2px] border-[#111] flex items-center justify-center text-xl shadow-[2px_2px_0_#111]">
              🧹
            </div>
            <div>
              <h3 className="font-heading font-black text-base text-[#111]">
                Chores & Aaj ki Baari
              </h3>
              <p className="text-xs font-semibold text-gray-500">
                {pendingChores.length} pending chores · Auto-rotate tasks
              </p>
            </div>
          </div>
          <ArrowRight size={18} />
        </Link>

        {/* Rules */}
        <Link
          href="/live/rules"
          className="flex items-center justify-between p-4 bg-white border-[2.5px] border-[#111] rounded-[16px] shadow-[4px_4px_0_#111] hover:shadow-[2px_2px_0_#111] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[12px] bg-[#6EC6FF] border-[2px] border-[#111] flex items-center justify-center text-xl shadow-[2px_2px_0_#111]">
              📜
            </div>
            <div>
              <h3 className="font-heading font-black text-base text-[#111]">
                House Rules
              </h3>
              <p className="text-xs font-semibold text-gray-500">
                {rules.length} rules set · Roommate agreement votes
              </p>
            </div>
          </div>
          <ArrowRight size={18} />
        </Link>
      </div>
    </div>
  );
}

