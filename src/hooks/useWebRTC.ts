import { useState, useCallback, useEffect, useRef } from 'react';
import type { Agent } from '@/types/database';

declare global {
  interface Window {
    rtcDataChannel: RTCDataChannel;
    rtcPeerConnection: RTCPeerConnection;
  }
}

export const useWebRTC = (defaultVoice: string = 'alloy', agent?: Agent | null) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedVoice, setSelectedVoice] = useState(defaultVoice);
  const [isDataChannelReady, setIsDataChannelReady] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const isCleaningUpRef = useRef(false);

  const cleanup = useCallback(async () => {
    if (isCleaningUpRef.current) return;
    isCleaningUpRef.current = true;
    
    try {
      console.log('Cleaning up WebRTC resources...');
      
      // Stop media stream first
      if (mediaStreamRef.current) {
        console.log('Stopping media stream...');
        mediaStreamRef.current.getTracks().forEach(track => {
          track.stop();
        });
        mediaStreamRef.current = null;
      }

      // Close data channel
      if (window.rtcDataChannel) {
        console.log('Closing data channel...');
        window.rtcDataChannel.close();
      }

      // Close peer connection
      if (window.rtcPeerConnection) {
        console.log('Closing peer connection...');
        window.rtcPeerConnection.close();
      }

      // Clean up audio
      if (audioRef.current) {
        console.log('Cleaning up audio element...');
        audioRef.current.srcObject = null;
      }

      // Close audio context last
      if (audioContextRef.current?.state !== 'closed') {
        console.log('Closing audio context...');
        await audioContextRef.current?.close();
      }

      window.rtcDataChannel = undefined;
      window.rtcPeerConnection = undefined;
      
      setIsListening(false);
      setIsConnected(false);
      setIsDataChannelReady(false);
    } catch (err) {
      console.error('Error during cleanup:', err);
    } finally {
      isCleaningUpRef.current = false;
    }
  }, []);

  const initializeWebRTC = useCallback(async () => {
    try {
      console.log('Initializing WebRTC connection...');
      setError(null);
      
      // Clean up any existing connections
      await cleanup();

      // Initialize audio context
      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      // Create audio element if it doesn't exist
      if (!audioRef.current) {
        const audioEl = new Audio();
        audioEl.autoplay = true;
        audioEl.volume = 1.0;
        document.body.appendChild(audioEl);
        audioRef.current = audioEl;
      }

      // Get ephemeral token
      console.log('Requesting ephemeral token...');
      const tokenResponse = await fetch('/api/agent/ephemeral-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voice: selectedVoice }),
      });

      if (!tokenResponse.ok) {
        throw new Error('Failed to get ephemeral token');
      }

      const { key: EPHEMERAL_KEY } = await tokenResponse.json();
      console.log('Received ephemeral token');

      // Create peer connection
      console.log('Creating peer connection...');
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      });
      window.rtcPeerConnection = pc;

      // Set up audio playback
      console.log('Setting up audio playback...');
      pc.ontrack = (event) => {
        console.log('Received audio track:', event.streams[0]);
        if (audioRef.current && audioContextRef.current?.state === 'running') {
          const stream = event.streams[0];
          const source = audioContextRef.current.createMediaStreamSource(stream);
          const gainNode = audioContextRef.current.createGain();
          gainNode.gain.value = 1.0;
          source.connect(gainNode);
          gainNode.connect(audioContextRef.current.destination);
          audioRef.current.srcObject = stream;
          audioRef.current.play().catch(err => {
            console.error('Error playing audio:', err);
          });
        }
      };

      // Set up data channel
      console.log('Creating data channel...');
      const dc = pc.createDataChannel('oai-events');
      window.rtcDataChannel = dc;

      // Set up data channel event handlers
      dc.onopen = () => {
        console.log('Data channel is open');
        setIsDataChannelReady(true);
        // Send initial context once channel is open
        if (agent) {
          console.log('Sending agent context:', agent);
          dc.send(JSON.stringify({
            type: 'context',
            data: {
              greeting: agent.agent_greeting,
              storeHours: agent.agent_store_hours,
              dailySpecials: agent.agent_daily_specials,
              menuItemsEnabled: agent.menu_items_enabled,
              menuCategoriesEnabled: agent.menu_categories_enabled
            }
          }));
        }
      };

      dc.onclose = () => {
        console.log('Data channel is closed');
        setIsDataChannelReady(false);
      };

      dc.onerror = (error) => {
        console.error('Data channel error:', error);
        setError('Data channel error occurred');
      };

      dc.onmessage = (event) => {
        console.log('Received message on data channel:', event.data);
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'error') {
            console.error('OpenAI error:', data);
            setError(data.error || 'An error occurred');
          } else if (data.type === 'transcript') {
            // Handle real-time transcription if needed
            console.log('Transcript:', data.text);
          } else if (data.type === 'audio_start') {
            console.log('AI starting to speak');
          } else if (data.type === 'audio_end') {
            console.log('AI finished speaking');
          }
        } catch (err) {
          console.error('Error parsing message:', err);
        }
      };

      // Handle ICE candidates
      pc.onicecandidate = event => {
        if (event.candidate) {
          console.log('New ICE candidate:', event.candidate);
        }
      };

      pc.oniceconnectionstatechange = () => {
        console.log('ICE connection state:', pc.iceConnectionState);
        if (pc.iceConnectionState === 'failed') {
          setError('Connection failed. Please try again.');
          cleanup();
        }
      };

      pc.onconnectionstatechange = () => {
        console.log('Connection state:', pc.connectionState);
        if (pc.connectionState === 'connected') {
          setIsConnected(true);
        } else if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
          setIsConnected(false);
          cleanup();
        }
      };

      // Create and send offer
      console.log('Creating and sending offer...');
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: false
      });
      await pc.setLocalDescription(offer);

      const baseUrl = 'https://api.openai.com/v1/realtime';
      const model = 'gpt-4o-mini-realtime-preview-2024-12-17';
      console.log('Sending SDP to OpenAI...');
      const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
        method: 'POST',
        body: offer.sdp,
        headers: {
          Authorization: `Bearer ${EPHEMERAL_KEY}`,
          'Content-Type': 'application/sdp',
        },
      });

      if (!sdpResponse.ok) {
        const errorText = await sdpResponse.text();
        console.error('SDP response error:', errorText);
        throw new Error('Failed to establish WebRTC connection');
      }

      const answer = {
        type: 'answer' as RTCSdpType,
        sdp: await sdpResponse.text(),
      };

      console.log('Received SDP answer from OpenAI');
      await pc.setRemoteDescription(answer);
      console.log('Set remote description');

      // Resume audio context if it was suspended
      if (audioContextRef.current?.state === 'suspended') {
        await audioContextRef.current.resume();
      }
    } catch (err) {
      console.error('WebRTC initialization error:', err);
      setError(err instanceof Error ? err.message : 'Failed to initialize WebRTC');
      setIsConnected(false);
      cleanup();
    }
  }, [selectedVoice, agent, cleanup]);

  const startListening = useCallback(async () => {
    if (isListening) {
      console.log('Already listening, ignoring start request');
      return;
    }

    try {
      if (!isDataChannelReady) {
        throw new Error('Data channel is not ready. Please wait a moment and try again.');
      }

      setError(null);
      
      console.log('Requesting microphone access...');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      console.log('Microphone access granted');
      
      mediaStreamRef.current = stream;
      
      if (window.rtcPeerConnection) {
        console.log('Adding audio track to peer connection...');
        const audioTrack = stream.getAudioTracks()[0];
        window.rtcPeerConnection.addTrack(audioTrack, stream);
        setIsListening(true);
        console.log('Started listening');
      }
    } catch (err) {
      console.error('Start listening error:', err);
      setError(err instanceof Error ? err.message : 'Failed to start listening');
      setIsListening(false);
      cleanup();
    }
  }, [isDataChannelReady, cleanup, isListening]);

  const stopListening = useCallback(async () => {
    if (!isListening) {
      console.log('Not listening, ignoring stop request');
      return;
    }

    try {
      console.log('Stopping listening...');
      await cleanup();
    } catch (err) {
      console.error('Stop listening error:', err);
      setError(err instanceof Error ? err.message : 'Failed to stop listening');
      cleanup();
    }
  }, [cleanup, isListening]);

  const changeVoice = useCallback((voice: string) => {
    if (voice === selectedVoice) return;
    console.log('Changing voice to:', voice);
    setSelectedVoice(voice);
  }, [selectedVoice]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    isConnected,
    isListening,
    error,
    selectedVoice,
    isDataChannelReady,
    startListening,
    stopListening,
    initializeWebRTC,
    changeVoice,
  };
};
