import { useCallback, useEffect, useRef, useState } from 'react';
import { Agent } from '@/types/agent';

export const useWebRTC = (
  defaultVoice: string = 'alloy', 
  model: string = 'gpt-4o-mini-realtime-preview-2024-12-17', 
  agent?: Agent | null,
  onMessage?: (event: MessageEvent) => void
) => {
  const [error, setError] = useState<Error | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState(defaultVoice);
  const [isDataChannelReady, setIsDataChannelReady] = useState(false);

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const initializeWebRTC = useCallback(async () => {
    try {
      setIsConnecting(true);
      setError(null);

      // Create a new RTCPeerConnection
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });
      peerConnectionRef.current = pc;

      // Create a data channel for events
      const dc = pc.createDataChannel('events');
      dataChannelRef.current = dc;

      dc.onopen = () => setIsDataChannelReady(true);
      dc.onclose = () => setIsDataChannelReady(false);
      dc.onmessage = onMessage;

      // Add local audio track
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
        mediaStreamRef.current = stream;
        stream.getTracks().forEach(track => pc.addTrack(track, stream));
      } catch (err) {
        console.error('Error accessing microphone:', err);
        throw new Error('Failed to access microphone. Please ensure microphone permissions are granted.');
      }

      // Set up remote audio
      pc.ontrack = (event) => {
        const audio = new Audio();
        audio.srcObject = event.streams[0];
        audio.play().catch(console.error);
      };

      // Create and set local description
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: false
      });
      await pc.setLocalDescription(offer);

      // Wait for ICE gathering to complete
      await new Promise<void>((resolve) => {
        if (pc.iceGatheringState === 'complete') {
          resolve();
        } else {
          pc.onicegatheringstatechange = () => {
            if (pc.iceGatheringState === 'complete') {
              resolve();
            }
          };
        }
      });

      // Get the ephemeral token and SDP answer from our server
      console.log('Getting ephemeral token...');
      const tokenResponse = await fetch('/api/agent/ephemeral-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          model,
          sdp: pc.localDescription?.sdp 
        })
      });

      if (!tokenResponse.ok) {
        const error = await tokenResponse.json();
        console.error('Token error:', error);
        throw new Error(`Failed to get authentication token: ${JSON.stringify(error)}`);
      }

      const { sdp: answerSdp } = await tokenResponse.json();

      // Set the remote description with the SDP answer
      await pc.setRemoteDescription({
        type: 'answer',
        sdp: answerSdp
      });

      setIsConnected(true);
      setIsConnecting(false);

    } catch (err) {
      console.error('WebRTC initialization error:', err);
      setError(err instanceof Error ? err : new Error('Failed to initialize WebRTC'));
      setIsConnecting(false);
      setIsConnected(false);
      cleanup();
    }
  }, [model, onMessage]);

  const startListening = useCallback(async () => {
    if (!isConnected || !dataChannelRef.current) {
      throw new Error('WebRTC connection not established');
    }
    setIsListening(true);
  }, [isConnected]);

  const stopListening = useCallback(() => {
    if (isListening) {
      setIsListening(false);
    }
  }, [isListening]);

  const cleanup = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }

    if (dataChannelRef.current) {
      dataChannelRef.current.close();
      dataChannelRef.current = null;
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    setIsConnected(false);
    setIsConnecting(false);
    setIsListening(false);
    setIsDataChannelReady(false);
  }, []);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    error,
    isConnected,
    isConnecting,
    isListening,
    selectedVoice,
    isDataChannelReady,
    startListening,
    stopListening,
    connect: initializeWebRTC,
    setVoice: setSelectedVoice
  };
};
