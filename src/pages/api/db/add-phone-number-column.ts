import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Add phone_number column if it doesn't exist
    const { error } = await supabase.rpc('add_phone_number_column');

    if (error) {
      throw error;
    }

    return res.status(200).json({ message: 'Phone number column added successfully' });
  } catch (error) {
    console.error('Error adding phone_number column:', error);
    return res.status(500).json({ error: 'Failed to add phone_number column' });
  }
}
