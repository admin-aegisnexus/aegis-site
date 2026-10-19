#!/bin/bash
set -e
echo "=== Aegis Local Staging Sweep (Zero-Credit) ==="
node --check /mnt/forge_sandbox/aegis-site/guardian/app.js
echo "[OK] JS syntax verified."
scp -r /mnt/forge_sandbox/aegis-site/guardian/* crucible@crucible:/mnt/staging_sandbox/aegis-site/guardian/
echo "[SUCCESS] Staged to http://crucible:8090/guardian/ (Use Ctrl+Shift+R in browser)"
