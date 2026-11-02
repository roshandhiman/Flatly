'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { useAuth } from '@/lib/AuthContext';
import { syncFlatDataFromSupabase } from '@/lib/flatApi';
import { formatINR } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Avatar } from '@/components/ui/Avatar';
import {
  ArrowRight,
  Camera,
  Check,
  Copy,
  DollarSign,
  Image as ImageIcon,
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
  Bot,
  MessageSquare,
  AlertCircle,
  X
} from 'lucide-react';

const PHOTO_PRESETS = [
  {
    name: '🛋️ Cozy Living Room',
    url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80',
  },
  {
    name: '🌆 City Balcony',
    url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
  },
  {
    name: '🍕 Chill Flat Pad',
    url: 'https://images.unsplash.com/photo-1554995207-c18c203602cb?auto=format&fit=crop&w=1200&q=80',
  },
  {
    name: '🌿 Modern Studio',
    url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80',
  },
];

export default function LiveDashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const {
    flat,
    createFlat,
    joinFlat,
    addMember,
    removeMember,
    leaveFlat,
    updateFlatImage,
    expenses,
    chores,
    rules,
    profile,
    isHydrated,
  } = useStore();

  // Create Flat Form state
  const [flatName, setFlatName] = useState('');
  const [rent, setRent] = useState('');
  const [createError, setCreateError] = useState('');
  const [creating, setCreating] = useState(false);

  // Join Flat Form state
  const [joinCode, setJoinCode] = useState('');
  const [joinError, setJoinError] = useState('');
  const [joining, setJoining] = useState(false);

  // Add Member state
  const [newMemberName, setNewMemberName] = useState('');
  const [memberError, setMemberError] = useState('');
  const [addingMember, setAddingMember] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Flat photo modal/drawer state
  const [showPhotoPicker, setShowPhotoPicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check if current user is admin
  const currentMember =
    flat?.members.find(
      (m) =>
        (profile?.name &&
          (m.name.toLowerCase() === profile.name.toLowerCase() ||
           m.name.toLowerCase().includes(profile.name.toLowerCase()))) ||
        m.name.includes('(Admin)') ||
        m.name.includes('(You)')
    ) || flat?.members[0];

  const isAdmin =
    currentMember?.role === 'admin' ||
    (flat?.members[0] &&
      (flat.members[0].role === 'admin' ||
       flat.members[0].name.includes('(Admin)') ||
       (profile?.name &&
        flat.members[0].name.toLowerCase().includes(profile.name.toLowerCase()))));

  // Sync flat membership every 4 seconds so that if admin kicks someone, the screen updates
  useEffect(() => {
    if (!flat?.id) return;

    const interval = setInterval(() => {
      syncFlatDataFromSupabase(flat.id).then((res) => {
        if (res.flat) {
          const remoteMembers = res.flat.flat_members || [];
          const currentUserName = profile?.name?.toLowerCase() || '';

          if (currentUserName && remoteMembers.length > 0) {
            const stillInFlat = remoteMembers.some(
              (m: any) =>
                m.name.toLowerCase() === currentUserName ||
                m.name.toLowerCase().includes(currentUserName) ||
                m.name.includes('(Admin)') ||
                m.name.includes('(You)')
            );
            if (!stillInFlat) {
              leaveFlat();
            }
          }
        }
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [flat?.id, profile?.name, leaveFlat]);

  // Handle Create Flat
  const handleCreateFlat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!flatName.trim()) {
      setCreateError('Please enter a flat name');
      return;
    }
    setCreateError('');
    setCreating(true);

    const rentNumber = parseFloat(rent) || 0;
    const creator = profile?.name ? `${profile.name} (Admin)` : 'Me (Admin)';
    await createFlat(flatName.trim(), rentNumber, creator);
    setCreating(false);
  };

  // Handle Join Flat
  const handleJoinFlat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) {
      setJoinError('Enter a 6-character invite code');
      return;
    }
    setJoinError('');
    setJoining(true);

    const userName = profile?.name ? `${profile.name} (You)` : 'New Flatmate';
    const res = await joinFlat(joinCode.trim().toUpperCase(), userName);
    setJoining(false);

    if (!res.success) {
      setJoinError(res.error || 'Could not find flat with this code.');
    }
  };

  // Handle Add Member
  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim()) {
      setMemberError('Enter a roommate name');
      return;
    }
    setMemberError('');
    setAddingMember(true);
    await addMember(newMemberName.trim());
    setAddingMember(false);
    setNewMemberName('');
  };

  const copyCodeToClipboard = () => {
    if (flat?.code) {
      navigator.clipboard?.writeText(flat.code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        updateFlatImage(reader.result);
        setShowPhotoPicker(false);
      }
    };
    reader.readAsDataURL(file);
  };

  if (authLoading || !isHydrated) {
    return (
      <div className="p-8 text-center font-heading font-black text-sm text-[#111]">
        Loading your flat dashboard... 🏠
      </div>
    );
  }

  // AUTH GATE: User must be logged in to view / setup flats
  if (!user) {
    return (
      <div className="p-4 md:p-6 lg:p-8 max-w-2xl mx-auto space-y-6">
        <div className="p-6 md:p-8 bg-[#FFF8EC] border-[3px] border-[#111] rounded-[24px] shadow-[8px_8px_0_#111] space-y-6 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-[#FFD23F] border-[2px] border-[#111] rounded-full text-xs font-black shadow-[2px_2px_0_#111]">
            <ShieldCheck size={16} />
            <span>LOGIN REQUIRED</span>
          </div>

          <div className="space-y-2">
            <h1 className="font-heading font-black text-2xl md:text-3xl text-[#111]">
              Live Flat Hisab &amp; Chores Ke Liye Login Karein 🏠
            </h1>
            <p className="text-xs md:text-sm font-semibold text-gray-600 max-w-md mx-auto leading-relaxed">
              Login ensures your flat data, roommate hisab, chores, and group chat stay securely connected to your account across your phone and laptop.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2 max-w-sm mx-auto">
            <Link
              href="/login?redirect=/live"
              className="flex-1 px-5 py-3.5 bg-[#FFD23F] text-[#111] border-[2px] border-[#111] rounded-[14px] font-heading font-black text-sm shadow-[3px_3px_0_#111] hover:bg-[#ffe17d] hover:translate-x-[1px] hover:translate-y-[1px] transition-all flex items-center justify-center gap-2"
            >
              <span>Login to Account</span>
              <ArrowRight size={16} />
            </Link>

            <Link
              href="/login?mode=signup&redirect=/live"
              className="flex-1 px-5 py-3.5 bg-white text-[#111] border-[2px] border-[#111] rounded-[14px] font-heading font-black text-sm shadow-[3px_3px_0_#111] hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
            >
              <span>Sign Up Free</span>
            </Link>
          </div>

          {/* Feature Highlights */}
          <div className="pt-4 border-t-[2px] border-[#111] text-left grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-bold text-gray-700">
            <div className="flex items-start gap-2 p-3 bg-white border border-[#111] rounded-[12px] shadow-[1.5px_1.5px_0_#111]">
              <span className="text-base">📱</span>
              <span>Cloud sync between phone &amp; laptop</span>
            </div>
            <div className="flex items-start gap-2 p-3 bg-white border border-[#111] rounded-[12px] shadow-[1.5px_1.5px_0_#111]">
              <span className="text-base">💸</span>
              <span>Fair hisab &amp; zero-loss debt settlement</span>
            </div>
            <div className="flex items-start gap-2 p-3 bg-white border border-[#111] rounded-[12px] shadow-[1.5px_1.5px_0_#111]">
              <span className="text-base">🧹</span>
              <span>Weekly rotating chores so no one argues</span>
            </div>
            <div className="flex items-start gap-2 p-3 bg-white border border-[#111] rounded-[12px] shadow-[1.5px_1.5px_0_#111]">
              <span className="text-base">💬</span>
              <span>Real-time roommate chat &amp; flat agreements</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 1. NO FLAT CREATED YET
  if (!flat) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-6">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl font-black text-[#111]">
            Live Flat Mode 🏠
          </h1>
          <p className="text-xs md:text-sm font-semibold text-gray-500 mt-1">
            Set up your shared flat or enter an invite code to sync hisab, chores, and flat chat
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
                  Generates an invite code and syncs your group on cloud
                </p>
              </div>
            </div>

            <form onSubmit={handleCreateFlat} className="space-y-4">
              <Input
                label="Flat or Apartment Name"
                placeholder="e.g. 3BHK Indiranagar, Apunn Ka Adda"
                value={flatName}
                onChange={(e) => {
                  setFlatName(e.target.value);
                  if (createError) setCreateError('');
                }}
                error={createError}
              />

              <Input
                label="Monthly Rent in ₹ (Optional)"
                type="number"
                placeholder="e.g. 32000"
                value={rent}
                onChange={(e) => setRent(e.target.value)}
              />

              <Button type="submit" variant="primary" fullWidth size="lg" disabled={creating}>
                <span>{creating ? 'Creating on Cloud...' : 'Create Flat & Invite Roommates'}</span>
                <ArrowRight size={18} />
              </Button>
            </form>
          </Card>

          {/* Join Flat with Code */}
          <div className="space-y-4">
            <Card className="bg-white p-5 md:p-6 space-y-4">
              <div className="flex items-center gap-2.5 pb-2 border-b-[2px] border-[#111]">
                <div className="w-10 h-10 rounded-[12px] bg-[#3DDC97] border-[2px] border-[#111] flex items-center justify-center font-black text-xl shadow-[2px_2px_0_#111]">
                  🔑
                </div>
                <div>
                  <h2 className="font-heading font-black text-lg text-[#111]">
                    Join with Invite Code
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
                  onChange={(e) => {
                    setJoinCode(e.target.value.toUpperCase());
                    if (joinError) setJoinError('');
                  }}
                  error={joinError}
                />

                <Button type="submit" variant="secondary" fullWidth size="lg" disabled={joining}>
                  <span>{joining ? 'Connecting to Flat...' : 'Join Flat'}</span>
                  <ArrowRight size={18} />
                </Button>
              </form>

              <div className="p-3 bg-white border-[1.5px] border-[#111] rounded-[12px] text-xs text-gray-700 flex items-start gap-2 shadow-[2px_2px_0_#111]">
                <Info size={16} className="mt-0.5 text-blue-600 flex-shrink-0" />
                <span className="leading-snug">
                  <strong>Live Sync:</strong> Joining connects you to the shared pad, synchronizing expenses, chores, and the flat group chat.
                </span>
              </div>
            </Card>

            <div className="p-5 bg-white border-[2.5px] border-[#111] rounded-[20px] shadow-[4px_4px_0_#111] space-y-2">
              <h4 className="font-heading font-black text-sm text-[#111]">
                What you get with Flatly Live:
              </h4>
              <ul className="text-xs font-semibold text-gray-600 space-y-1.5 list-disc pl-4">
                <li>Automated fair expense split &amp; zero-loss debt minimization algorithm.</li>
                <li>Weekly circular chores rotation so nobody does dishes twice.</li>
                <li>Democratic house rules with live member agreement approvals.</li>
                <li>Shared flat group chat for daily discussions.</li>
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
      {/* Hidden File Input for Image Upload */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Flat Info Banner with Photo Support */}
      <div className="relative border-[2.5px] border-[#111] rounded-[24px] shadow-[6px_6px_0_#111] overflow-hidden bg-[#FFD23F]">
        {/* Cover Photo if set */}
        {flat.imageUrl && (
          <div className="relative w-full h-44 sm:h-52 md:h-64 border-b-[2.5px] border-[#111] overflow-hidden">
            <img
              src={flat.imageUrl}
              alt={flat.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
            <div className="absolute bottom-4 left-5 right-5 flex items-end justify-between">
              <div>
                <span className="px-3 py-0.5 bg-[#FFD23F] text-[#111] rounded-full text-[10px] font-black uppercase tracking-wider border border-[#111] shadow-[1.5px_1.5px_0_#111]">
                  ACTIVE FLAT
                </span>
                <h1 className="font-heading font-black text-2xl md:text-3xl text-white drop-shadow-md mt-1">
                  {flat.name}
                </h1>
                {flat.rent > 0 && (
                  <p className="text-xs md:text-sm font-bold text-gray-200 mt-0.5">
                    Monthly Rent: <span className="font-black text-[#FFD23F]">{formatINR(flat.rent)}/mo</span>
                  </p>
                )}
              </div>

              <button
                onClick={() => setShowPhotoPicker(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/90 backdrop-blur-xs border-[2px] border-[#111] rounded-[12px] text-xs font-black text-[#111] shadow-[2px_2px_0_#111] hover:bg-white transition-all cursor-pointer"
              >
                <Camera size={14} />
                <span>Change Photo</span>
              </button>
            </div>
          </div>
        )}

        {/* Banner Details (when no image OR under image) */}
        <div className={`p-5 md:p-6 ${flat.imageUrl ? 'bg-[#FFF8EC]' : 'bg-[#FFD23F]'} flex flex-col md:flex-row md:items-center justify-between gap-4`}>
          {!flat.imageUrl && (
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
          )}

          {/* Invite Code Box & Actions */}
          <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
            {!flat.imageUrl && (
              <button
                onClick={() => setShowPhotoPicker(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-white border-[2px] border-[#111] rounded-[14px] shadow-[2.5px_2.5px_0_#111] text-xs font-black hover:bg-yellow-50 transition-all cursor-pointer"
              >
                <Camera size={15} />
                <span>Add Flat Photo 📸</span>
              </button>
            )}

            <div className="flex items-center gap-2 p-2 bg-white border-[2px] border-[#111] rounded-[14px] shadow-[2.5px_2.5px_0_#111]">
              <div className="px-2">
                <span className="text-[9px] font-black uppercase text-gray-400 block leading-tight">
                  INVITE CODE
                </span>
                <code className="font-mono font-black text-base tracking-wider text-[#111]">
                  {flat.code}
                </code>
              </div>

              <button
                onClick={copyCodeToClipboard}
                className="flex items-center gap-1.5 text-xs font-black px-2.5 py-1.5 rounded-[10px] border-[1.5px] border-[#111] bg-[#FFD23F] hover:bg-[#ffe17d] transition-all cursor-pointer shadow-[1.5px_1.5px_0_#111]"
              >
                {copiedCode ? (
                  <>
                    <Check size={13} className="text-green-700 font-black" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy size={13} />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>

            <button
              onClick={() => {
                if (confirm('Is flat se disconnect ya leave karna chahte ho?')) {
                  leaveFlat();
                }
              }}
              className="px-3 py-2 bg-white text-gray-600 border-[2px] border-[#111] rounded-[14px] shadow-[2px_2px_0_#111] text-xs font-bold hover:text-red-600 hover:bg-red-50 cursor-pointer"
              title="Leave Flat"
            >
              Leave Flat
            </button>
          </div>
        </div>
      </div>

      {/* Flat Photo Picker Modal */}
      {showPhotoPicker && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#FFF8EC] border-[3px] border-[#111] rounded-[24px] shadow-[8px_8px_0_#111] p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b-[2px] border-[#111]">
              <div className="flex items-center gap-2">
                <Camera size={20} />
                <h3 className="font-heading font-black text-lg text-[#111]">
                  Flat Cover Photo
                </h3>
              </div>
              <button
                onClick={() => setShowPhotoPicker(false)}
                className="w-8 h-8 rounded-full border-[2px] border-[#111] bg-white flex items-center justify-center hover:bg-gray-100 cursor-pointer font-bold"
              >
                <X size={16} />
              </button>
            </div>

            {/* Upload Custom Image Button */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase text-gray-600">
                Option 1: Upload from Device
              </label>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full p-4 border-[2px] border-dashed border-[#111] rounded-[16px] bg-white hover:bg-[#FFD23F]/20 flex items-center justify-center gap-3 font-heading font-black text-sm text-[#111] transition-colors cursor-pointer shadow-[2px_2px_0_#111]"
              >
                <ImageIcon size={20} />
                <span>Choose photo from your gallery / files</span>
              </button>
            </div>

            {/* Presets */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase text-gray-600">
                Option 2: Choose Aesthetic Preset
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                {PHOTO_PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => {
                      updateFlatImage(preset.url);
                      setShowPhotoPicker(false);
                    }}
                    className="group relative h-24 rounded-[14px] border-[2px] border-[#111] overflow-hidden shadow-[2px_2px_0_#111] hover:scale-102 transition-transform cursor-pointer"
                  >
                    <img
                      src={preset.url}
                      alt={preset.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-end p-2">
                      <span className="text-[11px] font-black text-white drop-shadow">
                        {preset.name}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Remove photo option if one is set */}
            {flat.imageUrl && (
              <button
                type="button"
                onClick={() => {
                  updateFlatImage('');
                  setShowPhotoPicker(false);
                }}
                className="w-full py-2 bg-red-100 text-red-700 border-[1.5px] border-red-500 rounded-[12px] text-xs font-black hover:bg-red-200 transition-colors"
              >
                Remove Current Photo
              </button>
            )}
          </div>
        </div>
      )}

      {/* 4 Core Section Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Expenses */}
        <Link
          href="/live/expenses"
          className="flex flex-col justify-between p-5 bg-white border-[2.5px] border-[#111] rounded-[20px] shadow-[5px_5px_0_#111] hover:shadow-[2px_2px_0_#111] hover:translate-x-[2px] hover:translate-y-[2px] transition-all group"
        >
          <div>
            <div className="w-12 h-12 rounded-[14px] bg-[#FFD23F] border-[2px] border-[#111] flex items-center justify-center text-2xl shadow-[2px_2px_0_#111] mb-3">
              💸
            </div>
            <h3 className="font-heading font-black text-lg text-[#111]">
              Expenses &amp; Hisab
            </h3>
            <p className="text-xs font-semibold text-gray-600 mt-1 leading-relaxed">
              {expenses.length} expenses recorded · Split shares with settle-up minimization.
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
            <h3 className="font-heading font-black text-lg text-[#111]">
              Chores &amp; Rotation
            </h3>
            <p className="text-xs font-semibold text-gray-600 mt-1 leading-relaxed">
              {pendingChores.length} pending tasks · Circular rotation &amp; 30-day stats.
            </p>
          </div>

          <div className="mt-5 pt-3 border-t-[1.5px] border-gray-100 flex items-center justify-between text-xs font-black text-[#111] group-hover:text-black">
            <span>View Chores</span>
            <ArrowRight size={16} />
          </div>
        </Link>

        {/* House Chat */}
        <Link
          href="/live/chat"
          className="flex flex-col justify-between p-5 bg-white border-[2.5px] border-[#111] rounded-[20px] shadow-[5px_5px_0_#111] hover:shadow-[2px_2px_0_#111] hover:translate-x-[2px] hover:translate-y-[2px] transition-all group"
        >
          <div>
            <div className="w-12 h-12 rounded-[14px] bg-[#FF6B57] text-white border-[2px] border-[#111] flex items-center justify-center text-2xl shadow-[2px_2px_0_#111] mb-3">
              💬
            </div>
            <h3 className="font-heading font-black text-lg text-[#111]">
              Flat Group Chat
            </h3>
            <p className="text-xs font-semibold text-gray-600 mt-1 leading-relaxed">
              Real-time messaging pad for roommates to coordinate on bills and groceries.
            </p>
          </div>

          <div className="mt-5 pt-3 border-t-[1.5px] border-gray-100 flex items-center justify-between text-xs font-black text-[#111] group-hover:text-black">
            <span>Open Chat</span>
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
            <h3 className="font-heading font-black text-lg text-[#111]">
              House Rules
            </h3>
            <p className="text-xs font-semibold text-gray-600 mt-1 leading-relaxed">
              {rules.length} active rules · Democratic agreements &amp; AI complaints rewrite.
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
            {isAdmin ? '👑 You are Flat Admin (Can remove members)' : 'All members can split expenses'}
          </span>
        </div>

        {/* Members List */}
        {flat.members.length === 0 ? (
          <div className="p-4 bg-[#FFF8EC] border-[2px] border-dashed border-[#111] rounded-[14px] text-center">
            <p className="text-xs font-bold text-gray-600">
              No flatmates added yet! Add roommates using the invite code or form below.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {flat.members.map((m) => {
              const isThisMemberAdmin =
                m.role === 'admin' ||
                m.name.includes('(Admin)') ||
                m.id === flat.members[0]?.id;
              const isSelf = m.id === currentMember?.id;

              return (
                <div
                  key={m.id}
                  className="flex items-center justify-between p-3 bg-[#FFF8EC] border-[2px] border-[#111] rounded-[14px] shadow-[2.5px_2.5px_0_#111]"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Avatar name={m.name} color={m.avatarColor} size="sm" />
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-bold text-[#111] truncate max-w-[110px]">
                          {m.name.replace(' (Admin)', '').replace(' (You)', '')}
                        </span>
                        {isThisMemberAdmin && (
                          <span className="px-1.5 py-0.2 bg-[#FFD23F] border border-[#111] rounded-full text-[9px] font-black text-[#111]">
                            Admin 👑
                          </span>
                        )}
                        {isSelf && (
                          <span className="text-[10px] font-bold text-gray-500">
                            (You)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Admin-only remove button: Only admin can see and trigger it; cannot remove self */}
                  {isAdmin && !isSelf && (
                    <button
                      type="button"
                      onClick={async () => {
                        const cleanName = m.name.replace(' (Admin)', '').replace(' (You)', '');
                        if (confirm(`Are you sure you want to remove ${cleanName} from this flat?`)) {
                          await removeMember(m.id);
                        }
                      }}
                      className="w-7 h-7 rounded-full bg-white border border-[#111] flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 cursor-pointer transition-colors shadow-[1px_1px_0_#111] flex-shrink-0 ml-1.5"
                      title={`Remove ${m.name} (Admin Only)`}
                    >
                      &times;
                    </button>
                  )}
                </div>
              );
            })}
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
          <Button type="submit" variant="secondary" size="md" disabled={addingMember}>
            <Plus size={16} />
            <span>{addingMember ? 'Adding...' : 'Add Member'}</span>
          </Button>
        </form>
      </Card>
    </div>
  );
}
