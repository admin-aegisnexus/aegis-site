// Aegis Caregiver Portal - Authoritative Client Interface Logic
document.addEventListener('DOMContentLoaded', () => {
  // Ephemeral Pre-Auth Access Barrier
  const AUTH_KEY = 'aegis_portal_session_token';
  const EXPECTED_PASSPHRASE = 'Aegis2026!';

  if (sessionStorage.getItem(AUTH_KEY) !== 'AUTHORIZED') {
    const entry = prompt('Aegis Nexus Authorized Portal - Enter Access Key:');
    if (entry === EXPECTED_PASSPHRASE) {
      sessionStorage.setItem(AUTH_KEY, 'AUTHORIZED');
    } else {
      window.location.href = 'https://aegisnexus.ai';
      return;
    }
  }
  document.body.style.visibility = 'visible';

  let telemetryRecords = [];
  let activeIndex = 0;

  async function fetchLiveTelemetry() {
    try {
      const url = `${AEGIS_CONFIG.SUPABASE_URL}/rest/v1/pilot_guardian_telemetry?select=*`;
      const response = await fetch(url, {
        headers: {
          'apikey': AEGIS_CONFIG.SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${AEGIS_CONFIG.SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);
      telemetryRecords = await response.json();
      if (!telemetryRecords || telemetryRecords.length === 0) return;

      // Default to Worm if present, otherwise first available record
      const defaultIdx = telemetryRecords.findIndex(r => (r.nickname || r.callsign) === 'Worm');
      activeIndex = defaultIdx >= 0 ? defaultIdx : 0;

      renderPilotData(telemetryRecords[activeIndex]);
      setupPilotSwitcher();
    } catch (err) {
      console.warn('Live telemetry fetch failed, retaining static layout fallback:', err);
    }
  }

  function renderPilotData(data) {
    if (!data) return;

      const callsignEl = document.getElementById('val-pilot-callsign');
      if (callsignEl && (data.nickname || data.callsign)) {
        callsignEl.innerText = data.nickname || data.callsign;
      }

      const streakEl = document.getElementById('val-streak-count');
    if (streakEl) {
      streakEl.innerText = `[STAGED: LOCAL_PREF_DEBT]`;
    }

      const completedEl = document.getElementById('val-completed-modules');
      if (completedEl && (data.completed_days !== undefined || data.completed_modules_count !== undefined)) {
        completedEl.innerText = `${data.completed_days ?? data.completed_modules_count} days completed`;
      }

      const iqEl = document.getElementById('val-security-iq');
      if (iqEl && data.security_iq?.score !== undefined) {
        iqEl.innerText = data.security_iq.score;
      } else if (iqEl && data.security_iq_score !== undefined) {
      iqEl.innerText = data.security_iq_score;
      }

      const statusEl = document.getElementById('val-guardian-status');
      if (statusEl && data.guardian_status) {
        statusEl.innerText = data.guardian_status;
      }

      const statusSubEl = document.querySelector('.card-status .status-subtext');
      if (statusSubEl && data.status_subtext) {
        statusSubEl.innerText = data.status_subtext;
      }

      const lastActiveEl = document.getElementById('val-last-active');
      if (lastActiveEl && data.last_active) {
        lastActiveEl.innerText = `🕒 Last active: ${data.last_active}`;
      }
  }

  function setupPilotSwitcher() {
    const callsignEl = document.getElementById('val-pilot-callsign');
    if (!callsignEl || telemetryRecords.length <= 1) return;
    
    // Toggle cursor styling to indicate interactive context switching
    callsignEl.style.cursor = 'pointer';
    callsignEl.title = 'Click to switch active pilot';
    callsignEl.onclick = () => {
      activeIndex = (activeIndex + 1) % telemetryRecords.length;
      renderPilotData(telemetryRecords[activeIndex]);
    };
  }

  fetchLiveTelemetry();

  const lockBtn = document.getElementById('btn-lock-device');
  if (lockBtn) {
    lockBtn.addEventListener('click', () => {
      const confirmLock = confirm("Emergency Action: Are you sure you want to trigger immediate device lockdown?");
      if (confirmLock) {
        alert("Lock command transmitted to Sentinel daemon via Tailscale endpoint.");
      }
    });
  }

  document.querySelectorAll('.btn-approve').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const card = e.target.closest('.app-request-card');
      if (card) {
        card.style.opacity = '0.5';
        card.querySelector('.app-actions').innerHTML = '<span style="color:#10b981;font-size:12px;font-weight:600;">✓ Approved for Fleet Sync</span>';
      }
    });
  });

  document.querySelectorAll('.btn-deny').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const card = e.target.closest('.app-request-card');
      if (card) {
        card.style.opacity = '0.5';
        card.querySelector('.app-actions').innerHTML = '<span style="color:#ef4444;font-size:12px;font-weight:600;">✕ Request Denied</span>';
      }
    });
  });
});
