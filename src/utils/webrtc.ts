import { RTCConfig } from '@/types/webrtc';

export const getEphemeralToken = async (voice: string) => {
  try {
    console.log('Fetching ephemeral token for voice:', voice);
    const response = await fetch('/api/agent/ephemeral-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ voice })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Failed to get ephemeral token:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });
      throw new Error(errorData.error || `Failed to get ephemeral token: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Successfully retrieved ephemeral token');
    return { key: data.key, session_id: data.session_id };
  } catch (error) {
    console.error('Error in getEphemeralToken:', error);
    throw error;
  }
};
