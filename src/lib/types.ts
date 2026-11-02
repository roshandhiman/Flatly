export interface Member {
  id: string;
  name: string;
  avatarColor: string;
  role?: 'admin' | 'member';
}

export interface Flat {
  id: string;
  name: string;
  rent: number;
  code: string; // join code
  members: Member[];
  imageUrl?: string;
  createdAt: string;
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  paidBy: string; // member id
  splitBetween: string[]; // member ids
  date: string;
  createdAt: string;
}

export interface Settlement {
  id: string;
  from: string; // member id
  to: string; // member id
  amount: number;
  date: string;
}

export interface Chore {
  id: string;
  task: string;
  assignedTo: string; // member id
  frequency: 'once' | 'weekly';
  dueDay: string;
  status: 'pending' | 'done';
  completions: ChoreCompletion[];
  createdAt: string;
}

export interface ChoreCompletion {
  id: string;
  choreId: string;
  completedBy: string; // member id
  completedAt: string;
}

export interface Rule {
  id: string;
  text: string;
  agreedBy: string[]; // member ids
  createdAt: string;
}

export interface Review {
  id: string;
  author: string;
  rating: number; // 1-5
  comment: string;
  date: string;
  avatarColor?: string;
}

export interface Listing {
  id: string;
  title: string;
  location: string;
  city?: string;
  area?: string;
  coordinates?: { lat: number; lng: number };
  rent: number;
  seats: number;
  description: string;
  tags: string[];
  imageUrl?: string;
  gallery?: string[];
  rating?: number;
  reviewCount?: number;
  reviews?: Review[];
  contactName?: string;
  contactPhone?: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  flatId: string;
  senderName: string;
  text: string;
  createdAt: string;
}

export interface UserProfile {
  name: string;
  habits: {
    sleepTime: string;
    cleanliness: string;
    guests: string;
    foodPreference: string;
    smoking: string;
  };
}
