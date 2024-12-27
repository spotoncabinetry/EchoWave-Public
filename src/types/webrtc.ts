export interface RTCConfig {
  iceServers: Array<{
    urls: string | string[];
    username?: string;
    credential?: string;
  }>;
  iceCandidatePoolSize: number;
  iceTransportPolicy?: 'all' | 'relay';
  bundlePolicy?: 'balanced' | 'max-compat' | 'max-bundle';
  rtcpMuxPolicy?: 'require';
}

export interface WebRTCState {
  isConnected: boolean;
  isListening: boolean;
  isDataChannelReady: boolean;
  isConnecting: boolean;
  error: string | null;
  selectedVoice: string;
  model: string;
}

export interface WebRTCRefs {
  peerConnection: RTCPeerConnection | null;
  dataChannel: RTCDataChannel | null;
  mediaStream: MediaStream | null;
  audioContext: AudioContext | null;
  audioElement: HTMLAudioElement | null;
}
