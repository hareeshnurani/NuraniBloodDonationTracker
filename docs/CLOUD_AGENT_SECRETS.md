# Cloud Agent secrets (GitHub + Vercel)

Cloud Agents **do not** read your GitHub login. To push branches and open pull requests on **`hareeshnurani/NuraniBloodDonationTracker`**, add a secret named exactly **`GITHUB_TOKEN`**.

## 1. Create a GitHub token

1. GitHub → **Settings** → **Developer settings** → **Personal access tokens**
2. Use a **fine-grained** token (recommended) or classic token with **`repo`** scope
3. **Repository access:** only **`NuraniBloodDonationTracker`** (or all repos you trust this agent with)
4. Permissions: **Contents** read/write, **Pull requests** read/write (metadata/read is included with contents on classic tokens)

Copy the token once (you will not see it again).

## 2. Save it in Cursor (required)

1. Open your BloodLink **Cloud Agent environment**:  
   https://cursor.com/dashboard/cloud-agents/environments/e/0517a0b4-b4c3-11f1-bb68-864e54d14197  
   (Or: Cursor dashboard → **Cloud Agents** → **Environments** → **BloodLink**)
2. Find **Secrets** (or **Environment variables** / **Agent secrets**)
3. Add:
   - **Name:** `GITHUB_TOKEN` (must match exactly, case-sensitive)
   - **Value:** paste the token
4. **Save** the environment

This repo’s `.cursor/environment.json` already lists:

```json
"repositoryDependencies": [
  "github.com/hareeshnurani/NuraniBloodDonationTracker"
]
```

That tells Cursor to include that repo when generating GitHub access for the environment.

## 3. Start a **new** agent run

Secrets are injected when a **new** cloud agent pod starts. After saving `GITHUB_TOKEN`:

- Start a **new** agent message/run (or re-run from the agent UI), **or**
- Wait for the next fresh environment boot

Then ask the agent:

> Push `cursor/request-select-chevron-8267` to GitHub and open a PR to `main`.

## 4. Verify (agent or you)

In a new agent session, the agent can run:

```bash
bash scripts/check-github-token.sh
```

You should see `GITHUB_TOKEN is set` and API access to `hareeshnurani/NuraniBloodDonationTracker`.

## Optional: Vercel

Same secrets UI — add **`VERCEL_TOKEN`** from https://vercel.com/account/tokens so the agent can inspect deployments and redeploy.

## Troubleshooting

| Symptom | Fix |
|--------|-----|
| Agent says `GITHUB_TOKEN` unset | Secret name typo; save environment; **new** agent run |
| `403` or `Resource not accessible` | Token missing repo access or PR permission |
| Push works but no PR | Ask agent explicitly to open PR, or use GitHub compare URL |
| Old repo URL in docs | Canonical repo: **hareeshnurani/NuraniBloodDonationTracker** |

Never commit tokens into git, `environment.json`, or chat.
