import React, { useEffect } from 'react';
import { FaMicrophone, FaStop } from 'react-icons/fa';
import { useWebRTC } from '@/hooks/useWebRTC';

const AgentTesting = () => {
  const { 
    isConnected,
    isRecording, 
    error,
    transcripts,
    availableVoices,
    selectedVoice,
    startRecording,
    stopRecording,
    initializeWebRTC,
    changeVoice
  } = useWebRTC();

  useEffect(() => {
    // Initialize WebRTC connection when component mounts
    initializeWebRTC();
  }, [initializeWebRTC]);

  const toggleRecording = async () => {
    if (!isRecording) {
      await startRecording();
    } else {
      await stopRecording();
    }
  };

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
              isConnected ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
            }`}>
              {isConnected ? 'Connected to OpenAI' : 'Connecting...'}
            </span>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 rounded-md">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Voice Selection */}
          <div className="mb-6">
            <label htmlFor="voice-select" className="block text-sm font-medium text-gray-700 mb-2">
              Select AI Voice
            </label>
            <div className="grid grid-cols-3 gap-4">
              {availableVoices.map((voice) => (
                <button
                  key={voice.id}
                  onClick={() => changeVoice(voice.id)}
                  className={`
                    p-4 rounded-lg border-2 transition-all
                    ${selectedVoice === voice.id 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-blue-200'}
                  `}
                  disabled={isRecording}
                >
                  <h4 className="font-medium text-gray-900 mb-1">{voice.name}</h4>
                  <p className="text-sm text-gray-500">{voice.description}</p>
                  {voice.preview_url && (
                    <button 
                      className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Play preview audio
                        const audio = new Audio(voice.preview_url);
                        audio.play();
                      }}
                    >
                      ▶ Preview
                    </button>
                  )}
                </button>
              ))}
            </div>
          </div>
          
          {/* Voice Testing Section */}
          <div className="mt-6 bg-gray-50 rounded-lg p-6">
            <div className="flex items-center justify-center mb-6">
              <button
                onClick={toggleRecording}
                disabled={!isConnected}
                className={`
                  p-6 rounded-full transition-colors duration-200
                  ${!isConnected ? 'bg-gray-400' :
                    isRecording ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}
                  text-white shadow-lg
                  ${!isConnected ? 'cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                {isRecording ? (
                  <FaStop className="w-8 h-8" />
                ) : (
                  <FaMicrophone className="w-8 h-8" />
                )}
              </button>
            </div>
            
            <p className="text-center text-sm text-gray-600 mb-8">
              {!isConnected ? 'Connecting to OpenAI...' :
                isRecording ? 'Recording... Click to stop' : 'Click to start testing'}
            </p>

            {/* Transcription Display */}
            <div className="bg-white rounded-lg shadow p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Live Transcription</h4>
              <div className="min-h-[200px] bg-gray-50 rounded-md p-4 overflow-y-auto">
                {transcripts.length > 0 ? (
                  transcripts.map((line, index) => (
                    <p key={index} className="text-gray-600 mb-2">{line}</p>
                  ))
                ) : (
                  <p className="text-gray-400 italic text-center mt-8">
                    Start speaking to see the transcription here...
                  </p>
                )}
              </div>
            </div>

            {/* Response Preview */}
            <div className="mt-6 bg-white rounded-lg shadow p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">AI Response Preview</h4>
              <div className="min-h-[100px] bg-gray-50 rounded-md p-4">
                <p className="text-gray-400 italic text-center mt-4">
                  AI response will appear here...
                </p>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-6 border-t border-gray-200 pt-6">
            <h4 className="text-sm font-medium text-gray-900 mb-2">How to Test</h4>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
              <li>Select your preferred AI voice from the options above</li>
              <li>Wait for the OpenAI connection to be established</li>
              <li>Click the microphone button to start recording</li>
              <li>Speak naturally as if you were calling the restaurant</li>
              <li>Your speech will be transcribed in real-time</li>
              <li>The AI will respond based on your configuration settings</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentTesting;
