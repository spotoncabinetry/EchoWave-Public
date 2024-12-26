import React, { useState } from 'react';
import AgentLayout from '@/components/user/agent/AgentLayout';
import { FaMicrophone, FaStop } from 'react-icons/fa';

const Testing = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState<string[]>([]);

  const toggleRecording = async () => {
    if (!isRecording) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // TODO: Implement recording logic
        setIsRecording(true);
      } catch (error) {
        console.error('Error accessing microphone:', error);
      }
    } else {
      // TODO: Stop recording logic
      setIsRecording(false);
    }
  };

  return (
    <AgentLayout>
      <div className="bg-white shadow-sm rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="max-w-3xl mx-auto">
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
              Test Your AI Receptionist
            </h3>
            
            {/* Voice Testing Section */}
            <div className="mt-6 bg-gray-50 rounded-lg p-6">
              <div className="flex items-center justify-center mb-6">
                <button
                  onClick={toggleRecording}
                  className={`
                    p-6 rounded-full transition-colors duration-200
                    ${isRecording ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}
                    text-white shadow-lg
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
                {isRecording ? 'Recording... Click to stop' : 'Click to start testing'}
              </p>

              {/* Transcription Display */}
              <div className="bg-white rounded-lg shadow p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Live Transcription</h4>
                <div className="min-h-[200px] bg-gray-50 rounded-md p-4">
                  {transcript.length > 0 ? (
                    transcript.map((line, index) => (
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
                <li>Click the microphone button to start recording</li>
                <li>Speak naturally as if you were calling the restaurant</li>
                <li>Your speech will be transcribed in real-time</li>
                <li>The AI will respond based on your configuration settings</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </AgentLayout>
  );
};

export default Testing;
