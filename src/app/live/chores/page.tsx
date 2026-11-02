'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useStore } from '@/lib/store';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Avatar } from '@/components/ui/Avatar';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatusPill } from '@/components/ui/StatusPill';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Plus,
  RotateCw,
  Sparkles,
  Trash2,
  Trophy,
  Check,
  RefreshCw
} from 'lucide-react';

const DAYS_OF_WEEK = [
  'Today',
  'Tomorrow',
  'Every Monday',
  'Every Tuesday',
  'Every Wednesday',
  'Every Thursday',
  'Every Friday',
  'Every Saturday',
  'Every Sunday',
];

export default function ChoresPage() {
  const {
    flat,
    chores,
    addChore,
    deleteChore,
    markChoreDone,
    rotateChore,
    isHydrated,
  } = useStore();

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [task, setTask] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [frequency, setFrequency] = useState<'once' | 'weekly'>('weekly');
  const [dueDay, setDueDay] = useState(DAYS_OF_WEEK[0]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [choreAddedNote, setChoreAddedNote] = useState(false);

  const members = flat?.members || [];

  // Automatically select the first member if none selected
  useEffect(() => {
    if (!assignedTo && members.length > 0) {
      setAssignedTo(members[0].id);
    }
  }, [members, assignedTo]);

  const handleOpenAdd = () => {
    setTask('');
    setAssignedTo(members[0]?.id || '');
    setFrequency('weekly');
    setDueDay(DAYS_OF_WEEK[0]);
    setErrors({});
    setIsSheetOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!task.trim()) errs.task = 'Task name is required (e.g. Garbage & Kitchen)';
    if (!assignedTo) errs.assignedTo = 'Select who is responsible';

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    addChore({
      task: task.trim(),
      assignedTo,
      frequency,
      dueDay,
    });

    setTask('');
    setChoreAddedNote(true);
    setTimeout(() => setChoreAddedNote(false), 2000);
    setIsSheetOpen(false);
  };

  // Compute completions this month per member (strictly from real data)
  const [completionsCountByMember, setCompletionsCountByMember] = useState<Record<string, number>>({});

  useEffect(() => {
    const counts: Record<string, number> = {};
    members.forEach((m) => {
      counts[m.id] = 0;
    });

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    chores.forEach((c) => {
      c.completions?.forEach((comp) => {
        const compDate = new Date(comp.completedAt);
        if (
          compDate.getMonth() === currentMonth &&
          compDate.getFullYear() === currentYear
        ) {
          if (counts[comp.completedBy] !== undefined) {
            counts[comp.completedBy]++;
          }
        }
      });
    });

    setCompletionsCountByMember(counts);
  }, [chores, members]);

  if (!isHydrated) {
    return (
      <div className="p-8 text-center font-heading font-black text-sm text-[#111]">
        Loading your pad chores... 🧹
      </div>
    );
  }

  if (!flat) {
    return (
      <div className="p-6 md:p-8">
        <EmptyState
          emoji="🏠"
          title="No Flat Connected"
          description="Create or join a flat first before creating chores."
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
              Chores & Aaj Ki Baari 🧹
            </h1>
            <p className="text-xs font-semibold text-gray-500">
              {flat.name} • Circular rotation among {members.length} flatmates
            </p>
          </div>
        </div>

        <Button onClick={handleOpenAdd} size="md" variant="mint" className="self-start sm:self-auto">
          <Plus size={16} />
          <span>+ Add Chore</span>
        </Button>
      </div>

      {/* Main Responsive Grid Layout (Desktop 2-Col, Mobile 1-Col) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Section: Chores Feed (Col 7) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-heading font-black text-sm md:text-base text-[#111] uppercase tracking-wide">
              Assigned Tasks ({chores.length})
            </h2>
            <span className="text-xs font-bold text-gray-500">
              Auto-wraps to next flatmate when rotated
            </span>
          </div>

          {chores.length === 0 ? (
            <EmptyState
              emoji="🧹"
              title="Koi chore assigned nahi hai!"
              description="Sab kaam pending hai ya sab sorted? Add tasks like dishes, dustbin, or bathroom duty."
              actionLabel="+ Add First Chore"
              onAction={handleOpenAdd}
            />
          ) : (
            <div className="space-y-4">
              {chores.map((chore) => {
                const assignee = members.find((m) => m.id === chore.assignedTo);
                const isDone = chore.status === 'done';

                return (
                  <div
                    key={chore.id}
                    className={`p-4 md:p-5 border-[2.5px] border-[#111] rounded-[20px] shadow-[5px_5px_0_#111] space-y-3.5 transition-all ${
                      isDone ? 'bg-[#E6F9F0]' : 'bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <StatusPill
                            label={isDone ? 'DONE' : 'PENDING'}
                            variant={isDone ? 'done' : 'pending'}
                          />
                          <span className="text-xs font-bold text-gray-500 flex items-center gap-1">
                            <Clock size={13} />
                            {chore.dueDay} ({chore.frequency})
                          </span>
                        </div>

                        <h3 className="font-heading font-black text-lg md:text-xl text-[#111]">
                          {chore.task}
                        </h3>
                      </div>

                      <button
                        onClick={() => deleteChore(chore.id)}
                        className="text-gray-400 hover:text-red-600 transition-colors cursor-pointer p-1"
                        title="Delete chore"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    {/* Assignee Card row */}
                    <div className="flex items-center justify-between p-3 bg-[#FFF8EC] border-[2px] border-[#111] rounded-[14px]">
                      <div className="flex items-center gap-2.5">
                        <Avatar
                          name={assignee?.name || 'Unassigned'}
                          color={assignee?.avatarColor || '#FFD23F'}
                          size="sm"
                        />
                        <div>
                          <span className="text-[10px] font-bold text-gray-500 block leading-tight">
                            Aaj ki baari:
                          </span>
                          <span className="text-xs md:text-sm font-black text-[#111]">
                            {assignee?.name || 'Unassigned'}
                          </span>
                        </div>
                      </div>

                      {/* Actions: Mark Done & Rotate */}
                      <div className="flex items-center gap-2">
                        {!isDone ? (
                          <button
                            onClick={() => markChoreDone(chore.id)}
                            className="px-3 py-1.5 bg-[#3DDC97] border-[1.5px] border-[#111] shadow-[2px_2px_0_#111] rounded-[10px] text-xs font-black flex items-center gap-1.5 hover:translate-x-[1px] hover:translate-y-[1px] cursor-pointer"
                          >
                            <CheckCircle2 size={15} />
                            <span>Done</span>
                          </button>
                        ) : (
                          <span className="text-xs font-black text-green-700 bg-white px-2.5 py-1 rounded-md border border-green-600">
                            ✅ Done
                          </span>
                        )}

                        <button
                          onClick={() => rotateChore(chore.id)}
                          className="px-3 py-1.5 bg-white border-[1.5px] border-[#111] shadow-[2px_2px_0_#111] rounded-[10px] text-xs font-black flex items-center gap-1.5 hover:translate-x-[1px] hover:translate-y-[1px] cursor-pointer hover:bg-gray-50"
                          title="Pass turn to next roommate"
                        >
                          <RotateCw size={14} />
                          <span>Rotate</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Section: Add Form & Monthly Leaderboard (Col 5) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Direct Add Chore Card on Desktop */}
          <div className="p-6 bg-white border-[2.5px] border-[#111] rounded-[24px] shadow-[6px_6px_0_#111] space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b-[2px] border-[#111]">
              <Sparkles size={18} />
              <h2 className="font-heading font-black text-base md:text-lg text-[#111]">
                Schedule a Chore
              </h2>
            </div>

            {choreAddedNote && (
              <div className="p-3 bg-[#3DDC97] text-[#111] rounded-[10px] border-[1.5px] border-[#111] text-xs font-black flex items-center gap-1.5 shadow-[2px_2px_0_#111]">
                <Check size={16} strokeWidth={3} />
                <span>Chore scheduled and assigned!</span>
              </div>
            )}

            {members.length === 0 ? (
              <p className="text-xs text-gray-500 font-semibold py-4 text-center">
                Please add flatmates first so you can assign chores to them!
              </p>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Chore / Task Name"
                  placeholder="e.g. Dustbin Throw & Kitchen Wipe"
                  value={task}
                  onChange={(e) => {
                    setTask(e.target.value);
                    if (errors.task) setErrors({ ...errors, task: '' });
                  }}
                  error={errors.task}
                />

                {/* Assign to */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-black uppercase tracking-wider text-gray-600">
                    Assign To
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {members.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          setAssignedTo(m.id);
                          if (errors.assignedTo) setErrors({ ...errors, assignedTo: '' });
                        }}
                        className={`flex items-center gap-2 p-2 rounded-[10px] border-[2px] border-[#111] text-xs font-bold transition-all cursor-pointer ${
                          assignedTo === m.id
                            ? 'bg-[#FFD23F] shadow-[2px_2px_0_#111]'
                            : 'bg-white shadow-[1px_1px_0_#111]'
                        }`}
                      >
                        <Avatar name={m.name} color={m.avatarColor} size="sm" />
                        <span className="truncate">{m.name}</span>
                      </button>
                    ))}
                  </div>
                  {errors.assignedTo && (
                    <p className="text-xs font-bold text-red-600">{errors.assignedTo}</p>
                  )}
                </div>

                {/* Schedule Day */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-black uppercase tracking-wider text-gray-600">
                    Schedule / Due Day
                  </label>
                  <select
                    value={dueDay}
                    onChange={(e) => setDueDay(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white border-[2px] border-[#111] rounded-[12px] shadow-[2.5px_2.5px_0_#111] text-xs font-bold"
                  >
                    {DAYS_OF_WEEK.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Frequency */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-black uppercase tracking-wider text-gray-600">
                    Frequency
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFrequency('weekly')}
                      className={`py-2 px-3 rounded-[10px] border-[2px] border-[#111] text-xs font-bold cursor-pointer ${
                        frequency === 'weekly'
                          ? 'bg-[#FFD23F] shadow-[2px_2px_0_#111]'
                          : 'bg-white'
                      }`}
                    >
                      Weekly (Rotating)
                    </button>
                    <button
                      type="button"
                      onClick={() => setFrequency('once')}
                      className={`py-2 px-3 rounded-[10px] border-[2px] border-[#111] text-xs font-bold cursor-pointer ${
                        frequency === 'once'
                          ? 'bg-[#FFD23F] shadow-[2px_2px_0_#111]'
                          : 'bg-white'
                      }`}
                    >
                      One-time Task
                    </button>
                  </div>
                </div>

                <Button type="submit" variant="mint" fullWidth size="lg">
                  <Plus size={16} />
                  <span>Assign Chore</span>
                </Button>
              </form>
            )}
          </div>

          {/* Real "Done This Month" Leaderboard */}
          <div className="p-6 bg-white border-[2.5px] border-[#111] rounded-[24px] shadow-[6px_6px_0_#111] space-y-3">
            <div className="flex items-center justify-between pb-2 border-b-[2px] border-[#111]">
              <div className="flex items-center gap-2">
                <Trophy size={18} className="text-[#FFD23F]" />
                <h3 className="font-heading font-black text-sm md:text-base text-[#111]">
                  Fairness Stats (Last 30 Days)
                </h3>
              </div>
              <span className="text-[10px] font-bold text-gray-500">
                ChoreLog
              </span>
            </div>

            {members.length === 0 ? (
              <p className="text-xs text-gray-500 py-2">Add flatmates to track fairness.</p>
            ) : (
              <div className="space-y-2.5 pt-1">
                {members.map((m) => {
                  const count = completionsCountByMember[m.id] || 0;
                  const totalDone = Object.values(completionsCountByMember).reduce((a, b) => a + b, 0);
                  const sharePct = totalDone > 0 ? Math.round((count / totalDone) * 100) : 0;

                  return (
                    <div
                      key={m.id}
                      className="p-3 bg-[#FFF8EC] border-[2px] border-[#111] rounded-[14px] shadow-[2px_2px_0_#111] space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 truncate">
                          <Avatar name={m.name} color={m.avatarColor} size="sm" />
                          <span className="text-xs font-bold text-[#111] truncate">{m.name}</span>
                        </div>
                        <span className="font-heading font-black text-xs px-2.5 py-0.5 bg-[#FFD23F] border border-[#111] rounded-[6px]">
                          {count} done ({sharePct}%)
                        </span>
                      </div>
                      {/* Visual progress share bar */}
                      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden border border-black/20">
                        <div
                          className="h-full bg-[#3DDC97] rounded-full transition-all duration-300"
                          style={{ width: `${Math.max(sharePct, count > 0 ? 10 : 0)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Chore Bottom Sheet (Mobile fallback) */}
      <BottomSheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        title="Add Chore 🧹"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Chore / Task Name"
            placeholder="e.g. Garbage Throw & Kitchen Counters"
            value={task}
            onChange={(e) => setTask(e.target.value)}
            error={errors.task}
          />

          {/* Assign to */}
          <div className="space-y-1.5">
            <label className="block text-sm font-bold text-[#111]">
              Assign To
            </label>
            <div className="grid grid-cols-2 gap-2">
              {members.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    setAssignedTo(m.id);
                    if (errors.assignedTo) setErrors({ ...errors, assignedTo: '' });
                  }}
                  className={`flex items-center gap-2 p-2 rounded-[10px] border-[2px] border-[#111] text-xs font-bold transition-all cursor-pointer ${
                    assignedTo === m.id ? 'bg-[#FFD23F]' : 'bg-white'
                  }`}
                >
                  <Avatar name={m.name} color={m.avatarColor} size="sm" />
                  <span className="truncate">{m.name}</span>
                </button>
              ))}
            </div>
            {errors.assignedTo && (
              <p className="text-xs font-bold text-red-600">{errors.assignedTo}</p>
            )}
          </div>

          <Button type="submit" variant="primary" fullWidth size="lg">
            <span>Create Chore</span>
          </Button>
        </form>
      </BottomSheet>
    </div>
  );
}
