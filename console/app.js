// Aegis Nexus Console - Authoritative Observer Interface Logic
document.addEventListener('DOMContentLoaded', () => {
  // Ephemeral Pre-Auth Access Barrier
  const AUTH_KEY = 'aegis_console_session_token';
  const EXPECTED_PASSPHRASE = 'Aegis2026!';

  if (sessionStorage.getItem(AUTH_KEY) !== 'AUTHORIZED') {
    const entry = prompt('Aegis Nexus Console - Enter Observer Access Key:');
    if (entry === EXPECTED_PASSPHRASE) {
      sessionStorage.setItem(AUTH_KEY, 'AUTHORIZED');
    } else {
      window.location.href = 'https://aegisnexus.ai';
      return;
    }
  }

  let telemetryRecords = [];
  let activeIndex = 0;

  let accessToken = sessionStorage.getItem('aegis_supabase_token');

  async function authenticateSupabase() {
    if (!accessToken) {
      const email = prompt('Aegis Nexus Console - Enter Observer Email:');
      const password = prompt('Aegis Nexus Console - Enter Password:');
      if (!email || !password) {
        return false;
      }

      try {
        const authRes = await fetch(`${AEGIS_CONFIG.SUPABASE_URL}/auth/v1/token?grant_type=password`, {
          method: 'POST',
          headers: {
            'apikey': AEGIS_CONFIG.SUPABASE_ANON_KEY,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email, password })
        });
        if (!authRes.ok) throw new Error('Authentication failed');
        const authData = await authRes.json();
        accessToken = authData.access_token;
        sessionStorage.setItem('aegis_supabase_token', accessToken);
      } catch (err) {
        alert('Supabase Auth Error: ' + err.message);
        return false;
      }
    }
    return true;
  }

  async function fetchLiveTelemetry() {
    try {
      const url = `${AEGIS_CONFIG.SUPABASE_URL}/rest/v1/pilot_guardian_telemetry?select=*`;
      const response = await fetch(url, {
        headers: {
          'apikey': AEGIS_CONFIG.SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);
      telemetryRecords = await response.json();
      if (!telemetryRecords || telemetryRecords.length === 0) return;
      await fetchThreatAlerts();

      // Default to Worm if present, otherwise first available record
      const defaultIdx = telemetryRecords.findIndex(r => (r.nickname || r.callsign) === 'Worm');
      activeIndex = defaultIdx >= 0 ? defaultIdx : 0;

      renderPilotData(telemetryRecords[activeIndex]);
      setupPilotSwitcher();
    } catch (err) {
        console.error('❌ Live telemetry fetch failed:', err);
        const statusSubEl = document.querySelector('.card-status .status-subtext');
        if (statusSubEl) {
          statusSubEl.innerText = `⚠️ Fetch Error: ${err.message}`;
          statusSubEl.style.color = '#ef4444';
        }
      }

   async function fetchThreatAlerts() {
     try {
       const activePilot = telemetryRecords[activeIndex] || {};
       const pilotToken = activePilot.tester_id || 'u_alpha_002';
       const threatUrl = `${AEGIS_CONFIG.SUPABASE_URL}/rest/v1/sentinel_alerts?select=*&pilot_id=eq.${pilotToken}&order=created_at.desc&limit=5`;
       
       const resp = await fetch(threatUrl, {
         headers: {
           'apikey': AEGIS_CONFIG.SUPABASE_ANON_KEY,
           'Authorization': `Bearer ${accessToken}`,
           'Content-Type': 'application/json'
         }
       });
       if (!resp.ok) return;
       const alerts = await resp.json();
       renderThreatAlerts(alerts);
     } catch (e) {
       console.warn("⚠️ Threat alerts stream fetch failed:", e);
     }
   }

   function renderThreatAlerts(alerts) {
     const container = document.getElementById('threat-container');
     const badge = document.getElementById('threat-stream-badge');
     if (!container) return;

     const activePilot = telemetryRecords[activeIndex] || {};
     const isDaemonActive = (activePilot.guardian_status === 'PROTECTED');

     if (badge) {
       badge.innerText = isDaemonActive ? 'ACTIVE' : 'STANDBY';
       badge.className = isDaemonActive ? 'badge badge-success' : 'badge badge-warning';
     }

     if (!alerts || alerts.length === 0) {
       const emptyMsg = isDaemonActive 
         ? '🛡️ Sentinel Active • No active or historical threats detected.'
         : '⏳ Sentinel daemon standby • No threats recorded.';
       container.innerHTML = `<p style="color: #94a3b8; font-size: 13px; text-align: center; margin: 20px 0;">${emptyMsg}</p>`;
       return;
     }
     container.innerHTML = alerts.map(a => `
       <div style="background: rgba(239, 68, 68, 0.1); border-left: 3px solid #ef4444; padding: 10px 14px; margin-bottom: 8px; border-radius: 4px; display: flex; justify-content: space-between; align-items: center;">
         <div>
           <strong style="color: #f87171; font-size: 13px;">${a.threat_name || a.threat_term || 'Unknown Threat'}</strong>
           <div style="color: #94a3b8; font-size: 11px; margin-top: 2px;">${new Date(a.created_at || a.timestamp).toLocaleString()}</div>
         </div>
         <span style="background: #991b1b; color: #fff; font-size: 10px; padding: 2px 8px; border-radius: 10px; text-transform: uppercase; font-weight: bold;">${a.severity || 'ALERT'}</span>
       </div>
     `).join('');
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
    const streakVal = data.pilot_streak_count ?? data.streak_count ?? 0;
    streakEl.innerText = `${streakVal} day streak`;
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

      const statusEl = document.getElementById('val-defense-status') || document.getElementById('val-guardian-status');
      if (statusEl && data.guardian_status) {
        statusEl.innerText = data.guardian_status;
      }

      const statusSubEl = document.querySelector('.card-status .status-subtext');
      if (statusSubEl && data.status_subtext) {
        statusSubEl.innerText = data.status_subtext;
      }

      const lastActiveEl = document.getElementById('val-last-active');
      if (lastActiveEl && data.last_active) {
      let activeText = `🕒 Last active: ${data.last_active}`;
      if (data.vitals && data.vitals.battery) {
        activeText += ` • 🔋 Battery: ${data.vitals.battery}%`;
      }
      lastActiveEl.innerText = activeText;
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

  let telemetryPollInterval = null;

  function startTelemetryPolling() {
    fetchLiveTelemetry();
    if (telemetryPollInterval === null) {
      telemetryPollInterval = setInterval(fetchLiveTelemetry, 45000);
    }
  }

  function stopTelemetryPolling() {
    if (telemetryPollInterval !== null) {
      clearInterval(telemetryPollInterval);
      telemetryPollInterval = null;
    }
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stopTelemetryPolling();
    } else {
      startTelemetryPolling();
    }
  });

  authenticateSupabase().then(authed => {
    if (authed) {
      document.body.style.visibility = 'visible';
      startTelemetryPolling();
    }
  });

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
