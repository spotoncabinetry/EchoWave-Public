import { NextApiRequest, NextApiResponse } from 'next';

export default async function ephemeralToken(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('Missing OPENAI_API_KEY environment variable');
    }

    const { model = 'gpt-4o-mini-realtime-preview-2024-12-17', sdp } = req.body;

    if (!sdp) {
      return res.status(400).json({ error: 'SDP offer is required' });
    }

    try {
      // Request an ephemeral token from OpenAI
      const response = await fetch(`https://api.openai.com/v1/realtime?model=${model}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/sdp'
        },
        body: sdp
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('OpenAI API error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText} - ${errorData}`);
      }

      const answerSdp = await response.text();
      
      return res.status(200).json({ 
        sdp: answerSdp,
        expires_at: new Date(Date.now() + 60000).toISOString() // 1 minute from now
      });
    } catch (error) {
      console.error('OpenAI API request error:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error generating ephemeral token:', error);
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Internal server error' });
  }
}
