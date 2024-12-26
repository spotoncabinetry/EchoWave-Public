import React, { useState, useEffect } from 'react';
import AgentLayout from '@/components/user/agent/AgentLayout';
import { FaPhoneAlt, FaCircle } from 'react-icons/fa';

interface Call {
  id: string;
  phoneNumber: string;
  startTime: string;
  status: 'active' | 'completed';
  transcription: string[];
}

const LiveCalls = () => {
  const [activeCalls, setActiveCalls] = useState<Call[]>([]);
  const [callHistory, setCallHistory] = useState<Call[]>([]);

  // Simulated data for demonstration
  useEffect(() => {
    // TODO: Replace with real-time data from your backend
    const mockActiveCalls: Call[] = [
      {
        id: '1',
        phoneNumber: '+61 2 1234 5678',
        startTime: new Date().toISOString(),
        status: 'active',
        transcription: [
          'Customer: Hi, I\'d like to make a reservation',
          'AI: Hello! I\'d be happy to help you with a reservation. What date and time were you thinking of?',
        ],
      },
    ];

    setActiveCalls(mockActiveCalls);
  }, []);

  return (
    <AgentLayout>
      <div className="space-y-6">
        {/* Active Calls Section */}
        <div className="bg-white shadow-sm rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium leading-6 text-gray-900">
                Active Calls
              </h3>
              <div className="flex items-center text-sm text-green-600">
                <FaCircle className="w-2 h-2 mr-2" />
                {activeCalls.length} active call(s)
              </div>
            </div>

            {activeCalls.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No active calls at the moment
              </p>
            ) : (
              <div className="space-y-4">
                {activeCalls.map((call) => (
                  <div
                    key={call.id}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="bg-green-100 p-2 rounded-lg">
                          <FaPhoneAlt className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {call.phoneNumber}
                          </p>
                          <p className="text-sm text-gray-500">
                            Started:{' '}
                            {new Date(call.startTime).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Live
                      </span>
                    </div>

                    {/* Live Transcription */}
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                      {call.transcription.map((line, index) => (
                        <p
                          key={index}
                          className="text-sm text-gray-600 leading-relaxed"
                        >
                          {line}
                        </p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Call Statistics */}
        <div className="bg-white shadow-sm rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
              Today's Statistics
            </h3>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-500">Total Calls</p>
                <p className="mt-1 text-3xl font-semibold text-gray-900">12</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-500">
                  Average Duration
                </p>
                <p className="mt-1 text-3xl font-semibold text-gray-900">2:30</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-500">
                  Success Rate
                </p>
                <p className="mt-1 text-3xl font-semibold text-gray-900">95%</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AgentLayout>
  );
};

export default LiveCalls;
