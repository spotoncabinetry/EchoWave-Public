import React, { useEffect, useState, useCallback } from 'react';
import { FaMicrophone, FaStop } from 'react-icons/fa';
import { BiMessageSquareDots } from 'react-icons/bi';
import { motion } from 'framer-motion';
import { useWebRTC } from '@/hooks/useWebRTC';
import { useAgent } from '@/hooks/useAgent';
import { useAuth } from '@/contexts/AuthContext';
import { WebRTCMessage } from '@/types/webrtc';

const AgentTesting = () => {
  const { restaurant } = useAuth();
  const { agent } = useAgent(restaurant?.id || '');
  const [transcript, setTranscript] = useState<string>('');
  const [response, setResponse] = useState<string>('');
  const [status, setStatus] = useState<string>('Disconnected');

  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data) as WebRTCMessage;
      console.log('Received WebRTC message:', data);
      
      switch (data.type) {
        case 'transcript':
          setTranscript(prev => prev + ' ' + data.data.trim());
          break;
        case 'response':
          setResponse(prev => prev + ' ' + data.data.trim());
          break;
        case 'error':
          console.error('WebRTC error:', data.data);
          setStatus(`Error: ${data.data}`);
          break;
        default:
          console.log('Unknown message type:', data.type);
      }
    } catch (err) {
      console.error('Error parsing WebRTC message:', err);
    }
  }, []);

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
    setVoice
  } = useWebRTC(
    agent?.voice_id || 'alloy',
    'gpt-4o-mini-realtime-preview-2024-12-17',
    agent,
    handleMessage
  );

  useEffect(() => {
    if (isConnecting) {
      setStatus('Connecting...');
    } else if (isConnected) {
      setStatus('Connected');
    } else if (error) {
      setStatus(`Error: ${error.message}`);
    } else {
      setStatus('Disconnected');
    }
  }, [isConnecting, isConnected, error]);

  useEffect(() => {
    // Clear messages when connection changes
    if (!isConnected) {
      setTranscript('');
      setResponse('');
    }
  }, [isConnected]);

  useEffect(() => {
    const init = async () => {
      try {
        if (agent && !isConnected && !isConnecting) {
          await connect();
        }
      } catch (err) {
        console.error('Error initializing WebRTC:', err);
      }
    };

    init();
  }, [agent, isConnected, isConnecting, connect]);

  return (
    <div className="flex flex-col space-y-6 p-6 max-w-2xl mx-auto">
      <div className="flex flex-col items-center space-y-4">
        <h1 className="text-2xl font-bold">Agent Testing</h1>
        <div className="text-lg font-medium text-gray-600">
          {status}
        </div>
      </div>

      {/* Connection Status */}
      <div className="flex flex-col items-center justify-center space-y-6">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`w-24 h-24 rounded-full flex items-center justify-center ${
            isListening ? 'bg-red-500' : 'bg-blue-500'
          } text-white`}
          onClick={isListening ? stopListening : startListening}
          disabled={!isConnected}
        >
          {isListening ? (
            <FaStop className="w-8 h-8" />
          ) : (
            <FaMicrophone className="w-8 h-8" />
          )}
        </motion.button>
        <div className="text-sm text-gray-500">
          {isListening ? 'Click to stop' : 'Click to start'}
        </div>
      </div>

      {/* Agent Configuration */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Agent Configuration</h2>
        <div className="space-y-2">
          <div>
            <span className="font-medium">Voice:</span> {selectedVoice}
          </div>
          <div>
            <span className="font-medium">Model:</span> {agent?.model || 'gpt-4o-mini-realtime-preview-2024-12-17'}
          </div>
          <div>
            <span className="font-medium">Greeting:</span> {agent?.agent_greeting || 'Hello! Welcome to our restaurant'}
          </div>
        </div>
      </div>

      {/* Conversation */}
      {(transcript || response) && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Conversation</h2>
          {transcript && (
            <div className="mb-4">
              <div className="font-medium mb-2">You:</div>
              <div className="text-gray-700">{transcript}</div>
            </div>
          )}
          {response && (
            <div>
              <div className="font-medium mb-2">Agent:</div>
              <div className="text-gray-700">{response}</div>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error.message}
        </div>
      )}
    </div>
  );
};

export default AgentTesting;
