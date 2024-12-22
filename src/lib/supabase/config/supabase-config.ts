export const SUPABASE_CONFIG = {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storageKey: 'echo-waves-auth',
    storage: typeof window !== 'undefined' ? window.localStorage : undefined
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: { 'x-application-name': 'echo-waves' }
  }
};
