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
  } = useStore();

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [task, setTask] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [frequency, setFrequency] = useState<'once' | 'weekly'>('weekly');
  const [dueDay, setDueDay] = useState(DAYS_OF_WEEK[0]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const members = flat?.members || [];

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

  if (!flat) {
    return (
      <div className="p-4">
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
              Chores & Tasks
            </h1>
            <p className="text-[11px] font-semibold text-gray-500">
              {flat.name}
            </p>
          </div>
        </div>

        <Button onClick={handleOpenAdd} size="sm" variant="mint">
          <Plus size={16} />
          <span>Add Chore</span>
        </Button>
      </div>

      {/* Real "Done This Month" Leaderboard */}
      <Card className="bg-white space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Trophy size={16} className="text-[#FFD23F]" />
            <h2 className="font-heading font-black text-xs text-[#111] uppercase tracking-wider">
              Completed This Month
            </h2>
          </div>
          <span className="text-[10px] font-bold text-gray-500">
            Real Task Completions
          </span>
        </div>

        {members.length === 0 ? (
          <p className="text-xs text-gray-500 py-1">Add members to track tasks.</p>
        ) : (
          <div className="grid grid-cols-2 gap-2 pt-1">
            {members.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between p-2 bg-[#FFF8EC] border-[2px] border-[#111] rounded-[10px]"
              >
                <div className="flex items-center gap-1.5 truncate">
                  <Avatar name={m.name} color={m.avatarColor} size="sm" />
                  <span className="text-xs font-bold truncate">{m.name}</span>
                </div>
                <span className="font-heading font-black text-sm px-2 py-0.5 bg-[#FFD23F] border border-[#111] rounded-[6px]">
                  {completionsCountByMember[m.id] || 0}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Chores Feed */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-heading font-black text-sm text-[#111] uppercase tracking-wide">
            Assigned Chores ({chores.length})
          </h2>
          <span className="text-[11px] font-bold text-gray-500">
            Tap rotate when someone&apos;s turn finishes
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
          chores.map((chore) => {
            const assignee = members.find((m) => m.id === chore.assignedTo);
            const isDone = chore.status === 'done';

            return (
              <div
                key={chore.id}
                className={`p-3.5 border-[2.5px] border-[#111] rounded-[16px] shadow-[4px_4px_0_#111] space-y-3 transition-all ${
                  isDone ? 'bg-[#E6F9F0]' : 'bg-white'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <StatusPill
                        label={isDone ? 'DONE' : 'PENDING'}
                        variant={isDone ? 'done' : 'pending'}
                      />
                      <span className="text-[11px] font-bold text-gray-500 flex items-center gap-1">
                        <Clock size={12} />
                        {chore.dueDay} ({chore.frequency})
                      </span>
                    </div>

                    <h3 className="font-heading font-black text-base text-[#111]">
                      {chore.task}
                    </h3>
                  </div>

                  <button
                    onClick={() => deleteChore(chore.id)}
                    className="text-gray-400 hover:text-red-600 transition-colors cursor-pointer"
                    title="Delete chore"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {/* Assignee Card row */}
                <div className="flex items-center justify-between p-2 bg-[#FFF8EC] border-[2px] border-[#111] rounded-[10px]">
                  <div className="flex items-center gap-2">
                    <Avatar
                      name={assignee?.name || 'Unassigned'}
                      color={assignee?.avatarColor || '#FFD23F'}
                      size="sm"
                    />
                    <div>
                      <span className="text-[10px] font-bold text-gray-500 block leading-tight">
                        Aaj ki baari:
                      </span>
                      <span className="text-xs font-black text-[#111]">
                        {assignee?.name || 'Unassigned'}
                      </span>
                    </div>
                  </div>

                  {/* Actions: Mark Done & Rotate */}
                  <div className="flex items-center gap-1.5">
                    {!isDone ? (
                      <button
                        onClick={() => markChoreDone(chore.id)}
                        className="px-2.5 py-1 bg-[#3DDC97] border-[1.5px] border-[#111] shadow-[2px_2px_0_#111] rounded-[8px] text-xs font-bold flex items-center gap-1 hover:translate-x-[1px] hover:translate-y-[1px] cursor-pointer"
                      >
                        <CheckCircle2 size={13} />
                        <span>Done</span>
                      </button>
                    ) : (
                      <span className="text-xs font-bold text-green-700">
                        ✅ Completed
                      </span>
                    )}

                    <button
                      onClick={() => rotateChore(chore.id)}
                      className="px-2 py-1 bg-white border-[1.5px] border-[#111] shadow-[2px_2px_0_#111] rounded-[8px] text-xs font-bold flex items-center gap-1 hover:translate-x-[1px] hover:translate-y-[1px] cursor-pointer"
                      title="Pass turn to next roommate"
                    >
                      <RotateCw size={13} />
                      <span>Rotate</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Chore Bottom Sheet */}
      <BottomSheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        title="Add Chore 🧹"
      >
        {members.length === 0 ? (
          <div className="text-center py-4 space-y-3">
            <p className="text-sm font-bold text-gray-700">
              Please add flatmates first so you can assign chores to them!
            </p>
            <Button
              onClick={() => {
                setIsSheetOpen(false);
                window.location.href = '/live';
              }}
              variant="primary"
            >
              Add Flatmates
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Chore / Task Name"
              placeholder="e.g. Garbage Throw & Kitchen Counters"
              value={task}
              onChange={(e) => {
                setTask(e.target.value);
                if (errors.task) setErrors({ ...errors, task: '' });
              }}
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
                    onClick={() => setAssignedTo(m.id)}
                    className={`flex items-center gap-2 p-2 rounded-[10px] border-[2px] border-[#111] text-xs font-bold transition-all cursor-pointer ${
                      assignedTo === m.id
                        ? 'bg-[#FFD23F] shadow-[2px_2px_0_#111]'
                        : 'bg-white shadow-[2px_2px_0_#111]'
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

            {/* Due Day */}
            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-[#111]">
                Due Day / Schedule
              </label>
              <select
                value={dueDay}
                onChange={(e) => setDueDay(e.target.value)}
                className="w-full px-3 py-2 bg-white border-[2.5px] border-[#111] rounded-[12px] shadow-[4px_4px_0_#111] text-xs font-bold"
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
              <label className="block text-sm font-bold text-[#111]">
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

            <Button type="submit" variant="primary" fullWidth size="lg">
              <span>Create Chore</span>
              <Sparkles size={16} />
            </Button>
          </form>
        )}
      </BottomSheet>
    </div>
  );
}
