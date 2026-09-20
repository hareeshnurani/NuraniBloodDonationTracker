#!/usr/bin/env bash
# Non-destructive check that GITHUB_TOKEN works for the production repo.
set -euo pipefail

REPO="${GITHUB_REPO:-hareeshnurani/NuraniBloodDonationTracker}"

if [[ -z "${GITHUB_TOKEN:-}" ]]; then
  echo "GITHUB_TOKEN is NOT set in this agent pod."
  echo "Add it in Cursor Cloud Agent environment Secrets, then start a new agent run."
  echo "See docs/CLOUD_AGENT_SECRETS.md"
  exit 1
fi

echo "GITHUB_TOKEN is set."

http_code=$(curl -sS -o /dev/null -w "%{http_code}" \
  -H "Authorization: Bearer ${GITHUB_TOKEN}" \
  -H "Accept: application/vnd.github+json" \
  "https://api.github.com/repos/${REPO}")

case "$http_code" in
  200) echo "GitHub API: OK for ${REPO}" ;;
  401) echo "GitHub API: unauthorized (token invalid or expired)"; exit 1 ;;
  404) echo "GitHub API: repo not found or token lacks access to ${REPO}"; exit 1 ;;
  *) echo "GitHub API: unexpected HTTP ${http_code}"; exit 1 ;;
esac
