// Aegis Caregiver Portal - Client Interface Logic
document.addEventListener('DOMContentLoaded', () => {
  // Fetch and hydrate live telemetry metrics
  async function loadTelemetry() {
    try {
      const response = await fetch('./mock_guardian_telemetry.json');
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);
      const data = await response.json();

      // Populate Streak & Lifetime Counters
      const streakEl = document.getElementById('stat-streak');
      if (streakEl && data.pilot_streak_count !== undefined) {
        streakEl.innerText = `${data.pilot_streak_count} Days`;
      }

      const completedDaysEl = document.getElementById('stat-completed-days');
      if (completedDaysEl && data.lifetime_completed_days !== undefined) {
        completedDaysEl.innerText = `${data.lifetime_completed_days} Total`;
      }

      // Populate Security IQ Score
      const iqEl = document.getElementById('stat-security-iq');
      if (iqEl && data.security_iq_score !== undefined) {
        iqEl.innerText = `${data.security_iq_score}/100`;
      }

      // Populate Callsign
      const callsignEl = document.getElementById('pilot-callsign');
      if (callsignEl && data.nickname) {
        callsignEl.innerText = data.nickname;
      }
    } catch (err) {
      console.warn('Telemetry load failed, retaining static layout fallback:', err);
    }
  }

  loadTelemetry();

  const lockBtn = document.getElementById('btn-lock-device');

  lockBtn.addEventListener('click', () => {
    const confirmLock = confirm("Emergency Action: Are you sure you want to trigger immediate device lockdown for Dad via Sentinel?");
    if (confirmLock) {
      alert("Lock command transmitted to Sentinel daemon via Tailscale endpoint.");
    }
  });

  // App Approval Handler
  document.querySelectorAll('.btn-approve').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const card = e.target.closest('.app-request-card');
      const appTitle = card.querySelector('h4').innerText;
      card.style.opacity = '0.5';
      card.querySelector('.app-actions').innerHTML = '<span style="color:#10b981;font-size:12px;font-weight:600;">✓ Approved for Fleet Sync</span>';
    });
  });

  document.querySelectorAll('.btn-deny').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const card = e.target.closest('.app-request-card');
      card.style.opacity = '0.5';
      card.querySelector('.app-actions').innerHTML = '<span style="color:#ef4444;font-size:12px;font-weight:600;">✕ Denied</span>';
    });
  });
});
