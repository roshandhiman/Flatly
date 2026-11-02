'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useStore } from '@/lib/store';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { TextArea } from '@/components/ui/TextArea';
import { EmptyState } from '@/components/ui/EmptyState';
import { Avatar } from '@/components/ui/Avatar';
import {
  ArrowLeft,
  Bot,
  Check,
  CheckCircle2,
  FileText,
  Plus,
  Sparkles,
  ThumbsUp,
  Trash2,
  ShieldCheck,
  MessageSquareHeart,
  Scale
} from 'lucide-react';

export default function RulesPage() {
  const { flat, rules, addRule, deleteRule, toggleRuleAgreement, profile, isHydrated } =
    useStore();

  const [ruleText, setRuleText] = useState('');
  const [error, setError] = useState('');
  const [successNote, setSuccessNote] = useState(false);

  const members = flat?.members || [];

  // Determine current user's member ID
  const currentMember =
    members.find(
      (m) =>
        m.name.toLowerCase() === profile?.name?.toLowerCase() ||
        m.name.includes('(You)')
    ) || members[0];

  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleText.trim()) {
      setError('Please write a rule (e.g. Quiet hours after 11 PM)');
      return;
    }

    addRule(ruleText.trim());
    setRuleText('');
    setError('');
    setSuccessNote(true);
    setTimeout(() => setSuccessNote(false), 2000);
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
              House Rules & Agreements 📜
            </h1>
            <p className="text-xs font-semibold text-gray-500">
              {flat.name} • Co-living guidelines with member consensus voting
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-xs font-black px-3 py-1 bg-[#FFD23F] border-[2px] border-[#111] rounded-full shadow-[2px_2px_0_#111]">
            {rules.length} Rules Active
          </span>
        </div>
      </div>

      {/* Main Responsive Grid Layout (Desktop 2-Col, Mobile 1-Col) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Section: Rules List (Col 7) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-heading font-black text-sm md:text-base text-[#111] uppercase tracking-wide">
              Agreed Rules ({rules.length})
            </h2>
            <span className="text-xs font-bold text-gray-500">
              Tap &ldquo;Agree&rdquo; to add your vote
            </span>
          </div>

          {rules.length === 0 ? (
            <EmptyState
              emoji="📜"
              title="Koi rules decide nahi huye!"
              description="Clear expectations prevent roommate conflict. Add guidelines for kitchen cleaning, guests, and quiet hours."
            />
          ) : (
            <div className="space-y-4">
              {rules.map((rule, idx) => {
                const agreedCount = rule.agreedBy.length;
                const totalMembers = Math.max(members.length, 1);
                const userHasAgreed = currentMember
                  ? rule.agreedBy.includes(currentMember.id)
                  : false;

                return (
                  <div
                    key={rule.id}
                    className="p-5 bg-white border-[2.5px] border-[#111] rounded-[20px] shadow-[5px_5px_0_#111] space-y-3.5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <span className="w-7 h-7 rounded-[8px] bg-[#FFD23F] border-[2px] border-[#111] flex items-center justify-center text-xs font-black flex-shrink-0 mt-0.5 shadow-[1.5px_1.5px_0_#111]">
                          {idx + 1}
                        </span>
                        <p className="text-sm md:text-base font-bold text-[#111] leading-snug">
                          {rule.text}
                        </p>
                      </div>

                      <button
                        onClick={() => deleteRule(rule.id)}
                        className="text-gray-400 hover:text-red-600 transition-colors cursor-pointer flex-shrink-0 p-1"
                        title="Delete rule"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    {/* Agreement Bar & Agree Button */}
                    <div className="flex items-center justify-between pt-3 border-t-[1.5px] border-gray-100">
                      <div className="flex items-center gap-2.5">
                        <span className="text-xs font-black text-gray-700">
                          {agreedCount}/{totalMembers} agreed
                        </span>

                        {/* Member agreement avatars */}
                        <div className="flex -space-x-1.5">
                          {rule.agreedBy.map((memberId) => {
                            const m = members.find((x) => x.id === memberId);
                            if (!m) return null;
                            return (
                              <Avatar
                                key={memberId}
                                name={m.name}
                                color={m.avatarColor}
                                size="sm"
                              />
                            );
                          })}
                        </div>
                      </div>

                      {currentMember && (
                        <button
                          onClick={() =>
                            toggleRuleAgreement(rule.id, currentMember.id)
                          }
                          className={`px-3.5 py-1.5 rounded-[10px] border-[2px] border-[#111] text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
                            userHasAgreed
                              ? 'bg-[#3DDC97] text-[#111] shadow-[2px_2px_0_#111]'
                              : 'bg-white text-gray-700 shadow-[2px_2px_0_#111] hover:bg-gray-100'
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
