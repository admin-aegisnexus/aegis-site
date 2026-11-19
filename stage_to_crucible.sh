#!/usr/bin/env bash
set -euo pipefail

node --check /mnt/forge_sandbox/aegis-site/console/app.js
ssh crucible@crucible "mkdir -p /mnt/staging_sandbox/aegis-site/console"
scp -r /mnt/forge_sandbox/aegis-site/console/* crucible@crucible:/mnt/staging_sandbox/aegis-site/console/
scp /mnt/forge_sandbox/aegis-site/_redirects crucible@crucible:/mnt/staging_sandbox/aegis-site/
echo "[SUCCESS] Staged to http://crucible:8090/console/ (Use Ctrl+Shift+R in browser)"
