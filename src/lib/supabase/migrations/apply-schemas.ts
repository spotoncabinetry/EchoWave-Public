import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

// Create Supabase admin client
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
  },
});

async function readSQLFile(filePath: string): Promise<string> {
  return fs.readFileSync(filePath, 'utf8');
}

async function applySQLFile(sql: string): Promise<void> {
  try {
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
    if (error) throw error;
  } catch (error) {
    console.error('Error applying SQL:', error);
    throw error;
  }
}

async function dropTables() {
  const sql = `
    DROP TABLE IF EXISTS public.orders CASCADE;
    DROP TABLE IF EXISTS public.menu_items CASCADE;
    DROP TABLE IF EXISTS public.menu_item_notes CASCADE;
    DROP TABLE IF EXISTS public.menu_categories CASCADE;
    DROP TABLE IF EXISTS public.profiles CASCADE;
  `;
  await applySQLFile(sql);
}

async function applyMigrations() {
  const schemasDir = path.join(process.cwd(), 'src', 'lib', 'supabase', 'schemas');
  
  try {
    // Drop existing tables
    console.log('Dropping existing tables...');
    await dropTables();

    // Define the order of table creation
    const tableOrder = [
      'profiles.sql',
      'menu_categories.sql',
      'menu_items.sql',
      'menu_item_notes.sql',
      'orders.sql'
    ];

    // Apply tables in order
    const tablesDir = path.join(schemasDir, 'tables');
    for (const tableName of tableOrder) {
      const filePath = path.join(tablesDir, tableName);
      if (fs.existsSync(filePath)) {
        console.log(`Applying table schema: ${tableName}`);
        const sql = await readSQLFile(filePath);
        await applySQLFile(sql);
      }
    }

    // Apply policies
    const policiesDir = path.join(schemasDir, 'policies');
    const policyFiles = fs.readdirSync(policiesDir);
    for (const file of policyFiles) {
      if (file.endsWith('.sql')) {
        console.log(`Applying policies: ${file}`);
        const sql = await readSQLFile(path.join(policiesDir, file));
        await applySQLFile(sql);
      }
    }

    // Apply functions
    const functionsDir = path.join(schemasDir, 'functions');
    const functionFiles = fs.readdirSync(functionsDir);
    for (const file of functionFiles) {
      if (file.endsWith('.sql')) {
        console.log(`Applying functions: ${file}`);
        const sql = await readSQLFile(path.join(functionsDir, file));
        await applySQLFile(sql);
      }
    }

    console.log('All migrations applied successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run migrations
applyMigrations();
