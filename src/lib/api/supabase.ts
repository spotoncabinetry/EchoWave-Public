import { createClient } from '@supabase/supabase-js';
import { environment } from '@/config/environment';

// Create Supabase client with environment variables
export const supabase = createClient(
  environment.supabase.url,
  environment.supabase.anonKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  }
);

// Create admin client with service role key (use carefully, only in trusted server-side operations)
export const supabaseAdmin = createClient(
  environment.supabase.url,
  environment.supabase.serviceRoleKey!,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  }
);
