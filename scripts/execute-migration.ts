import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

async function executeMigration() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // Read the SQL file
    const sqlPath = path.join(process.cwd(), 'supabase', 'migrations', '20241218_add_phone_number_function.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Execute the SQL
    const { error } = await supabase.rpc('add_phone_number_column');

    if (error) {
      throw error;
    }

    console.log('Migration executed successfully');
  } catch (error) {
    console.error('Error executing migration:', error);
  }
}

executeMigration();
