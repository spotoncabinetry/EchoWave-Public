import { useState, useEffect, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/lib/supabase/types/database.types';
import { VoiceOption } from '@/pages/api/agent/ephemeral-token';

interface WebRTCState {
  isConnected: boolean;
  isRecording: boolean;
  error: string | null;
  transcripts: string[];
  finalTranscript: string | null;
  availableVoices: VoiceOption[];
  selectedVoice: string;
  test_duration_seconds: number; // Add this property to the state
}

const MODEL_NAME = 'gpt-4o-mini-realtime-preview-2024-12-17';

export const useWebRTC = (initialVoice: string = 'alloy', agent: any) => { // Add agent as a prop
  const [state, setState] = useState<WebRTCState>({
    isConnected: false,
    isRecording: false,
    error: null,
    transcripts: [],
    finalTranscript: null,
    availableVoices: [],
    selectedVoice: initialVoice,
    test_duration_seconds: 0 // Initialize test_duration_seconds to 0
  });

  const [peerConnection, setPeerConnection] = useState<RTCPeerConnection | null>(null);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const supabase = createClientComponentClient<Database>();

  // Get ephemeral key from our server
  const getEphemeralKey = async (voice: string) => {
    try {
      const response = await fetch('/api/agent/ephemeral-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ voice })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Ephemeral key error:', errorData);
        throw new Error('Failed to get ephemeral key');
      }
      
      const { key, voices } = await response.json();
      setState(prev => ({ ...prev, availableVoices: voices }));
      return key;
    } catch (error) {
      console.error('Error getting ephemeral key:', error);
      throw error;
    }
  };

  // Change voice
  const changeVoice = async (voice: string) => {
    try {
      // Stop any existing connection
      if (peerConnection) {
        peerConnection.close();
        setPeerConnection(null);
      }
      
      setState(prev => ({ 
        ...prev, 
        selectedVoice: voice,
        isConnected: false 
      }));

      // Reinitialize with new voice
      await initializeWebRTC(voice);
    } catch (error) {
      console.error('Error changing voice:', error);
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to change voice' 
      }));
    }
  };

  // Initialize WebRTC connection
  const initializeWebRTC = async (voice?: string) => {
    try {
      const ephemeralKey = await getEphemeralKey(voice || state.selectedVoice);
      
      // Create and configure peer connection
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });

      // Connect to OpenAI's WebRTC endpoint
      const response = await fetch(`https://api.openai.com/v1/realtime?model=${MODEL_NAME}`, {
        headers: {
          'Authorization': `Bearer ${ephemeralKey}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('OpenAI WebRTC Error:', errorData);
        throw new Error(`Failed to connect to OpenAI: ${response.statusText}`);
      }

      const { sdp: remoteSdp } = await response.json();

      // Set remote description
      await pc.setRemoteDescription(new RTCSessionDescription(remoteSdp));

      // Create and set local description
      const localDesc = await pc.createAnswer();
      await pc.setLocalDescription(localDesc);

      // Send local description to OpenAI
      const answerResponse = await fetch('https://api.openai.com/v1/realtime/answer', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ephemeralKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ sdp: localDesc })
      });

      if (!answerResponse.ok) {
        const errorData = await answerResponse.json().catch(() => ({}));
        console.error('OpenAI Answer Error:', errorData);
        throw new Error(`Failed to send answer to OpenAI: ${answerResponse.statusText}`);
      }

      setPeerConnection(pc);
      setState(prev => ({ ...prev, isConnected: true }));
    } catch (error) {
      console.error('Error initializing WebRTC:', error);
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to initialize WebRTC connection',
        isConnected: false 
      }));
    }
  };

  // Start recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      setMediaStream(stream);

      if (peerConnection) {
        stream.getTracks().forEach(track => {
          peerConnection.addTrack(track, stream);
        });
      }

      setState(prev => ({ ...prev, isRecording: true }));
    } catch (error) {
      console.error('Error starting recording:', error);
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to access microphone',
        isRecording: false
      }));
    }
  };

  // Stop recording
  const stopRecording = useCallback(async () => {
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop());
      setMediaStream(null);
    }

    if (state.finalTranscript) {
      // Store transcript in Supabase
      try {
        await supabase.from('customer_call_logs').insert({
          restaurant_id: agent.restaurant_id,
          customer_id: 'placeholder', // You'll need to handle this based on your needs
          agent_id: agent.id,
          transcript: state.finalTranscript,
          outcome: 'completed',
          interaction_summary: 'Test call',
          call_tags: ['test'],
          duration_seconds: state.test_duration_seconds
        });
      } catch (error) {
        console.error('Error storing transcript:', error);
      }
    }

    setState(prev => ({ 
      ...prev, 
      isRecording: false,
      finalTranscript: null 
    }));
  }, [mediaStream, state.finalTranscript, supabase, agent]);

  // Handle incoming transcripts
  useEffect(() => {
    if (!peerConnection) return;

    peerConnection.ontrack = (event) => {
      // Handle incoming audio if needed
    };

    peerConnection.ondatachannel = (event) => {
      const channel = event.channel;
      channel.onmessage = (msg) => {
        try {
          const transcript = JSON.parse(msg.data);
          if (transcript.final) {
            setState(prev => ({ 
              ...prev, 
              finalTranscript: transcript.text,
              transcripts: [...prev.transcripts, transcript.text]
            }));
          } else {
            setState(prev => ({ 
              ...prev, 
              transcripts: [...prev.transcripts, transcript.text]
            }));
          }
        } catch (error) {
          console.error('Error processing transcript:', error);
        }
      };
    };
  }, [peerConnection]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
      }
      if (peerConnection) {
        peerConnection.close();
      }
    };
  }, [mediaStream, peerConnection]);

  return {
    ...state,
    startRecording,
    stopRecording,
    initializeWebRTC,
    changeVoice
  };
};
