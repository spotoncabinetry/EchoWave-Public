import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';

export type VoiceOption = {
  id: string;
  name: string;
  description: string;
  preview_url?: string;
};

export const AVAILABLE_VOICES: VoiceOption[] = [
  {
    id: 'alloy',
    name: 'Alloy',
    description: 'A neutral voice with balanced warmth and clarity'
  },
  {
    id: 'echo',
    name: 'Echo',
    description: 'A warm, natural voice with a friendly tone'
  },
  {
    id: 'fable',
    name: 'Fable',
    description: 'An authoritative voice with a touch of wisdom'
  },
  {
    id: 'onyx',
    name: 'Onyx',
    description: 'A deep, resonant voice with gravitas'
  },
  {
    id: 'nova',
    name: 'Nova',
    description: 'An energetic, upbeat voice with youthful characteristics'
  },
  {
    id: 'shimmer',
    name: 'Shimmer',
    description: 'A clear, professional voice with a gentle presence'
  }
];

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const ephemeralToken = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('Missing OPENAI_API_KEY environment variable');
    }

    const { voice = 'alloy' } = req.body;

    // Validate voice selection
    if (!AVAILABLE_VOICES.some(v => v.id === voice)) {
      return res.status(400).json({ error: 'Invalid voice selection' });
    }

    try {
      // Get an ephemeral token for real-time audio
      const response = await fetch('https://api.openai.com/v1/realtime/sessions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4o-realtime-preview-2024-12-17',
          voice
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('OpenAI API error:', errorData);
        throw new Error(`Failed to get realtime token: ${response.statusText}`);
      }

      const data = await response.json();
      
      res.status(200).json({ 
        key: data.token,
        voices: AVAILABLE_VOICES 
      });
    } catch (error: any) {
      if (error?.response?.status === 401) {
        throw new Error('Invalid OpenAI API key');
      }
      throw error;
    }
  } catch (error) {
    console.error('Error generating ephemeral token:', error);
    res.status(500).json({ error: 'Failed to generate ephemeral token' });
  }
};

export default ephemeralToken;
