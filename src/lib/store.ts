'use client';

import { Flat, Expense, Settlement, Chore, ChoreCompletion, Rule, Listing, UserProfile, Member } from './types';
import { generateId, generateJoinCode, getAvatarColor } from './utils';
import {
  createFlatInSupabase,
  joinFlatInSupabase,
  addMemberToSupabase,
  removeMemberFromSupabase,
  addExpenseToSupabase,
  deleteExpenseFromSupabase,
  addSettlementToSupabase,
  addChoreToSupabase,
  markChoreDoneInSupabase,
  rotateChoreInSupabase,
  deleteChoreFromSupabase,
  addRuleToSupabase,
  toggleRuleAgreementInSupabase,
  deleteRuleFromSupabase,
  syncFlatDataFromSupabase
} from './flatApi';

// ---- localStorage helpers ----
function loadFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(`flatly_${key}`);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`flatly_${key}`, JSON.stringify(data));
  } catch {
    // Storage full or unavailable
  }
}

// ---- Store using React Context ----
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

interface StoreState {
  // Profile
  profile: UserProfile | null;
  setProfile: (profile: UserProfile) => void;

  // Flat
  flat: Flat | null;
  createFlat: (name: string, rent: number, creatorName?: string) => Promise<Flat | null>;
  joinFlat: (code: string, userName?: string) => Promise<{ success: boolean; error?: string }>;
  addMember: (name: string) => Promise<void>;
  removeMember: (id: string) => Promise<void>;
  leaveFlat: () => void;

  // Expenses
  expenses: Expense[];
  addExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;

  // Settlements
  settlements: Settlement[];
  addSettlement: (from: string, to: string, amount: number) => Promise<void>;

  // Chores
  chores: Chore[];
  addChore: (chore: Omit<Chore, 'id' | 'createdAt' | 'status' | 'completions'>) => Promise<void>;
  deleteChore: (id: string) => Promise<void>;
  markChoreDone: (id: string) => Promise<void>;
  rotateChore: (id: string) => Promise<void>;

  // Rules
  rules: Rule[];
  addRule: (text: string) => Promise<void>;
  deleteRule: (id: string) => Promise<void>;
  toggleRuleAgreement: (ruleId: string, memberId: string) => Promise<void>;

  // Listings
  listings: Listing[];
  addListing: (listing: Omit<Listing, 'id' | 'createdAt'>) => void;
  deleteListing: (id: string) => void;

  // Hydration
  isHydrated: boolean;
}

