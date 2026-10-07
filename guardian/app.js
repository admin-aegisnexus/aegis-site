// Aegis Caregiver Portal - Client Interface Logic
document.addEventListener('DOMContentLoaded', () => {
  async function loadTelemetry() {
    try {
      const response = await fetch('./mock_guardian_telemetry.json');
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);
      const data = await response.json();

      const callsignEl = document.getElementById('val-pilot-callsign');
      if (callsignEl && (data.nickname || data.callsign)) {
        callsignEl.innerText = data.nickname || data.callsign;
      }

      const streakEl = document.getElementById('val-streak-count');
      if (streakEl && data.streak_count !== undefined) {
        streakEl.innerText = `${data.streak_count} day streak`;
      }

      const completedEl = document.getElementById('val-completed-modules');
      if (completedEl && (data.completed_days !== undefined || data.completed_modules_count !== undefined)) {
        completedEl.innerText = `${data.completed_days ?? data.completed_modules_count} days completed`;
      }

      const iqEl = document.getElementById('val-security-iq');
      if (iqEl && data.security_iq?.score !== undefined) {
        iqEl.innerText = data.security_iq.score;
      }

      const statusEl = document.getElementById('val-guardian-status');
      if (statusEl && (data.vitals?.signal || data.guardian_status)) {
        statusEl.innerText = data.vitals?.signal || data.guardian_status;
      }

      const lastActiveEl = document.getElementById('val-last-active');
      if (lastActiveEl && data.last_active) {
        lastActiveEl.innerText = `🕒 Last active: ${data.last_active}`;
      }
    } catch (err) {
      console.warn('Telemetry load failed, retaining static layout fallback:', err);
    }
  }

  loadTelemetry();

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
