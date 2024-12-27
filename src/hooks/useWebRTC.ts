import { useState, useCallback, useRef } from 'react';
import { WebRTCState, WebRTCRefs } from '@/types/webrtc';
import { Agent } from '@/types/agent';

export const useWebRTC = (
  defaultVoice: string = 'alloy', 
  model: string = 'gpt-4o-mini-realtime-preview-2024-12-17', 
  agent?: Agent | null,
  onMessage?: (event: MessageEvent) => void
) => {
  const [state, setState] = useState<WebRTCState>({
    isConnected: false,
    isListening: false,
    isDataChannelReady: false,
    isConnecting: false,
    error: null,
    selectedVoice: defaultVoice,
    model: model
  });

  const refs = useRef<WebRTCRefs>({
    peerConnection: null,
    dataChannel: null,
    mediaStream: null,
    audioElement: null
  });

  const cleanup = useCallback(async () => {
    const { mediaStream, dataChannel, peerConnection, audioElement } = refs.current;
    
    mediaStream?.getTracks().forEach(track => track.stop());
    dataChannel?.close();
    peerConnection?.close();
    audioElement?.remove();

    refs.current = {
      peerConnection: null,
      dataChannel: null,
      mediaStream: null,
      audioElement: null
    };

    setState(prev => ({ 
      ...prev, 
      isConnected: false, 
      isConnecting: false,
      isDataChannelReady: false,
      error: null 
    }));
  }, []);

  const initializeWebRTC = useCallback(async () => {
    if (state.isConnecting) return;
    
    setState(prev => ({ ...prev, isConnecting: true, error: null }));
    
    try {
      // Cleanup any existing connection
      await cleanup();

      // Create peer connection
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });
      refs.current.peerConnection = pc;

      // Set up audio element for remote audio
      const audioEl = document.createElement('audio');
      audioEl.autoplay = true;
      refs.current.audioElement = audioEl;
      
      // Handle remote audio track
      pc.ontrack = e => {
        audioEl.srcObject = e.streams[0];
      };

      // Set up data channel first
      const dc = pc.createDataChannel('oai-events');
      refs.current.dataChannel = dc;

      dc.onopen = () => {
        console.log('Data channel opened');
        setState(prev => ({ ...prev, isDataChannelReady: true }));
        
        // Send initial configuration
        if (dc.readyState === 'open') {
          const initialMessage = {
            type: 'configure',
            data: {
              voice_id: state.selectedVoice,
              model: state.model,
              ...(agent ? { agent } : {})
            }
          };
          dc.send(JSON.stringify(initialMessage));
        }
      };

      dc.onclose = () => {
        console.log('Data channel closed');
        setState(prev => ({ ...prev, isDataChannelReady: false }));
      };

      dc.onerror = (error) => {
        console.error('Data channel error:', error);
        setState(prev => ({ ...prev, error: 'Data channel error occurred' }));
      };

      dc.onmessage = (event) => {
        console.log('Received message:', event.data);
        if (onMessage) onMessage(event);
      };

      // Add local audio track before creating offer
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        refs.current.mediaStream = stream;
        stream.getTracks().forEach(track => {
          if (pc.signalingState !== 'closed') {
            pc.addTrack(track, stream);
          }
        });
      } catch (error) {
        console.error('Error getting user media:', error);
        throw new Error('Failed to access microphone');
      }

      // Create and set local description
      if (pc.signalingState === 'closed') {
        throw new Error('Connection closed before offer could be created');
      }

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Get token and establish connection
      const tokenResponse = await fetch('/api/agent/ephemeral-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voice: state.selectedVoice })
      });

      if (!tokenResponse.ok) {
        throw new Error('Failed to get token');
      }

      const { key: token } = await tokenResponse.json();
      
      // Check connection state before proceeding
      if (pc.signalingState === 'closed') {
        throw new Error('Connection closed before SDP exchange');
      }

      const baseUrl = 'https://api.openai.com/v1/realtime';
      const sdpResponse = await fetch(`${baseUrl}?model=${state.model}`, {
        method: 'POST',
        body: pc.localDescription?.sdp,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/sdp'
        }
      });

      if (!sdpResponse.ok) {
        throw new Error('Failed to establish connection');
      }

      const answerSdp = await sdpResponse.text();
      
      // Final state check before setting remote description
      if (pc.signalingState === 'closed') {
        throw new Error('Connection closed before remote description could be set');
      }

      await pc.setRemoteDescription({
        type: 'answer',
        sdp: answerSdp
      });

      setState(prev => ({ ...prev, isConnected: true, isConnecting: false }));

      // Add connection state change handler
      pc.onconnectionstatechange = () => {
        console.log('Connection state:', pc.connectionState);
        switch (pc.connectionState) {
          case 'connected':
            setState(prev => ({ ...prev, isConnected: true, isConnecting: false }));
            break;
          case 'disconnected':
          case 'failed':
            console.log('Connection lost, cleaning up...');
            cleanup();
            break;
        }
      };

    } catch (error) {
      console.error('WebRTC initialization error:', error);
      cleanup();
      setState(prev => ({ 
        ...prev, 
        isConnecting: false, 
        error: error instanceof Error ? error.message : 'Failed to initialize WebRTC connection' 
      }));
    }
  }, [state.isConnecting, state.selectedVoice, state.model, agent, onMessage, cleanup]);

  const startListening = useCallback(async () => {
    if (state.isListening || !state.isDataChannelReady) return;
    setState(prev => ({ ...prev, isListening: true }));
  }, [state.isListening, state.isDataChannelReady]);

  const stopListening = useCallback(() => {
    if (!state.isListening) return;
    setState(prev => ({ ...prev, isListening: false }));
  }, [state.isListening]);

  return {
    error: state.error,
    isConnected: state.isConnected,
    isConnecting: state.isConnecting,
    isListening: state.isListening,
    isDataChannelReady: state.isDataChannelReady,
    selectedVoice: state.selectedVoice,
    connect: initializeWebRTC,
    disconnect: cleanup,
    startListening,
    stopListening,
    setVoice: (voice: string) => setState(prev => ({ ...prev, selectedVoice: voice })),
    model: state.model
  };
};
