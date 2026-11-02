# Flatly 🏠 — Shared Living Web App (Stage 1)

Stage 1 of **Flatly**, a friendly neo-brutalist shared-living web app built mobile-first for students and young working professionals in India.

> **Stage 1 Scope:** Frontend UI, navigation, and local working interactions. No backend, no auth, no API calls, and zero fake/mock seed data. Every list starts completely empty and displays designed empty states.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ or 20+
- npm or yarn

### Run Locally
```bash
# Clone and enter directory
cd think2build

# Install dependencies (Next.js 16, React 19, Tailwind CSS v4, Lucide React)
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. On desktop, the interface is centered in a 430px-wide phone-style frame.

---

## 🎨 Design System (Neo-Brutalism)

- **Borders & Shadows:** Thick 2.5px solid black borders (`#111111`) with hard 4px 4px offset shadows (`#111111`, no blur, no gradients).
- **Border Radius:** 12px for standard cards, buttons, chips; 16px/20px for hero cards and bottom sheets.
- **Palette:**
  - Background: Warm cream `#FFF8EC`
  - Text & Border: `#111111`
  - Primary Accent (Yellow): `#FFD23F`
  - Mint (You get / Success): `#3DDC97`
  - Coral / Accent: `#FF6B57`
  - Sky Blue (Info): `#6EC6FF`
  - Red (You owe / Alert): `#FF3B3B`
- **Typography:**
  - Headings: `Space Grotesk` (bold) via `next/font/google`
  - Body: `Inter` via `next/font/google`
- **Tactile Buttons:** Interactive press states with `translate(2px, 2px)` on hover and `translate(4px, 4px)` with shadow collapse on active press.
- **Microcopy Tone:** Simple, friendly, light Hinglish (*"Aaj ki baari"*, *"Kaun kisko dega?"*, *"Hisab-Kitab"*, *"Sab hisab barabar!"*).

---

## 📱 Screens & Features (Stage 1)

1. **Home (`/`)**
   - Personal greeting with user's saved profile name (`Hey [Name]! 👋`).
   - First-run welcome modal to onboard new users.
   - Quick Mode toggle: `Find | Live`.
   - Action cards: *"Mujhe flat chahiye"* & *"Mere flat mein roommate chahiye"*.
   - Flat summary card: *"Kaun kisko dega?"* net balance summary and *"Aaj ki baari"* today's chore banner.
   - Friendly empty state with *"Create your flat"* button when no flat exists.

2. **Profile & Habits (`/profile`)**
   - Edit display name.
   - Chunky selectable chip preferences:
     - 🌙 Sleep schedule (Early bird / Moderate / Night owl)
     - 🧹 Cleanliness & tidiness
     - 👥 Guest policies
     - 🍲 Dietary preference
     - 🚭 Smoking & lifestyle
   - Saved locally with instant feedback.
   - Local data reset option for testing empty states.

3. **Find (`/find`)**
   - Two sub-modes: **Find a room** and **Post a vacancy**.
   - **Post Vacancy Form:** Title, area/location, monthly rent, spots available, description, and amenity chips.
   - **Listings Feed:** Search bar (by title, location, tag) + filter chips (*All*, *Under ₹10k*, *Under ₹15k*, *Furnished*, *Pet friendly*).
   - Designed empty state: *"Abhi koi listing nahi. Pehli listing post karo."*
   - Delete listing capability.

4. **Listing Detail (`/find/[id]`)**
   - Full room details, pricing, spots, features, and vibe description.
   - Clean, verified info (*no invented match percentages or fake scores*).
   - Interactive "Connect with Roommate" action with Stage 1 explainer modal.

5. **Live Flat Dashboard (`/live`)**
   - If no flat: "Create your flat" form (name, rent) and "Join with invite code" input.
   - If flat exists: Flat summary card with 6-char shareable invite code (with 1-tap copy).
   - Flatmates management: Add and remove roommates by name (generates unique colored avatar initials).
   - Navigational hubs for Expenses, Chores, and House Rules.

