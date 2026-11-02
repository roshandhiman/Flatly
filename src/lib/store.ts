'use client';

import { Flat, Expense, Settlement, Chore, ChoreCompletion, Rule, Listing, UserProfile, Member } from './types';
import { generateId, generateJoinCode, getAvatarColor } from './utils';

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
  createFlat: (name: string, rent: number) => void;
  joinFlat: (code: string) => void;
  addMember: (name: string) => void;
  removeMember: (id: string) => void;

  // Expenses
  expenses: Expense[];
  addExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => void;
  deleteExpense: (id: string) => void;

  // Settlements
  settlements: Settlement[];
  addSettlement: (from: string, to: string, amount: number) => void;

  // Chores
  chores: Chore[];
  addChore: (chore: Omit<Chore, 'id' | 'createdAt' | 'status' | 'completions'>) => void;
  deleteChore: (id: string) => void;
  markChoreDone: (id: string) => void;
  rotateChore: (id: string) => void;

  // Rules
  rules: Rule[];
  addRule: (text: string) => void;
  deleteRule: (id: string) => void;
  toggleRuleAgreement: (ruleId: string, memberId: string) => void;

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
    setProfileState(loadFromStorage('profile', null));
    setFlatState(loadFromStorage('flat', null));
    setExpensesState(loadFromStorage('expenses', []));
    setSettlementsState(loadFromStorage('settlements', []));
    setChoresState(loadFromStorage('chores', []));
    setRulesState(loadFromStorage('rules', []));
    setListingsState(loadFromStorage('listings', []));
    setIsHydrated(true);
  }, []);

  // Persist helpers
  const setProfile = useCallback((p: UserProfile) => {
    setProfileState(p);
    saveToStorage('profile', p);
  }, []);

  const createFlat = useCallback((name: string, rent: number) => {
    const newFlat: Flat = {
      id: generateId(),
      name,
      rent,
      code: generateJoinCode(),
      members: [],
      createdAt: new Date().toISOString(),
    };
    setFlatState(newFlat);
    saveToStorage('flat', newFlat);
  }, []);

  const joinFlat = useCallback((code: string) => {
    // Stage 1: just create a flat with the code (no real joining)
    const newFlat: Flat = {
      id: generateId(),
      name: `Flat ${code}`,
      rent: 0,
      code,
      members: [],
      createdAt: new Date().toISOString(),
    };
    setFlatState(newFlat);
    saveToStorage('flat', newFlat);
  }, []);

  const addMember = useCallback((name: string) => {
    setFlatState(prev => {
      if (!prev) return prev;
      const updated = {
        ...prev,
        members: [...prev.members, {
          id: generateId(),
          name,
          avatarColor: getAvatarColor(prev.members.length),
        }],
      };
      saveToStorage('flat', updated);
      return updated;
    });
  }, []);

  const removeMember = useCallback((id: string) => {
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
  const addExpense = useCallback((expense: Omit<Expense, 'id' | 'createdAt'>) => {
    setExpensesState(prev => {
      const updated = [{ ...expense, id: generateId(), createdAt: new Date().toISOString() }, ...prev];
      saveToStorage('expenses', updated);
      return updated;
    });
  }, []);

  const deleteExpense = useCallback((id: string) => {
    setExpensesState(prev => {
      const updated = prev.filter(e => e.id !== id);
      saveToStorage('expenses', updated);
      return updated;
    });
  }, []);

  // Settlements
  const addSettlement = useCallback((from: string, to: string, amount: number) => {
    setSettlementsState(prev => {
      const updated = [...prev, { id: generateId(), from, to, amount, date: new Date().toISOString() }];
      saveToStorage('settlements', updated);
      return updated;
    });
  }, []);

  // Chores
  const addChore = useCallback((chore: Omit<Chore, 'id' | 'createdAt' | 'status' | 'completions'>) => {
    setChoresState(prev => {
      const updated = [{ ...chore, id: generateId(), status: 'pending' as const, completions: [], createdAt: new Date().toISOString() }, ...prev];
      saveToStorage('chores', updated);
      return updated;
    });
  }, []);

  const deleteChore = useCallback((id: string) => {
    setChoresState(prev => {
      const updated = prev.filter(c => c.id !== id);
      saveToStorage('chores', updated);
      return updated;
    });
  }, []);

  const markChoreDone = useCallback((id: string) => {
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
  }, []);

  const rotateChore = useCallback((id: string) => {
    setChoresState(prev => {
      const updated = prev.map(c => {
        if (c.id !== id) return c;
        // Get flat members and find next
        const members = flat?.members || [];
        if (members.length === 0) return c;
        const currentIdx = members.findIndex(m => m.id === c.assignedTo);
        const nextIdx = (currentIdx + 1) % members.length;
        return { ...c, assignedTo: members[nextIdx].id, status: 'pending' as const };
      });
      saveToStorage('chores', updated);
      return updated;
    });
  }, [flat]);

  // Rules
  const addRule = useCallback((text: string) => {
    setRulesState(prev => {
      const updated = [{ id: generateId(), text, agreedBy: [], createdAt: new Date().toISOString() }, ...prev];
      saveToStorage('rules', updated);
      return updated;
    });
  }, []);

  const deleteRule = useCallback((id: string) => {
    setRulesState(prev => {
      const updated = prev.filter(r => r.id !== id);
      saveToStorage('rules', updated);
      return updated;
    });
  }, []);

  const toggleRuleAgreement = useCallback((ruleId: string, memberId: string) => {
    setRulesState(prev => {
      const updated = prev.map(r => {
        if (r.id !== ruleId) return r;
        const agreed = r.agreedBy.includes(memberId)
          ? r.agreedBy.filter(id => id !== memberId)
          : [...r.agreedBy, memberId];
        return { ...r, agreedBy: agreed };
      });
      saveToStorage('rules', updated);
      return updated;
    });
  }, []);

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
    flat, createFlat, joinFlat, addMember, removeMember,
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
