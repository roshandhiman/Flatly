import { supabase } from './supabase';
import { Flat, Member, Expense, Settlement, Chore, Rule, ChatMessage } from './types';
import { generateId, generateJoinCode, getAvatarColor } from './utils';

export async function createFlatInSupabase(name: string, rent: number, creatorName: string) {
  const code = generateJoinCode();
  
  // 1. Insert flat
  const { data: flatData, error: flatError } = await supabase
    .from('flats')
    .insert([{ name, rent, code }])
    .select()
    .single();

  if (flatError || !flatData) {
    console.error('Failed to create flat in Supabase:', flatError);
    return null;
  }

  // 2. Add creator as initial member
  const { data: memberData, error: memberError } = await supabase
    .from('flat_members')
    .insert([{
      flat_id: flatData.id,
      name: creatorName || 'Me (Admin)',
      avatar_color: getAvatarColor(0),
      role: 'admin'
    }])
    .select()
    .single();

  const members: Member[] = memberData ? [{
    id: memberData.id,
    name: memberData.name,
    avatarColor: memberData.avatar_color,
    role: (memberData.role || 'admin') as 'admin' | 'member'
  }] : [];

  return {
    id: flatData.id,
    name: flatData.name,
    rent: Number(flatData.rent),
    code: flatData.code,
    members,
    createdAt: flatData.created_at
  } as Flat;
}

export async function joinFlatInSupabase(code: string, userName: string) {
  // 1. Fetch flat by code
  const { data: flatData, error: flatError } = await supabase
    .from('flats')
    .select('*, flat_members(*)')
    .eq('code', code.trim().toUpperCase())
    .single();

  if (flatError || !flatData) {
    return { success: false, error: 'Flat code nahi mila! Check code and try again.' };
  }

  // 2. Check if user is already a member
  const existingMembers = flatData.flat_members || [];
  const alreadyMember = existingMembers.some((m: any) => m.name.toLowerCase() === userName.toLowerCase());

  let currentMembers: Member[] = existingMembers.map((m: any) => ({
    id: m.id,
    name: m.name,
    avatarColor: m.avatar_color,
    role: (m.role || 'member') as 'admin' | 'member'
  }));

  if (!alreadyMember && userName) {
    const { data: newMem, error: memErr } = await supabase
      .from('flat_members')
      .insert([{
        flat_id: flatData.id,
        name: userName,
        avatar_color: getAvatarColor(currentMembers.length),
        role: 'member'
      }])
      .select()
      .single();

    if (newMem) {
      currentMembers.push({
        id: newMem.id,
        name: newMem.name,
        avatarColor: newMem.avatar_color,
        role: 'member'
      });
    }
  }

  const flat: Flat = {
    id: flatData.id,
    name: flatData.name,
    rent: Number(flatData.rent),
    code: flatData.code,
    members: currentMembers,
    createdAt: flatData.created_at
  };

  return { success: true, flat };
}

export async function addMemberToSupabase(flatId: string, name: string, memberCount: number) {
  const { data, error } = await supabase
    .from('flat_members')
    .insert([{
      flat_id: flatId,
      name,
      avatar_color: getAvatarColor(memberCount),
      role: 'member'
    }])
    .select()
    .single();

  if (error || !data) return null;
  return {
    id: data.id,
    name: data.name,
    avatarColor: data.avatar_color,
    role: (data.role || 'member') as 'admin' | 'member'
  } as Member;
}

export async function removeMemberFromSupabase(memberId: string) {
  await supabase.from('flat_members').delete().eq('id', memberId);
}

export async function updateFlatImageInSupabase(flatId: string, imageUrl: string) {
  try {
    await supabase.from('flats').update({ image_url: imageUrl }).eq('id', flatId);
  } catch (err) {
    console.error('Failed to update flat image in Supabase:', err);
  }
}

// --- Expenses API ---
export async function addExpenseToSupabase(flatId: string, expense: Omit<Expense, 'id' | 'createdAt'>) {
  const { data, error } = await supabase
    .from('expenses')
    .insert([{
      flat_id: flatId,
      title: expense.title,
      amount: expense.amount,
      paid_by: expense.paidBy,
      split_between: expense.splitBetween,
      date: expense.date
    }])
    .select()
    .single();

  if (error || !data) return null;
  return {
    id: data.id,
    title: data.title,
    amount: Number(data.amount),
    paidBy: data.paid_by,
    splitBetween: data.split_between,
    date: data.date,
    createdAt: data.created_at
  } as Expense;
}

