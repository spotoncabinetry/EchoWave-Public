import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Get all environment variables that contain these keywords
  const envKeys = Object.keys(process.env).filter(key => 
    key.includes('SUPABASE') || 
    key.includes('OPENAI') || 
    key.includes('NEXT_PUBLIC')
  );

  // Return environment variable status (without values)
  res.status(200).json({
    envKeys,
    status: {
      NEXT_PUBLIC_SUPABASE_URL: {
        exists: typeof process.env.NEXT_PUBLIC_SUPABASE_URL !== 'undefined',
        hasValue: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        length: process.env.NEXT_PUBLIC_SUPABASE_URL?.length
      },
      SUPABASE_SERVICE_KEY: {
        exists: typeof process.env.SUPABASE_SERVICE_KEY !== 'undefined',
        hasValue: !!process.env.SUPABASE_SERVICE_KEY,
        length: process.env.SUPABASE_SERVICE_KEY?.length
      },
      OPENAI_API_KEY: {
        exists: typeof process.env.OPENAI_API_KEY !== 'undefined',
        hasValue: !!process.env.OPENAI_API_KEY,
        length: process.env.OPENAI_API_KEY?.length
      }
    }
  });
}
