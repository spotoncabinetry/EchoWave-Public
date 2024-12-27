import React, { useEffect, useState, useCallback } from 'react';
import { FaMicrophone, FaStop } from 'react-icons/fa';
import { BiMessageSquareDots } from 'react-icons/bi';
import { motion } from 'framer-motion';
import { useWebRTC } from '@/hooks/useWebRTC';
import { useAgent } from '@/hooks/useAgent';
import { useAuth } from '@/contexts/AuthContext';

const AgentTesting = () => {
  const { restaurant } = useAuth();
  const { agent } = useAgent(restaurant?.id || '');
  const { 
    error, 
    isConnected, 
    isConnecting,
    isListening,
    selectedVoice,
    isDataChannelReady,
    startListening, 
    stopListening, 
    connect,
    setVoice,
    model
  } = useWebRTC(
    agent?.voice_id || 'alloy', 
    'gpt-4o-mini-realtime-preview-2024-12-17', 
    agent,
    useCallback((event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        console.log('Received WebRTC message:', data);
        
        if (data.type === 'transcript') {
          setTranscription(prev => (prev + ' ' + data.text).trim());
        } else if (data.type === 'response') {
          setResponse(prev => (prev + ' ' + data.text).trim());
          setIsResponding(true);
        } else if (data.type === 'response_end') {
          setIsResponding(false);
        }
      } catch (error) {
        console.error('Error handling WebRTC message:', error);
      }
    }, [])
  );

  const [transcription, setTranscription] = useState<string>('');
  const [response, setResponse] = useState<string>('');
  const [isResponding, setIsResponding] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        await connect();
      } catch (err) {
        console.error('Failed to initialize WebRTC:', err);
      }
    };
    init();
  }, [connect]);

  const getConnectionStatus = () => {
    if (error) return { text: error, color: 'red' };
    if (isConnecting) return { text: 'Connecting...', color: 'yellow' };
    if (!isConnected) return { text: 'Not connected', color: 'red' };
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
              status.color === 'green' ? 'bg-green-100 text-green-800' : 
              status.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {status.text}
            </span>
          </div>

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
                  onClick={() => setVoice(voice.id, 'gpt-4o-mini-realtime-preview-2024-12-17')}
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

          {/* Microphone Button */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              <motion.button
                onClick={isListening ? stopListening : startListening}
                disabled={!isConnected || !isDataChannelReady}
                className={`relative inline-flex items-center justify-center rounded-full w-16 h-16 ${
                  isListening
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                } text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                  (!isConnected || !isDataChannelReady) ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                whileTap={{ scale: 0.95 }}
                animate={isListening ? { scale: [1, 1.1, 1] } : {}}
                transition={{ repeat: isListening ? Infinity : 0, duration: 1.5 }}
              >
                {isListening ? <FaStop className="h-6 w-6" /> : <FaMicrophone className="h-6 w-6" />}
              </motion.button>
              {isListening && (
                <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-sm text-gray-500">
                  Click to stop
                </span>
              )}
            </div>
          </div>

          {/* Live Transcription */}
          <div className="mb-8">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Live Transcription</h4>
            <div className="bg-gray-50 rounded-lg p-4 min-h-[100px]">
              {transcription || 'Start speaking to see the transcription here...'}
            </div>
          </div>

          {/* AI Response */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">AI Response</h4>
            <div className="bg-blue-50 rounded-lg p-4 min-h-[100px] relative">
              {response || 'AI responses will appear here...'}
              {isResponding && (
                <div className="absolute bottom-2 right-2">
                  <BiMessageSquareDots className="h-5 w-5 text-blue-500 animate-pulse" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentTesting;
