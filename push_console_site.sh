#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="/mnt/forge_sandbox/aegis-site"
cd "$REPO_DIR"

echo "=== Aegis Site HITL Promotion Sweep ==="
git status -s
UNPUSHED=$(git rev-list --count origin/main..HEAD 2>/dev/null || echo 0)
echo "Unpushed local commits ahead of origin/main: ${UNPUSHED}"

if [[ -z $(git status -s) && "$UNPUSHED" -eq 0 ]]; then
  echo "No modified, untracked, or unpushed commits detected. Nothing to push."
  exit 0
fi

read -rp "Authorize production deployment push to GitHub (y/N)? " confirm
if [[ "$confirm" =~ ^[Yy]$ ]]; then
  if [[ -n $(git status -s) ]]; then
    git add -A
    read -rp "Enter commit message: " msg
    git commit -m "$msg"
  fi
  git push origin main
  echo "[SUCCESS] Changes pushed to origin/main. Netlify build triggered."
else
  echo "[ABORTED] Promotion cancelled by Founder."
  exit 1
fi
