# Student Attendance Tracker (RollCall)

A modern, responsive Progressive Web App (PWA) designed for college and university students to track daily attendance, monitor progress, simulate absent/present scenarios, and prevent detentions.

---

## Features

- **Auth & Accounts:** User registration and login utilizing Supabase Auth, along with secure account deletion and password resets.
- **Subject Management:** Create, edit, and delete subjects with customizable credit counts, semester labels, color tags, and multiple nested class types (e.g. Theory, Lab, Tutorial).
- **Calculations Engine:** Pure mathematical functions to calculate current percentages, projected statistics, safe bunks available, and sessions needed to restore target attendance.
- **Log Attendance:** Real-time log calendar allowing attendance entries per class type (PRESENT, ABSENT, CANCELLED, HOLIDAY).
- **Dashboard Overview:** Displays overall percentage, streak indicators, weekly activity histograms, and today's quick logging actions.
- **Analytics & Insights:** Responsive Recharts charts (Line, Pie, Bar), attendance intensity heatmaps, custom date-range presets, and CSV downloads.
- **Profile & Settings:** Custom avatar generation, target percentage updates, daily log alerts/reminders, and data export.
- **Smart Notifications:** Automated warning triggers when attendance drops near or below target thresholds.
- **PWA Capabilities:** Desktop and mobile standalone installation with offline asset caching.
- **Shareable Reports:** Generate public, read-only snapshot links that expire in 7 days to share attendance summaries.

---

## Tech Stack

- **Frontend:** React, TypeScript, Vite
- **Styling:** Tailwind CSS, Lucide Icons, Recharts
- **Database & Auth:** Supabase (PostgreSQL, Realtime, Row Level Security)
- **State Management:** Zustand
- **PWA:** Service Workers, Web App Manifest
- **Testing:** Vitest

---

## Setup Instructions

### Prerequisites
- Node.js (v18+)
- npm or yarn
- A Supabase account

### 1. Clone the repository
```bash
git clone https://github.com/RushiShah1612/BunkCalculator.git
cd BunkCalculator
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up Supabase
1. Create a project at [supabase.com](https://supabase.com).
2. Open the **SQL Editor** in the Supabase dashboard and run the entire script found in:
   `supabase_schema.sql`

### 4. Configure environment variables
Create a `.env.local` file in the root directory:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 5. Run locally
```bash
npm run dev
```

---

## Deployment (Vercel)

1. Connect your GitHub repository to Vercel.
2. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as production environment variables in Vercel.
3. In the Supabase Dashboard → Authentication → URL Configuration:
   - Set **Site URL** to: `https://your-app.vercel.app`
   - Add **Redirect URL**: `https://your-app.vercel.app/**`
4. Deploy the project!

---

## Project Structure

```text
├── public/                 # Static assets, sw.js, and manifest.json
├── src/
│   ├── components/         # Reusable UI widgets and layout modules
│   │   ├── layout/         # Sidebar, Navbar, PageWrapper, NotificationBell
│   │   ├── shared/         # ConfirmDialog, ErrorBoundary, SubjectModal
│   │   └── ui/             # Core UI buttons and dialog primitives
│   ├── hooks/              # Custom React hooks (auth, analytics, seeder, detail)
│   ├── lib/                # Pure utility modules (calculations, database, csv)
│   ├── pages/              # Routing pages (Dashboard, Attendance, Profile, etc.)
│   ├── store/              # Zustand global state stores (auth, subjects, toast)
│   ├── types/              # TypeScript interface definitions
│   ├── App.tsx             # Master router, lazy loads, and wrappers
│   ├── index.css           # Global stylesheets and theme tokens
│   └── main.tsx            # App bootstrapping and PWA registration
├── supabase_schema.sql     # Database structure, RLS, and triggers
├── vercel.json             # Vercel SPA redirect config
├── package.json            # Configuration and script pipelines
└── tsconfig.json           # TypeScript compilation configuration
```

---

## Calculations Logic

The calculations engine ([calculations.ts](file:///c:/Users/rushi/Videos/PROJECTS/ATTENDANCE/src/lib/calculations.ts)) handles the core arithmetic for bunk simulations and statistics.

### 1. Attendance Percentage
$$\text{Current \%} = \left( \frac{\text{Hours Present}}{\text{Hours Held}} \right) \times 100$$
Where hours are calculated based on session durations (e.g. Theory = 1 hr, Lab = 2 hrs).

### 2. Safe Bunks
Calculates the maximum number of classes that can be missed without dropping below the target threshold ($T$):
$$\text{Safe Bunks} = \lfloor \frac{\text{Hours Present} - (T \times \text{Hours Held})}{\text{Hours Per Session} \times T} \rfloor$$

### 3. Classes Needed
Calculates the consecutive number of classes that must be attended to restore attendance back to the target threshold ($T$):
$$\text{Classes Needed} = \lceil \frac{(T \times \text{Hours Held}) - \text{Hours Present}}{\text{Hours Per Session} \times (1 - T)} \rceil$$

### 4. Projected Attendance
Calculates the estimated attendance percentage at the end of the semester, assuming the user misses all remaining planned sessions:
$$\text{Projected \%} = \left( \frac{\text{Hours Present}}{\text{Total Planned Hours}} \right) \times 100$$