export async function deleteExpenseFromSupabase(id: string) {
  await supabase.from('expenses').delete().eq('id', id);
}

// --- Settlements API ---
export async function addSettlementToSupabase(flatId: string, from: string, to: string, amount: number) {
  const { data, error } = await supabase
    .from('settlements')
    .insert([{
      flat_id: flatId,
      from_member: from,
      to_member: to,
      amount
    }])
    .select()
    .single();

  if (error || !data) return null;
  return {
    id: data.id,
    from: data.from_member,
    to: data.to_member,
    amount: Number(data.amount),
    date: data.date
  } as Settlement;
}

// --- Chores API ---
export async function addChoreToSupabase(flatId: string, chore: Omit<Chore, 'id' | 'createdAt' | 'status' | 'completions'>) {
  const { data, error } = await supabase
    .from('chores')
    .insert([{
      flat_id: flatId,
      task: chore.task,
      assigned_to: chore.assignedTo,
      frequency: chore.frequency,
      due_day: chore.dueDay,
      status: 'pending'
    }])
    .select()
    .single();

  if (error || !data) return null;
  return {
    id: data.id,
    task: data.task,
    assignedTo: data.assigned_to,
    frequency: data.frequency,
    dueDay: data.due_day,
    status: data.status,
    completions: [],
    createdAt: data.created_at
  } as Chore;
}

export async function markChoreDoneInSupabase(choreId: string, completedBy: string) {
  await supabase.from('chores').update({ status: 'done' }).eq('id', choreId);
  await supabase.from('chore_completions').insert([{ chore_id: choreId, completed_by: completedBy }]);
}

export async function rotateChoreInSupabase(choreId: string, nextAssigneeId: string) {
  await supabase.from('chores').update({ assigned_to: nextAssigneeId, status: 'pending' }).eq('id', choreId);
}

export async function deleteChoreFromSupabase(id: string) {
  await supabase.from('chores').delete().eq('id', id);
}

// --- Rules API ---
export async function addRuleToSupabase(flatId: string, text: string) {
  const { data, error } = await supabase
    .from('rules')
    .insert([{ flat_id: flatId, text, agreed_by: [] }])
    .select()
    .single();

  if (error || !data) return null;
  return {
    id: data.id,
    text: data.text,
    agreedBy: data.agreed_by || [],
    createdAt: data.created_at
  } as Rule;
}

export async function toggleRuleAgreementInSupabase(ruleId: string, updatedAgreedBy: string[]) {
  // Ensure only valid UUIDs are sent to Postgres uuid[] column
  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const safeAgreedBy = updatedAgreedBy.filter(id => UUID_REGEX.test(id));
  const { error } = await supabase.from('rules').update({ agreed_by: safeAgreedBy }).eq('id', ruleId);
  if (error) {
    console.error('toggleRuleAgreementInSupabase error:', error);
  }
}

export async function deleteRuleFromSupabase(id: string) {
  await supabase.from('rules').delete().eq('id', id);
}

// --- Load all flat data from Supabase ---
export async function syncFlatDataFromSupabase(flatId: string) {
  const [flatRes, expRes, setRes, choreRes, ruleRes] = await Promise.all([
    supabase.from('flats').select('*, flat_members(*)').eq('id', flatId).single(),
    supabase.from('expenses').select('*').eq('flat_id', flatId).order('created_at', { ascending: false }),
    supabase.from('settlements').select('*').eq('flat_id', flatId).order('date', { ascending: false }),
    supabase.from('chores').select('*, chore_completions(*)').eq('flat_id', flatId).order('created_at', { ascending: false }),
    supabase.from('rules').select('*').eq('flat_id', flatId).order('created_at', { ascending: false })
  ]);

  return {
    flat: flatRes.data,
    expenses: expRes.data || [],
    settlements: setRes.data || [],
    chores: choreRes.data || [],
    rules: ruleRes.data || []
  };
}
