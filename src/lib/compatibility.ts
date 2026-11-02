import { Listing, UserProfile } from './types';

export type CompatStatus = 'match' | 'partial' | 'neutral' | 'mismatch';

export interface CompatFactor {
  label: string;
  status: CompatStatus;
  detail: string;
}

export interface CompatResult {
  score: number; // 0-100
  factors: CompatFactor[];
}

const SCORES: Record<CompatStatus, number> = {
  match: 100,
  partial: 65,
  neutral: 50,
  mismatch: 25,
};

const STATUS_LABEL: Record<CompatStatus, { text: string; color: string }> = {
  match: { text: 'Match', color: 'text-[#00A86B]' },
  partial: { text: 'Likely OK', color: 'text-amber-600' },
  neutral: { text: 'No info yet', color: 'text-gray-500' },
  mismatch: { text: 'Dealbreaker', color: 'text-[#FF3B30]' },
};

export function compatStatusMeta(status: CompatStatus) {
  return STATUS_LABEL[status];
}

/**
 * Honest, data-driven compatibility between the seeker's profile habits and a
 * listing. Only scores what a listing actually tells us (tags + description);
 * unknowns are marked "neutral", never faked as a perfect match.
 */
export function computeCompatibility(
  profile: UserProfile | null,
  listing: Listing
): CompatResult | null {
  if (!profile?.habits) return null;

  const habits = profile.habits;
  const tags = (listing.tags || []).map((t) => t.toLowerCase());
  const evidence = `${listing.title} ${listing.description || ''} ${tags.join(' ')}`.toLowerCase();
  const factors: CompatFactor[] = [];

  // 1. 🚭 Smoking policy
  const smoking = (habits.smoking || 'Strict Non-smoker').toLowerCase();
  const smokeFree = /smoke[- ]?free|no smoking|non[- ]?smok/.test(evidence);
  if (smokeFree) {
    factors.push({
      label: '🚭 Smoking Policy',
      status: smoking.startsWith('strict') ? 'match' : 'mismatch',
      detail: 'Poster ke hisab se flat smoke-free hai (info: description/tags)',
    });
  } else if (smoking.startsWith('strict')) {
    factors.push({
      label: '🚭 Smoking Policy',
      status: 'neutral',
      detail: 'Poster ne smoking policy mention nahi ki — connect karke confirm karo',
    });
  } else {
    factors.push({
      label: '🚭 Smoking Policy',
      status: 'partial',
      detail: `Aapki preference "${habits.smoking}" hai; poster ne policy share nahi ki`,
    });
  }

  // 2. 🍳 Food & Kitchen setup
  const food = (habits.foodPreference || '').toLowerCase();
  const hasKitchenReal = /kitchen|cook|stove|modular/.test(evidence);
  const nonVegHint = /non[- ]?veg|chicken|egg|meat/.test(evidence);
  const vegHint = /pure veg|vegetarian|veg friendly|jain/.test(evidence);
  if (food.includes('no cooking')) {
    factors.push({
      label: '🍳 Food & Kitchen',
      status: 'match',
      detail: 'Aap cooking use nahi karte, toh kitchen setup aapke liye bonus hai',
    });
  } else if (food.includes('pure veg') && nonVegHint && !vegHint) {
    factors.push({
      label: '🍳 Food & Kitchen',
      status: 'mismatch',
      detail: 'Non-veg cooking ke hints hain — flatmates se veg policy confirm karo',
    });
  } else if (hasKitchenReal) {
    factors.push({
      label: '🍳 Food & Kitchen',
      status: 'match',
      detail: 'Kitchen/cooking setup listing mein clearly mentioned hai',
    });
  } else {
    factors.push({
      label: '🍳 Food & Kitchen',
      status: 'neutral',
      detail: 'Kitchen details missing hain — poster se poochho about shared cooking',
    });
  }

  // 3. 🧼 Cleanliness standards
  const clean = (habits.cleanliness || '').toLowerCase();
  const cleaningSupport = /maid|cleaning|hygiene|dishwash|purifier|chimney/.test(evidence);
  if (cleaningSupport) {
    factors.push({
      label: '🧼 Cleanliness Standard',
      status: 'match',
      detail: 'Cleaning support (maid/cleaning job) listed mein mentioned hai',
    });
  } else if (clean.startsWith('super tidy')) {
    factors.push({
      label: '🧼 Cleanliness Standard',
      status: 'partial',
      detail: 'Aap super-tidy ho, par cleaning kaise handle hoti hai ye clearly nahi likha',
    });
  } else {
    factors.push({
      label: '🧼 Cleanliness Standard',
      status: 'neutral',
      detail: 'Cleaning routine ka zikr nahi hai — ye aksar sabse bada friction point hota hai',
    });
  }

  // 4. 😴 Sleep schedule & noise
  const sleep = (habits.sleepTime || '').toLowerCase();
  const noCurfew = tags.some((t) => t.includes('no curfew'));
  const quietVibe = /quiet|peaceful|silent|serene/.test(evidence);
  if (sleep.startsWith('night owl') && noCurfew) {
    factors.push({
      label: '😴 Sleep Hours',
      status: 'match',
      detail: 'No-curfew flat hai — late nights aapke liye perfect',
    });
  } else if (sleep.startsWith('early bird') && quietVibe) {
    factors.push({
      label: '😴 Sleep Hours',
      status: 'match',
      detail: 'Quiet/peaceful vibe — early risers ke liye ideal',
    });
  } else if (sleep.startsWith('night owl') && quietVibe) {
    factors.push({
      label: '😴 Sleep Hours',
      status: 'partial',
      detail: 'Flat quiet vibe ka hai — late-night noise par flatmates se Coordinate karo',
    });
  } else if (noCurfew) {
    factors.push({
      label: '😴 Sleep Hours',
      status: 'match',
      detail: 'No-curfew policy — aapke schedule ko flexibility milti hai',
    });
  } else {
    factors.push({
      label: '😴 Sleep Hours',
      status: 'neutral',
      detail: 'House rules/timing ka mention nahi hai',
    });
  }

  // 5. 👥 Guests policy
  const guests = (habits.guests || '').toLowerCase();
  const gated = tags.some((t) => t.includes('gated'));
  if (noCurfew && guests.startsWith('friends')) {
    factors.push({
      label: '👥 Guest Policy',
      status: 'match',
      detail: 'No-curfew flat — guests lena easy hoga',
    });
  } else if (gated && guests.startsWith('friends')) {
    factors.push({
      label: '👥 Guest Policy',
      status: 'partial',
      detail: 'Gated society rules guests par limit laga sakte hain',
    });
  } else if (guests.startsWith('strictly')) {
    factors.push({
      label: '👥 Guest Policy',
      status: 'match',
      detail: 'Aap guests kam rakhte ho, toh most flats compatible hain',
    });
  } else {
    factors.push({
      label: '👥 Guest Policy',
      status: 'neutral',
      detail: 'Guest rules ka zikr nahi hai',
    });
  }

  // 6. 💰 Rent sanity check vs profile-based expectations is NOT possible without a
  // budget field, so we do not fake it here (intentionally excluded).

  const score = Math.round(
    factors.reduce((acc, f) => acc + SCORES[f.status], 0) / factors.length
  );

  return { score, factors };
}