6. **Expenses & Balances (`/live/expenses`)**
   - **Total Spend Counter:** Computes real monthly expenditure from entered expenses.
   - **Add Expense Bottom Sheet:** Title, amount, paid by, and multi-member split checkboxes (equal split default).
   - **Expenses Feed:** Displays title, payer avatar, date, amount, per-person share, and split avatars.
   - **Kaun Kisko Dega (Balances Tab):** Pure debt-minimization algorithm that calculates who owes whom. Includes "Settle" button to record settlements.

7. **Chores & Aaj Ki Baari (`/live/chores`)**
   - **Add Chore Bottom Sheet:** Task name, assignee, frequency (weekly/one-time), and due day.
   - **Chore Cards:** Assignee avatar, status pill (Pending / Done), "Mark done" toggle, and "Rotate" button to cycle chore to the next roommate.
   - **Real Leaderboard:** Monthly completed chores counted strictly from recorded completions.

8. **House Rules (`/live/rules`)**
   - Add custom flat rules.
   - Member agreement voting (*"X/Y agreed"*).
   - Disabled "Generate with AI (Stage 2)" button.

---

## 📁 Folder Structure

```
think2build/
├── public/                 # Static assets
├── src/
│   ├── app/                # Next.js App Router routes
│   │   ├── find/
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx   # Listing detail view
│   │   │   └── page.tsx       # Find rooms & post vacancy
│   │   ├── live/
│   │   │   ├── chores/
│   │   │   │   └── page.tsx   # Chores & auto-rotation
│   │   │   ├── expenses/
│   │   │   │   └── page.tsx   # Expenses & balance settlement
│   │   │   ├── rules/
│   │   │   │   └── page.tsx   # House rules & agreement voting
│   │   │   └── page.tsx       # Live flat dashboard & members
│   │   ├── profile/
│   │   │   └── page.tsx       # Profile & living habits
│   │   ├── globals.css        # Neo-brutalist theme & utility classes
│   │   ├── layout.tsx         # Phone frame container & navigation
│   │   └── page.tsx           # Home screen & summary widgets
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppHeader.tsx      # Top bar with Flatly logo & mode toggle
│   │   │   ├── BottomTabBar.tsx   # Fixed bottom navigation (Home, Find, Live, Profile)
│   │   │   └── FirstRunModal.tsx  # Name onboarding modal on initial visit
│   │   └── ui/
│   │       ├── Avatar.tsx         # Member avatar with initials & color
│   │       ├── BottomSheet.tsx    # Slide-up modal sheet
│   │       ├── Button.tsx         # Neo-brutalist tactile button
│   │       ├── Card.tsx           # Bordered offset-shadow card
│   │       ├── Chip.tsx           # Selectable pill filter / habit chip
│   │       ├── EmptyState.tsx     # Standard empty list visual & CTA
│   │       ├── Input.tsx          # Brutalist input field with inline errors
│   │       ├── StatusPill.tsx     # Color-coded badge (Pending/Done/Owe/Get)
│   │       ├── Tabs.tsx           # Chunky tab switcher
│   │       └── TextArea.tsx       # Brutalist textarea with inline errors
│   └── lib/
│       ├── balance.ts      # Pure greedy debt-simplification algorithm
│       ├── store.ts        # React Context store with localStorage persistence
│       ├── types.ts        # TypeScript definitions for Member, Flat, Expense, etc.
│       └── utils.ts        # Formatting, IDs, and color utilities
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🔮 What is Intentionally NOT Done (Reserved for Stage 2)

As specified in the Stage 1 roadmap:
1. **User Authentication & Profiles:** No phone OTP, Google OAuth, or session tokens.
2. **Cloud Database:** No PostgreSQL/Supabase/Firebase database; state is maintained in `localStorage`.
3. **Cross-Device Flat Joining:** Roommate invite codes work in-app/locally, but real cross-network synchronization is deferred to backend integration.
4. **AI Compatibility Match Percentage:** No fake percentage bars; real ML matching based on lifestyle habits will be implemented in Stage 2.
5. **Real-Time Roommate Chat:** "Connect" action triggers a preview modal rather than live WebSockets.
6. **AI House Rule Generator:** Disabled button placeholder ready for LLM integration.
