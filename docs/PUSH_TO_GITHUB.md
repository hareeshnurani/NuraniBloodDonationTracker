# Push signup fix to GitHub (one-time)

Branch name: **`cursor/signup-email-fix-8267`**  
Commit message: **Fix signup when Supabase cannot send confirmation email**

This branch is **ready locally** in this Cursor project as files + patch. GitHub does not have it until **you push** (the Cloud Agent cannot log into your GitHub account).

---

## Option 1 — GitHub website (no terminal) — **easiest**

1. Open: https://github.com/sridushiva-dev/NuraniBloodDonationTracker  
2. Switch branch to **`main`** → click **Add file** → **Upload files**  
3. Create branch name: **`cursor/signup-email-fix-8267`**  
4. Upload these files from **this Cursor project** (same paths):

   - `src/lib/actions/auth.ts` (new file)
   - `src/app/(auth)/signup/page.tsx` (replace)
   - `docs/SUPABASE_SMTP.md` (new)
   - `docs/MERGE_TO_PRODUCTION.md` (optional)

5. Commit → **Compare & pull request** → merge into **`main`**

---

## Option 2 — Git on your computer (recommended)

```bash
git clone https://github.com/sridushiva-dev/NuraniBloodDonationTracker.git
cd NuraniBloodDonationTracker
git checkout -b cursor/signup-email-fix-8267
```

Copy **`docs/signup-fix.patch`** from this Cursor repo into the folder, then:

```bash
git am signup-fix.patch
git push -u origin cursor/signup-email-fix-8267
```

Open PR:

https://github.com/sridushiva-dev/NuraniBloodDonationTracker/compare/main...cursor/signup-email-fix-8267?expand=1

Merge → redeploy Vercel.

---

## Option 3 — Let Cursor push (recommended for ongoing work)

Add **`GITHUB_TOKEN`** to your Cloud Agent environment secrets. Full steps: **[docs/CLOUD_AGENT_SECRETS.md](./CLOUD_AGENT_SECRETS.md)**

Then start a **new** agent run and ask:

> Push branch `cursor/…` to **hareeshnurani/NuraniBloodDonationTracker** and open a PR to `main`.

Canonical repo: https://github.com/hareeshnurani/NuraniBloodDonationTracker

---

## After merge (Vercel)

Set **`SUPABASE_SERVICE_ROLE_KEY`** in Vercel → Redeploy → test `/signup`.
