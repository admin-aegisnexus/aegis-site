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
    : '<PROD_ANON_PUBLIC_KEY>'
};
