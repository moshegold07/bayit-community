#!/bin/bash
# Automated Google Form → Firestore sync for Bayit Community.
# Runs: pull new form responses (idempotent) + auto-link to existing users.
# Invoked by `at` jobs (one-off scheduled runs).
set -u
cd /root/bayit-community
export GOOGLE_APPLICATION_CREDENTIALS=/root/.config/firebase-keys/bayit-community-sa.json
LOG=/var/log/bayit-form-sync.log
{
  echo "===== $(date -u '+%Y-%m-%d %H:%M:%S UTC') ====="
  echo "--- pull ---"
  node scripts/pull-form-responses.mjs --execute
  pull_rc=$?
  echo "--- resolve ---"
  node scripts/resolve-form-duplicates.mjs --execute --yes
  resolve_rc=$?
  echo "Exit codes: pull=$pull_rc resolve=$resolve_rc"
  echo ""
} >> "$LOG" 2>&1