const StoreContext = createContext<StoreState | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [isHydrated, setIsHydrated] = useState(false);
  const [profile, setProfileState] = useState<UserProfile | null>(null);
  const [flat, setFlatState] = useState<Flat | null>(null);
  const [expenses, setExpensesState] = useState<Expense[]>([]);
  const [settlements, setSettlementsState] = useState<Settlement[]>([]);
  const [chores, setChoresState] = useState<Chore[]>([]);
  const [rules, setRulesState] = useState<Rule[]>([]);
  const [listings, setListingsState] = useState<Listing[]>([]);

  // Hydrate from localStorage on mount
  useEffect(() => {
    const p = loadFromStorage<UserProfile | null>('profile', null);
    const f = loadFromStorage<Flat | null>('flat', null);
    setProfileState(p);
    setFlatState(f);
    setExpensesState(loadFromStorage('expenses', []));
    setSettlementsState(loadFromStorage('settlements', []));
    setChoresState(loadFromStorage('chores', []));
    setRulesState(loadFromStorage('rules', []));
    setListingsState(loadFromStorage('listings', []));
    setIsHydrated(true);

    // If a flat is connected, try syncing latest data from Supabase
    if (f && f.id) {
      syncFlatDataFromSupabase(f.id).then(res => {
        if (res.flat) {
          const remoteMembers: Member[] = (res.flat.flat_members || []).map((m: any) => ({
            id: m.id,
            name: m.name,
            avatarColor: m.avatar_color
          }));
          const updatedFlat: Flat = {
            id: res.flat.id,
            name: res.flat.name,
            rent: Number(res.flat.rent),
            code: res.flat.code,
            members: remoteMembers.length > 0 ? remoteMembers : f.members,
            createdAt: res.flat.created_at
          };
          setFlatState(updatedFlat);
          saveToStorage('flat', updatedFlat);
        }

        if (res.expenses && res.expenses.length > 0) {
          const remoteExp: Expense[] = res.expenses.map((e: any) => ({
            id: e.id,
            title: e.title,
            amount: Number(e.amount),
            paidBy: e.paid_by,
            splitBetween: e.split_between,
            date: e.date,
            createdAt: e.created_at
          }));
          setExpensesState(remoteExp);
          saveToStorage('expenses', remoteExp);
        }

        if (res.settlements && res.settlements.length > 0) {
          const remoteSet: Settlement[] = res.settlements.map((s: any) => ({
            id: s.id,
            from: s.from_member,
            to: s.to_member,
            amount: Number(s.amount),
            date: s.date
          }));
          setSettlementsState(remoteSet);
          saveToStorage('settlements', remoteSet);
        }

        if (res.chores && res.chores.length > 0) {
          const remoteChores: Chore[] = res.chores.map((c: any) => ({
            id: c.id,
            task: c.task,
            assignedTo: c.assigned_to,
            frequency: c.frequency,
            dueDay: c.due_day,
            status: c.status,
            completions: (c.chore_completions || []).map((cc: any) => ({
              id: cc.id,
              choreId: cc.chore_id,
              completedBy: cc.completed_by,
              completedAt: cc.completed_at
            })),
            createdAt: c.created_at
          }));
          setChoresState(remoteChores);
          saveToStorage('chores', remoteChores);
        }

        if (res.rules && res.rules.length > 0) {
          const remoteRules: Rule[] = res.rules.map((r: any) => ({
            id: r.id,
            text: r.text,
            agreedBy: r.agreed_by || [],
            createdAt: r.created_at
          }));
          setRulesState(remoteRules);
          saveToStorage('rules', remoteRules);
        }
      }).catch(() => {
        // Fallback to localStorage data
      });
    }
  }, []);

  // Persist helpers
  const setProfile = useCallback((p: UserProfile) => {
    setProfileState(p);
    saveToStorage('profile', p);
  }, []);

  const createFlat = useCallback(async (name: string, rent: number, creatorName?: string) => {
    const creator = creatorName || profile?.name || 'Me (Admin)';
    let newFlat: Flat | null = null;
    
    try {
      newFlat = await createFlatInSupabase(name, rent, creator);
    } catch (e) {
      // Supabase offline/error fallback
    }

    if (!newFlat) {
      newFlat = {
        id: generateId(),
        name,
        rent,
        code: generateJoinCode(),
        members: [{
          id: generateId(),
          name: creator,
          avatarColor: getAvatarColor(0)
        }],
        createdAt: new Date().toISOString(),
      };
    }

    setFlatState(newFlat);
    saveToStorage('flat', newFlat);
    return newFlat;
  }, [profile]);

  const joinFlat = useCallback(async (code: string, userName?: string) => {
    const user = userName || profile?.name || 'New Flatmate';
    try {
      const res = await joinFlatInSupabase(code, user);
      if (res.success && res.flat) {
        setFlatState(res.flat);
        saveToStorage('flat', res.flat);
        return { success: true };
      }
      return { success: false, error: res.error || 'Invalid code' };
    } catch (e: any) {
      // Fallback
      const newFlat: Flat = {
        id: generateId(),
        name: `Flat ${code.toUpperCase()}`,
        rent: 0,
        code: code.toUpperCase(),
        members: [{ id: generateId(), name: user, avatarColor: getAvatarColor(0) }],
        createdAt: new Date().toISOString(),
      };
      setFlatState(newFlat);
      saveToStorage('flat', newFlat);
      return { success: true };
    }
  }, [profile]);

  const leaveFlat = useCallback(() => {
    setFlatState(null);
    saveToStorage('flat', null);
  }, []);

  const addMember = useCallback(async (name: string) => {
    if (!flat) return;
    const memberCount = flat.members.length;
    let newMember: Member | null = null;

    try {
      newMember = await addMemberToSupabase(flat.id, name, memberCount);
    } catch (e) {}

    if (!newMember) {
      newMember = {
        id: generateId(),
        name,
        avatarColor: getAvatarColor(memberCount),
      };
    }

    setFlatState(prev => {
      if (!prev) return prev;
      const updated = {
        ...prev,
        members: [...prev.members, newMember!],
      };
      saveToStorage('flat', updated);
      return updated;
    });
  }, [flat]);

  const removeMember = useCallback(async (id: string) => {
    try {
      await removeMemberFromSupabase(id);
    } catch (e) {}

    setFlatState(prev => {
      if (!prev) return prev;
      const updated = {
        ...prev,
        members: prev.members.filter(m => m.id !== id),
      };
      saveToStorage('flat', updated);
      return updated;
    });
  }, []);

  // Expenses
  const addExpense = useCallback(async (expense: Omit<Expense, 'id' | 'createdAt'>) => {
    let saved: Expense | null = null;
    if (flat?.id) {
      try {
        saved = await addExpenseToSupabase(flat.id, expense);
      } catch (e) {}
    }

    const item: Expense = saved || {
      ...expense,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };

    setExpensesState(prev => {
      const updated = [item, ...prev];
      saveToStorage('expenses', updated);
      return updated;
    });
  }, [flat]);

  const deleteExpense = useCallback(async (id: string) => {
    try {
      await deleteExpenseFromSupabase(id);
    } catch (e) {}

    setExpensesState(prev => {
      const updated = prev.filter(e => e.id !== id);
      saveToStorage('expenses', updated);
      return updated;
    });
  }, []);

  // Settlements
  const addSettlement = useCallback(async (from: string, to: string, amount: number) => {
    let saved: Settlement | null = null;
    if (flat?.id) {
      try {
        saved = await addSettlementToSupabase(flat.id, from, to, amount);
      } catch (e) {}
    }

    const item: Settlement = saved || {
      id: generateId(),
      from,
      to,
      amount,
      date: new Date().toISOString(),
    };

    setSettlementsState(prev => {
      const updated = [...prev, item];
      saveToStorage('settlements', updated);
      return updated;
    });
  }, [flat]);

  // Chores
  const addChore = useCallback(async (chore: Omit<Chore, 'id' | 'createdAt' | 'status' | 'completions'>) => {
    let saved: Chore | null = null;
    if (flat?.id) {
      try {
        saved = await addChoreToSupabase(flat.id, chore);
      } catch (e) {}
    }

    const item: Chore = saved || {
      ...chore,
      id: generateId(),
      status: 'pending' as const,
      completions: [],
      createdAt: new Date().toISOString(),
    };

    setChoresState(prev => {
      const updated = [item, ...prev];
      saveToStorage('chores', updated);
      return updated;
    });
  }, [flat]);

  const deleteChore = useCallback(async (id: string) => {
    try {
      await deleteChoreFromSupabase(id);
    } catch (e) {}

    setChoresState(prev => {
      const updated = prev.filter(c => c.id !== id);
      saveToStorage('chores', updated);
      return updated;
    });
  }, []);

  const markChoreDone = useCallback(async (id: string) => {
    const target = chores.find(c => c.id === id);
    if (target) {
      try {
        await markChoreDoneInSupabase(id, target.assignedTo);
      } catch (e) {}
    }

    setChoresState(prev => {
      const updated = prev.map(c => {
        if (c.id !== id) return c;
        const completion: ChoreCompletion = {
          id: generateId(),
          choreId: id,
          completedBy: c.assignedTo,
          completedAt: new Date().toISOString(),
        };
        return { ...c, status: 'done' as const, completions: [...c.completions, completion] };
      });
      saveToStorage('chores', updated);
      return updated;
    });
  }, [chores]);

  const rotateChore = useCallback(async (id: string) => {
    const members = flat?.members || [];
    if (members.length === 0) return;
    const target = chores.find(c => c.id === id);
    if (!target) return;

    const currentIdx = members.findIndex(m => m.id === target.assignedTo);
    const nextIdx = (currentIdx + 1) % members.length;
    const nextAssigneeId = members[nextIdx].id;

    try {
      await rotateChoreInSupabase(id, nextAssigneeId);
    } catch (e) {}

    setChoresState(prev => {
      const updated = prev.map(c => {
        if (c.id !== id) return c;
        return { ...c, assignedTo: nextAssigneeId, status: 'pending' as const };
      });
      saveToStorage('chores', updated);
      return updated;
    });
  }, [flat, chores]);

  // Rules
  const addRule = useCallback(async (text: string) => {
    let saved: Rule | null = null;
    if (flat?.id) {
      try {
        saved = await addRuleToSupabase(flat.id, text);
      } catch (e) {}
    }

    const item: Rule = saved || {
      id: generateId(),
      text,
      agreedBy: [],
      createdAt: new Date().toISOString(),
    };

    setRulesState(prev => {
      const updated = [item, ...prev];
      saveToStorage('rules', updated);
      return updated;
    });
  }, [flat]);

  const deleteRule = useCallback(async (id: string) => {
    try {
      await deleteRuleFromSupabase(id);
    } catch (e) {}

    setRulesState(prev => {
      const updated = prev.filter(r => r.id !== id);
      saveToStorage('rules', updated);
      return updated;
    });
  }, []);

  const toggleRuleAgreement = useCallback(async (ruleId: string, memberId: string) => {
    const target = rules.find(r => r.id === ruleId);
    if (!target) return;
    const agreed = target.agreedBy.includes(memberId)
      ? target.agreedBy.filter(id => id !== memberId)
      : [...target.agreedBy, memberId];

    try {
      await toggleRuleAgreementInSupabase(ruleId, agreed);
    } catch (e) {}

    setRulesState(prev => {
      const updated = prev.map(r => {
        if (r.id !== ruleId) return r;
        return { ...r, agreedBy: agreed };
      });
      saveToStorage('rules', updated);
      return updated;
    });
  }, [rules]);

  // Listings
  const addListing = useCallback((listing: Omit<Listing, 'id' | 'createdAt'>) => {
    setListingsState(prev => {
      const updated = [{ ...listing, id: generateId(), createdAt: new Date().toISOString() }, ...prev];
      saveToStorage('listings', updated);
      return updated;
    });
  }, []);

  const deleteListing = useCallback((id: string) => {
    setListingsState(prev => {
      const updated = prev.filter(l => l.id !== id);
      saveToStorage('listings', updated);
      return updated;
    });
  }, []);

  const value: StoreState = {
    profile, setProfile,
    flat, createFlat, joinFlat, addMember, removeMember, leaveFlat,
    expenses, addExpense, deleteExpense,
    settlements, addSettlement,
    chores, addChore, deleteChore, markChoreDone, rotateChore,
    rules, addRule, deleteRule, toggleRuleAgreement,
    listings, addListing, deleteListing,
    isHydrated,
  };

  return React.createElement(StoreContext.Provider, { value }, children);
}

export function useStore(): StoreState {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
