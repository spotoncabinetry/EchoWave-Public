import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const response = await fetch('https://api.openai.com/v1/realtime/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-realtime-preview-2024-12-17',
        ttl_seconds: 60 // Key expires in 1 minute
      })
    });

    if (!response.ok) {
      throw new Error('Failed to get ephemeral key from OpenAI');
    }

    const { key } = await response.json();
    res.status(200).json({ key });
  } catch (error) {
    console.error('Error getting ephemeral key:', error);
    res.status(500).json({ error: 'Failed to get ephemeral key' });
  }
}
