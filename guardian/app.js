// Aegis Caregiver Portal - Client Interface Logic
document.addEventListener('DOMContentLoaded', () => {
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
