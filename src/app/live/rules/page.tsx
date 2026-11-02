'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import { Rule, Member } from '@/lib/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { TextArea } from '@/components/ui/TextArea';
import { EmptyState } from '@/components/ui/EmptyState';
import { Avatar } from '@/components/ui/Avatar';
import {
  ArrowLeft,
  Bot,
  Check,
  Plus,
  ThumbsUp,
  Trash2,
  Users,
} from 'lucide-react';

export default function RulesPage() {
  const { flat, rules: storeRules, addRule, deleteRule, toggleRuleAgreement, profile, isHydrated } =
    useStore();

  const [ruleText, setRuleText] = useState('');
  const [error, setError] = useState('');
  const [successNote, setSuccessNote] = useState(false);
  const [liveRules, setLiveRules] = useState<Rule[]>([]);
  const [hasSynced, setHasSynced] = useState(false);

  const members: Member[] = flat?.members || [];

  // Determine current user's member object
  const currentMember =
    members.find(
      (m) =>
        (profile?.name &&
          (m.name.toLowerCase() === profile.name.toLowerCase() ||
           m.name.toLowerCase().includes(profile.name.toLowerCase()))) ||
        m.name.includes('(You)')
    ) || members[0];

  // Determine if current user is admin
  const isAdmin =
    currentMember?.role === 'admin' ||
    (members[0] &&
      (members[0].role === 'admin' ||
       members[0].name.includes('(Admin)') ||
       (profile?.name && members[0].name.toLowerCase().includes(profile.name.toLowerCase()))));

  // Map Supabase rule row → Rule type
  const mapRow = useCallback(
    (row: any): Rule => ({
      id: row.id,
      text: row.text,
      agreedBy: Array.isArray(row.agreed_by) ? row.agreed_by : [],
      createdAt: row.created_at,
    }),
    []
  );

  const fetchRules = useCallback(async () => {
    if (!flat?.id) return;
    try {
      const { data } = await supabase
        .from('rules')
        .select('*')
        .eq('flat_id', flat.id)
        .not('text', 'like', 'CHAT_MSG::%')
        .order('created_at', { ascending: false });

      if (data) {
        setLiveRules(data.map(mapRow));
        setHasSynced(true);
      }
    } catch (err) {
      console.error('Error fetching rules from Supabase:', err);
    }
  }, [flat?.id, mapRow]);

  // Real-time synchronization + polling every 2.5 seconds
  useEffect(() => {
    if (!flat?.id) return;

    fetchRules();
    const interval = setInterval(fetchRules, 2500);

    const channel = supabase
      .channel(`rules-realtime-${flat.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', filter: `flat_id=eq.${flat.id}` },
        () => {
          fetchRules();
        }
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [flat?.id, fetchRules]);

  // Merge store rules (optimistic) with live rules from Supabase
  const storeActiveRules = storeRules.filter((r) => !r.text.startsWith('CHAT_MSG::'));
  const activeRules = hasSynced ? liveRules : storeActiveRules;

  const handleToggleAgreement = async (ruleId: string) => {
    if (!currentMember?.id) return;
    const memberId = currentMember.id;

    // Optimistic UI update so feedback is instantaneous
    setLiveRules((prev) =>
      prev.map((r) => {
        if (r.id !== ruleId) return r;
        const exists = r.agreedBy.includes(memberId);
        const nextAgreed = exists
          ? r.agreedBy.filter((id) => id !== memberId)
          : [...r.agreedBy, memberId];
        return { ...r, agreedBy: nextAgreed };
      })
    );

    await toggleRuleAgreement(ruleId, memberId);
    // Refresh to get server confirmed state
    setTimeout(fetchRules, 300);
  };

  const handleAddRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleText.trim()) {
      setError('Please write a rule (e.g. Quiet hours after 11 PM)');
      return;
    }
    await addRule(ruleText.trim());
    setRuleText('');
    setError('');
    setSuccessNote(true);
    setTimeout(() => setSuccessNote(false), 2000);
    setTimeout(fetchRules, 500);
  };

  const handleDeleteRule = async (ruleId: string) => {
    setLiveRules((prev) => prev.filter((r) => r.id !== ruleId));
    await deleteRule(ruleId);
    setTimeout(fetchRules, 500);
  };

  if (!isHydrated) {
    return (
      <div className="p-8 text-center font-heading font-black text-sm text-[#111]">
        Loading your house rules... 📜
      </div>
    );
  }

  if (!flat) {
    return (
      <div className="p-6 md:p-8">
        <EmptyState
          emoji="🏠"
          title="No Flat Connected"
          description="Create or join a flat first before creating house rules."
          actionLabel="Go to Flat Setup"
          onAction={() => (window.location.href = '/live')}
        />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      {/* Top Header */}
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
              House Rules &amp; Agreements 📜
            </h1>
            <p className="text-xs font-semibold text-gray-500">
              {flat.name} • Co-living guidelines with live consensus voting
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-xs font-black px-3 py-1 bg-[#FFD23F] border-[2px] border-[#111] rounded-full shadow-[2px_2px_0_#111]">
            {activeRules.length} Rules Active
          </span>
        </div>
      </div>

      {/* Main Responsive Grid Layout (Desktop 2-Col, Mobile 1-Col) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Section: Rules List (Col 7) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-heading font-black text-sm md:text-base text-[#111] uppercase tracking-wide">
              Agreed Rules ({activeRules.length})
            </h2>
            <span className="text-xs font-bold text-gray-500">
              Tap &ldquo;Agree&rdquo; to add your vote
            </span>
          </div>

          {activeRules.length === 0 ? (
            <EmptyState
              emoji="📜"
              title="Koi rules decide nahi huye!"
              description="Clear expectations prevent roommate conflict. Add guidelines for kitchen cleaning, guests, and quiet hours."
            />
          ) : (
            <div className="space-y-4">
              {activeRules.map((rule, idx) => {
                const agreedCount = rule.agreedBy.length;
                const totalMembers = Math.max(members.length, 1);
                const userHasAgreed = currentMember
                  ? rule.agreedBy.includes(currentMember.id)
                  : false;

                // Resolve agreed member IDs to real member objects
                const agreedMembers = rule.agreedBy
                  .map((id) => members.find((m) => m.id === id))
                  .filter(Boolean) as Member[];

                return (
                  <div
                    key={rule.id}
                    className="p-5 bg-white border-[2.5px] border-[#111] rounded-[20px] shadow-[5px_5px_0_#111] space-y-4 transition-all"
                  >
                    {/* Rule header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <span className="w-7 h-7 min-w-7 rounded-full bg-[#FFD23F] border-[2px] border-[#111] flex items-center justify-center text-xs font-black shadow-[1px_1px_0_#111]">
                          {idx + 1}
                        </span>
                        <p className="font-bold text-sm text-[#111] leading-snug pt-0.5">
                          {rule.text}
                        </p>
                      </div>

                      {/* Admin-only rule deletion */}
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => handleDeleteRule(rule.id)}
                          className="p-1.5 rounded-[8px] text-gray-400 hover:text-red-600 hover:bg-red-50 cursor-pointer transition-colors border border-transparent hover:border-red-200"
                          title="Delete rule (Admin)"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>

                    {/* Agreed count + real member name badges */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-gray-100">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-gray-600">
                            {agreedCount}/{totalMembers} agreed
                          </span>
                        </div>

                        {/* Real member name pills */}
                        <div className="flex flex-wrap items-center gap-1.5">
                          {agreedMembers.length > 0 ? (
                            agreedMembers.map((m) => {
                              const cleanName = m.name
                                .replace(' (Admin)', '')
                                .replace(' (You)', '');
                              return (
                                <span
                                  key={m.id}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FFF8EC] border-[1.5px] border-[#111] text-xs font-black text-[#111] shadow-[1.5px_1.5px_0_#111]"
                                  title={`${m.name} agreed`}
                                >
                                  <Avatar name={m.name} color={m.avatarColor} size="xs" />
                                  <span>{cleanName}</span>
                                  <Check size={12} className="text-green-600 stroke-[3]" />
                                </span>
                              );
                            })
                          ) : agreedCount > 0 ? (
                            <span className="text-[11px] font-bold text-gray-400 italic">
                              {agreedCount} flatmate(s) voted
                            </span>
                          ) : (
                            <span className="text-[11px] font-semibold text-gray-400 italic">
                              No votes yet
                            </span>
                          )}
                        </div>
                      </div>

                      {currentMember && (
                        <button
                          onClick={() => handleToggleAgreement(rule.id)}
                          className={`self-start sm:self-center px-4 py-2 rounded-[12px] border-[2px] border-[#111] text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
                            userHasAgreed
                              ? 'bg-[#3DDC97] text-[#111] shadow-[2.5px_2.5px_0_#111]'
                              : 'bg-white text-gray-700 shadow-[2.5px_2.5px_0_#111] hover:bg-[#FFD23F]'
                          }`}
                        >
                          <ThumbsUp size={14} />
                          <span>{userHasAgreed ? 'Agreed ✓' : 'Agree'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Section: Add Rule & AI Rule Generator (Col 5) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Add Rule Form */}
          <div className="p-6 bg-white border-[2.5px] border-[#111] rounded-[24px] shadow-[6px_6px_0_#111] space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b-[2px] border-[#111]">
              <Plus size={18} />
              <h2 className="font-heading font-black text-base md:text-lg text-[#111]">
                Add a Flat Rule
              </h2>
            </div>

            {successNote && (
              <div className="p-3 bg-[#3DDC97] text-[#111] rounded-[10px] border-[1.5px] border-[#111] text-xs font-black flex items-center gap-1.5 shadow-[2px_2px_0_#111]">
                <Check size={16} strokeWidth={3} />
                <span>Rule added to the house agreement!</span>
              </div>
            )}

            <form onSubmit={handleAddRule} className="space-y-4">
              <TextArea
                placeholder="e.g. Quiet hours on weekdays from 11:30 PM to 7:00 AM. Wash kitchen pans after cooking."
                value={ruleText}
                onChange={(e) => {
                  setRuleText(e.target.value);
                  if (error) setError('');
                }}
                error={error}
              />

              <Button type="submit" variant="primary" fullWidth size="lg">
                <Plus size={16} />
                <span>Propose Rule</span>
              </Button>
            </form>
          </div>

          {/* AI Rules Assistance & Conflict Tips */}
          <div className="p-6 bg-[#FFE17D] border-[2.5px] border-[#111] rounded-[24px] shadow-[6px_6px_0_#111] space-y-3">
            <div className="flex items-center gap-2">
              <Bot size={20} />
              <h3 className="font-heading font-black text-base text-[#111]">
                Flatly AI Co-Living Assistant
              </h3>
            </div>

            <p className="text-xs font-semibold text-gray-800 leading-relaxed bg-white/70 p-3.5 rounded-[14px] border border-black/15">
              💡 <strong>AI Tip:</strong> The backend AI module provides <code>POST /ai/house-rules</code> to generate 6-10 balanced rules tailored for Indian apartments (covering guests, cooking, quiet hours, and shared items).
            </p>

            <div className="space-y-2 pt-1 text-xs font-bold text-[#111]">
              <div className="p-2.5 bg-white border border-[#111] rounded-[10px] flex items-center justify-between">
                <span>🌙 Quiet hours (11 PM - 7 AM)</span>
                <span className="text-[#3DDC97] font-black">Recommended</span>
              </div>
              <div className="p-2.5 bg-white border border-[#111] rounded-[10px] flex items-center justify-between">
                <span>👫 Overnight guests with 4h notice</span>
                <span className="text-[#3DDC97] font-black">Recommended</span>
              </div>
              <div className="p-2.5 bg-white border border-[#111] rounded-[10px] flex items-center justify-between">
                <span>⚡ Electricity split equal by default</span>
                <span className="text-[#3DDC97] font-black">Standard</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
