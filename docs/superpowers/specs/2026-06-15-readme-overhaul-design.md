# Spec: RollCall README.md Premium Overhaul

## Goal
Improve the visual presentation, structure, and readability of the RollCall README.md to make it feel premium, professional, and easy to read.

## Proposed Upgrades

### 1. GitHub Badges (Shields)
- Add shields at the top of the document for: React, TypeScript, Tailwind CSS, Vite, Zustand, Supabase, Vitest, and PWA.
- Standardize colors and icons.

### 2. Table of Contents
- Add a clean, clickable list at the top of the README pointing to: Features, Architecture, Calculations, Setup, and Testing.

### 3. Mermaid Flow Diagram & Data Flow
- Place under a new section "Application Flow".
- Use the following Mermaid diagram structure to visualize state updates, database persistence, and the calculations engine flow:
  ```mermaid
  graph TD
      UI[React Components & Pages] -- 1. Triggers Action --> Store[Zustand Store]
      Store -- 2. Runs Math --> Calc[Calculations Engine]
      Calc -- 3. Returns Stats --> Store
      Store -- 4. Updates State --> UI
      Store -- 5. Syncs / Mutates --> DB[(Supabase PostgreSQL)]
      DB -- 6. Pulls Profile & Data --> Store
  ```

### 4. Premium Callouts (Setup & Configurations)
- Add the following alert callouts in the README:
  - **Database setup (`[!IMPORTANT]`):** Placed in the Supabase Database configuration section:
    > [!IMPORTANT]
    > You must run the entire `supabase_schema.sql` script inside the Supabase SQL Editor before running the development server to ensure tables, Row Level Security (RLS) rules, and custom database triggers are fully provisioned.
  - **Demo data seeding (`[!TIP]`):** Placed in the Features section:
    > [!TIP]
    > If you want to preview the charts and calendars immediately, use the one-click **Demo Data Seeder** button on the empty dashboard state to instantly populate mock subjects and logs.

### 5. Desktop & Mobile Navigation Documentation
- In the Features list under a refined section (e.g. "Desktop & Mobile Brand Navigation"), explicitly document that clicking the RollCall brand text or the GraduationCap logo in the top-left of the interface (sidebar on desktop, navbar on mobile) routes the user back to the main menu/dashboard.

## Approval
Approved by user.
