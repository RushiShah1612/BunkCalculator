# Deployment Checklist

Follow these steps to deploy the **RollCall Student Attendance Tracker** to Vercel and hook it up to a production Supabase project.

---

### 1. Prepare Code & Environment
1. Ensure the code compiles with zero errors:
   ```bash
   npx tsc --noEmit
   npm run build
   ```
2. Verify that `.env.local` is present in your `.gitignore` to prevent committing credentials:
   ```text
   # .gitignore
   .env.local
   ```

### 2. Configure Vercel Project
1. Log in to Vercel and click **Add New Project**.
2. Link your Git repository.
3. In **Environment Variables**, set:
   - `VITE_SUPABASE_URL` = *[Your production Supabase Project URL]*
   - `VITE_SUPABASE_ANON_KEY` = *[Your production Supabase Anon Key]*
4. Click **Deploy**.

### 3. Configure Supabase Authentication Redirects
Since Supabase Auth redirects users after registration or password resets, you must configure Redirect URLs in the Supabase Dashboard:

1. Open your project on [supabase.com](https://supabase.com).
2. Navigate to **Authentication** → **URL Configuration**.
3. Under **Site URL**, enter your deployed Vercel domain:
   - `https://your-app.vercel.app`
4. Under **Redirect URLs**, add wildcard paths to support child routes:
   - `https://your-app.vercel.app/**`
5. Save the configuration.

### 4. Seed Database Schema
1. In the Supabase Dashboard, open the **SQL Editor**.
2. Click **New Query**.
3. Paste the contents of `supabase_schema.sql` (contains schema for profiles, subjects, class types, records, and the new shared reports table).
4. Run the query to establish your production tables, indexes, and triggers.
