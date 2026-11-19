#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="/mnt/forge_sandbox/aegis-site"
cd "$REPO_DIR"

echo "=== Aegis Site HITL Promotion Sweep ==="
git status -s

if [[ -z $(git status -s) ]]; then
  echo "No modified or untracked files detected. Nothing to push."
  exit 0
fi

read -rp "Authorize production deployment push to GitHub (y/N)? " confirm
if [[ "$confirm" =~ ^[Yy]$ ]]; then
  git add -A
  read -rp "Enter commit message: " msg
  git commit -m "$msg"
  git push origin main
  echo "[SUCCESS] Changes pushed to origin/main. Netlify build triggered."
else
  echo "[ABORTED] Promotion cancelled by Founder."
  exit 1
fi
