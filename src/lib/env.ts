import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
config({ path: path.resolve(__dirname, '../../.env') });

// Environment variables typed and exported
export const NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
export const NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
export const OPENAI_API_KEY = process.env.OPENAI_API_KEY as string;
export const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

// Type definitions for environment variables
export interface Env {
  NEXT_PUBLIC_SUPABASE_URL: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
  OPENAI_API_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

// Validate environment variables
export function validateEnv(): string[] {
  const missingVars: string[] = [];
  
  if (!NEXT_PUBLIC_SUPABASE_URL) missingVars.push('NEXT_PUBLIC_SUPABASE_URL');
  if (!NEXT_PUBLIC_SUPABASE_ANON_KEY) missingVars.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  if (!OPENAI_API_KEY) missingVars.push('OPENAI_API_KEY');
  if (!SUPABASE_SERVICE_ROLE_KEY) missingVars.push('SUPABASE_SERVICE_ROLE_KEY');
  
  return missingVars;
}
