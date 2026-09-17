# Vercel shows an old commit (fix)

GitHub **`main`** should be at merge **PR #7** (`b5f6826…`) with `src/lib/actions/auth.ts`. If Vercel **Production** still lists an older SHA (often `8237769…`), Git did not trigger a new build after reconnect or merge.

## 1. Confirm GitHub (source of truth)

Open: https://github.com/hareeshnurani/NuraniBloodDonationTracker/commits/main  

Latest commit message should include **Merge pull request #7** and the tree should contain **`src/lib/actions/auth.ts`**.

## 2. Confirm Vercel Git settings

Vercel → **nurani-blood-donation** → **Settings → Git**

| Setting | Expected |
|---------|----------|
| Connected repository | **`hareeshnurani/NuraniBloodDonationTracker`** (not `sridushiva-dev/…`) |
| Production Branch | **`main`** |

If the repo name is wrong, disconnect Git, reconnect, pick **`hareeshnurani`**, then the repo above.

## 3. Force Production to the latest commit

**Option A — Redeploy (fastest)**

1. **Deployments** tab  
2. Open the **latest** deployment (or any successful one from `main`)  
3. **⋯** → **Redeploy**  
4. Enable **Use existing Build Cache** = **Off** (recommended once after a stuck deploy)  
5. Confirm  

Check the new deployment row: **Commit** should be **`b5f6826`** (or newer).

**Option B — Deploy Hook (if Redeploy still shows old SHA)**

1. **Settings → Git → Deploy Hooks** → create hook for branch **`main`**  
2. Open the hook URL in the browser once (triggers build from current `main`)

**Option C — Empty commit on GitHub (webhook nudge)**

If nothing auto-builds after merge:

```bash
git clone https://github.com/hareeshnurani/NuraniBloodDonationTracker.git
cd NuraniBloodDonationTracker
git pull origin main
git commit --allow-empty -m "chore: trigger Vercel production deploy"
git push origin main
```

## 4. Environment variables (signup fix needs this)

**Settings → Environment Variables** → Production:

- `SUPABASE_SERVICE_ROLE_KEY` — **required** for server signup  
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`  
- `NEXT_PUBLIC_APP_URL` — your Vercel URL (e.g. `https://nurani-blood-donation.vercel.app`)

Redeploy after changing env vars.

## 5. Verify live site

1. Open `/signup` — hard refresh (Ctrl+Shift+R)  
2. Gray note: *Email verification is off until custom SMTP…*  
3. Sign up with a new email → **`/onboarding`** (not “Error sending email”)

If the gray note is missing, Production is still on an old build — repeat step 3 with cache off.
