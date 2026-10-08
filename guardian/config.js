// Aegis Caregiver Ecosystem - Environment Configuration
const AEGIS_CONFIG = {
  // Staging detection keyed off /vanguard/
  IS_STAGING: window.location.pathname.includes('/vanguard'),
  
  // Endpoint resolution
  SUPABASE_URL: window.location.pathname.includes('/vanguard')
    ? 'https://kxgulxqmsjkegkudppyp.supabase.co'   // Aegis-Nexus-Test
    : 'https://ysdmklyjafgloxseywnr.supabase.co',  // Aegis-Nexus-Relay
    
  // Public client keys (anon read-only)
  SUPABASE_ANON_KEY: window.location.pathname.includes('/vanguard')
    ? 'sb_publishable_PTB0a0CpyN0iUKgaNJHtDQ_MJ1hCI1x'
    : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlzZG1rbHlqYWZnbG94c2V5d25yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2NDYxMTgsImV4cCI6MjA5MDIyMjExOH0.VItdjZgNUAt3IMaeQydidQQeXQumk6BIyQLPFcXqt_U'
};
