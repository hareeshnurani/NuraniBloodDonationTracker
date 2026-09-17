#!/usr/bin/env bash
# Inspect Vercel project deployments (requires VERCEL_TOKEN in env).
set -euo pipefail

if [[ -z "${VERCEL_TOKEN:-}" ]]; then
  echo "ERROR: Set Cloud Agent secret VERCEL_TOKEN (https://vercel.com/account/tokens)"
  exit 1
fi

PROJECT="${VERCEL_PROJECT:-nurani-blood-donation}"
TEAM="${VERCEL_TEAM:-}"

team_qs=""
if [[ -n "$TEAM" ]]; then
  team_qs="&teamId=${TEAM}"
fi

api() {
  curl -sS -H "Authorization: Bearer ${VERCEL_TOKEN}" "$@"
}

echo "=== Projects matching: ${PROJECT} ==="
api "https://api.vercel.com/v9/projects?search=${PROJECT}&limit=10" | python3 - <<'PY'
import json,sys
d=json.load(sys.stdin)
projects=d.get("projects") or []
if not projects:
    print("No projects found. Set VERCEL_TEAM to your team slug/id if the project is under a team.")
    sys.exit(0)
for p in projects:
    print(f"- {p.get('name')} id={p.get('id')} link={p.get('link',{}).get('type')} repo={p.get('link',{}).get('repo')}")
PY

echo ""
echo "=== Latest production deployments (project name filter) ==="
api "https://api.vercel.com/v6/deployments?projectId=${PROJECT}&limit=5${team_qs}" 2>/dev/null || \
api "https://api.vercel.com/v6/deployments?app=${PROJECT}&limit=5${team_qs}" | python3 - <<'PY'
import json,sys
try:
    d=json.load(sys.stdin)
except json.JSONDecodeError:
    print(sys.stdin.read() if hasattr(sys.stdin,'read') else 'bad json')
    sys.exit(1)
deps=d.get("deployments") or []
if not deps:
    print("No deployments returned. Export VERCEL_PROJECT_ID from Vercel project Settings → General.")
    sys.exit(0)
for dep in deps[:8]:
    meta=dep.get("meta") or {}
    print(
        f"{dep.get('state'):12} target={dep.get('target')} "
        f"sha={meta.get('githubCommitSha','?')[:7]} "
        f"msg={str(meta.get('githubCommitMessage',''))[:50]!r} "
        f"url={dep.get('url')}"
    )
PY

echo ""
echo "Tip: In Vercel → Project → Settings → General copy Project ID to VERCEL_PROJECT_ID for exact queries."
