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
} from 'lucide-react';

export default function RulesPage() {
  const { flat, rules, addRule, deleteRule, toggleRuleAgreement, profile } =
    useStore();

  const [ruleText, setRuleText] = useState('');
  const [error, setError] = useState('');

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
  };

  if (!flat) {
    return (
      <div className="p-4">
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
    <div className="p-4 space-y-4">
      {/* Top Header */}
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
              House Rules
            </h1>
            <p className="text-[11px] font-semibold text-gray-500">
              {flat.name}
            </p>
          </div>
        </div>

        {/* Disabled "Generate with AI" button requirement */}
        <button
          disabled
          className="px-3 py-1.5 rounded-[10px] border-[2px] border-gray-400 bg-gray-200 text-gray-500 text-xs font-bold flex items-center gap-1.5 opacity-60 cursor-not-allowed"
          title="AI generation is reserved for Stage 2"
        >
          <Bot size={14} />
          <span>Generate with AI (Stage 2)</span>
        </button>
      </div>

      {/* Add Rule Form */}
      <Card className="bg-white space-y-3">
        <h2 className="font-heading font-black text-sm text-[#111] uppercase tracking-wide">
          + Add New Flat Rule
        </h2>

        <form onSubmit={handleAddRule} className="space-y-3">
          <TextArea
            placeholder="e.g. No loud music on weekdays after 11 PM. Clean stove after cooking."
            value={ruleText}
            onChange={(e) => {
              setRuleText(e.target.value);
              if (error) setError('');
            }}
            error={error}
          />

          <Button type="submit" variant="primary" fullWidth size="md">
            <Plus size={16} />
            <span>Add Rule</span>
          </Button>
        </form>
      </Card>

      {/* Rules List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-heading font-black text-sm text-[#111] uppercase tracking-wide">
            Agreed Rules ({rules.length})
          </h2>
          <span className="text-[11px] font-bold text-gray-500">
            Tap Agree to vote
          </span>
        </div>

        {rules.length === 0 ? (
          <EmptyState
            emoji="📜"
            title="Koi rules decide nahi huye!"
            description="Clear expectations make great flatmates. Add rules for kitchen cleaning, guests, and quiet hours."
          />
        ) : (
          rules.map((rule, idx) => {
            const agreedCount = rule.agreedBy.length;
            const totalMembers = Math.max(members.length, 1);
            const userHasAgreed = currentMember
              ? rule.agreedBy.includes(currentMember.id)
              : false;

            return (
              <div
                key={rule.id}
                className="p-4 bg-white border-[2.5px] border-[#111] rounded-[16px] shadow-[4px_4px_0_#111] space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-[#FFD23F] border-[2px] border-[#111] flex items-center justify-center text-xs font-black flex-shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <p className="text-sm font-bold text-[#111] leading-snug">
                      {rule.text}
                    </p>
                  </div>

                  <button
                    onClick={() => deleteRule(rule.id)}
                    className="text-gray-400 hover:text-red-600 transition-colors cursor-pointer flex-shrink-0"
                    title="Delete rule"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {/* Agreement Bar & Agree Button */}
                <div className="flex items-center justify-between pt-2 border-t-[1.5px] border-gray-100">
                  <div className="flex items-center gap-2">
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
                      className={`px-3 py-1 rounded-[8px] border-[2px] border-[#111] text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                        userHasAgreed
                          ? 'bg-[#3DDC97] text-[#111] shadow-[2px_2px_0_#111]'
                          : 'bg-white text-gray-700 shadow-[2px_2px_0_#111] hover:bg-gray-100'
                      }`}
                    >
                      <ThumbsUp size={13} />
                      <span>{userHasAgreed ? 'Agreed ✓' : 'Agree'}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

