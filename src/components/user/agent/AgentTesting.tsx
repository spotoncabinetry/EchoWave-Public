import React, { useEffect, useState } from 'react';
import { FaMicrophone, FaStop } from 'react-icons/fa';
import { BiMessageSquareDots } from 'react-icons/bi';
import { motion } from 'framer-motion';
import { useWebRTC } from '@/hooks/useWebRTC';
import { useAgent } from '@/hooks/useAgent';
import { useAuth } from '@/contexts/AuthContext';

const AgentTesting = () => {
  const { restaurant } = useAuth();
  const { agent } = useAgent(restaurant?.id || '');
  const [transcription, setTranscription] = useState<string>('');
  const [response, setResponse] = useState<string>('');
  const [isListening, setIsListening] = useState(false);
  const [isResponding, setIsResponding] = useState(false);

  const { 
    isConnected,
    isRecording,
    error,
    selectedVoice,
    isDataChannelReady,
    startRecording,
    stopRecording,
    initializeWebRTC,
    changeVoice
  } = useWebRTC(agent?.voice_id || 'alloy', agent);

  useEffect(() => {
    initializeWebRTC();
  }, [initializeWebRTC]);

  // Handle WebRTC events
  useEffect(() => {
    const handleEvent = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        console.log('Received WebRTC message:', data);
        
        if (data.type === 'transcription') {
          setTranscription(prev => prev + ' ' + data.text);
          setIsListening(true);
        } else if (data.type === 'response') {
          setResponse(prev => prev + ' ' + data.text);
          setIsResponding(true);
        } else if (data.type === 'transcription_end') {
          setIsListening(false);
        } else if (data.type === 'response_end') {
          setIsResponding(false);
        }
      } catch (err) {
        console.error('Error handling WebRTC message:', err);
      }
    };

    if (window.rtcDataChannel) {
      window.rtcDataChannel.addEventListener('message', handleEvent);
    }

    return () => {
      if (window.rtcDataChannel) {
        window.rtcDataChannel.removeEventListener('message', handleEvent);
      }
    };
  }, []);

  const getConnectionStatus = () => {
    if (!isConnected) return { text: 'Connecting...', color: 'yellow' };
    if (!isDataChannelReady) return { text: 'Establishing secure channel...', color: 'yellow' };
    return { text: 'Connected to OpenAI', color: 'green' };
  };

  const status = getConnectionStatus();

  return (
    <div className="bg-white shadow-sm rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="max-w-3xl mx-auto">
          <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
            Test Your AI Receptionist
          </h3>
          
          {/* Connection Status */}
          <div className="mb-4">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              status.color === 'green' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
            }`}>
              {status.text}
            </span>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{error}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Voice Selection */}
          <div className="mb-8">
            <h4 className="text-sm font-medium text-gray-700 mb-4">Select AI Voice</h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { id: 'alloy', name: 'Alloy', description: 'A neutral voice with balanced warmth and clarity' },
                { id: 'echo', name: 'Echo', description: 'A warm, natural voice with a friendly tone' },
                { id: 'fable', name: 'Fable', description: 'An authoritative voice with a touch of wisdom' },
                { id: 'onyx', name: 'Onyx', description: 'A deep, resonant voice with gravitas' },
                { id: 'nova', name: 'Nova', description: 'An energetic, upbeat voice with youthful characteristics' },
                { id: 'shimmer', name: 'Shimmer', description: 'A clear, professional voice with a gentle presence' }
              ].map((voice) => (
                <button
                  key={voice.id}
                  onClick={() => changeVoice(voice.id)}
                  className={`relative rounded-lg border p-4 text-left ${
                    selectedVoice === voice.id
                      ? 'border-blue-500 ring-2 ring-blue-500'
                      : 'border-gray-300'
                  }`}
                >
                  <h3 className="text-sm font-medium text-gray-900">{voice.name}</h3>
                  <p className="mt-1 text-xs text-gray-500">{voice.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Recording Button */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              <button
                onClick={isRecording ? stopRecording : startRecording}
                disabled={!isConnected || !isDataChannelReady}
                className={`relative inline-flex items-center justify-center rounded-full w-16 h-16 ${
                  isRecording
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                } text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                  (!isConnected || !isDataChannelReady) ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isRecording ? (
                  <FaStop className="h-6 w-6" />
                ) : (
                  <FaMicrophone className="h-6 w-6" />
                )}
              </button>
              {isRecording && (
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-red-300"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              )}
            </div>
            <span className="ml-2 text-sm text-gray-500 self-center">
              {!isConnected || !isDataChannelReady 
                ? 'Waiting for connection...' 
                : isRecording 
                  ? 'Click to stop' 
                  : 'Click to start testing'}
            </span>
          </div>

          {/* Live Transcription */}
          <div className="mb-4">
            <div className="flex items-center mb-2">
              <h4 className="text-sm font-medium text-gray-700">Live Transcription</h4>
              {isListening && (
                <motion.div
                  className="ml-2 w-2 h-2 bg-blue-500 rounded-full"
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
              )}
            </div>
            <div className="bg-gray-50 rounded-lg p-4 min-h-[100px] text-gray-600">
              {transcription || 'Start speaking to see the transcription here...'}
            </div>
          </div>

          {/* AI Response */}
          <div>
            <div className="flex items-center mb-2">
              <h4 className="text-sm font-medium text-gray-700">AI Response</h4>
              {isResponding && (
                <motion.div
                  className="ml-2"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  <BiMessageSquareDots className="w-4 h-4 text-blue-500" />
                </motion.div>
              )}
            </div>
            <div className="bg-blue-50 rounded-lg p-4 min-h-[100px] text-gray-600">
              {response || 'AI responses will appear here...'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentTesting;
