import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Tab } from '@headlessui/react';
import { FaMicrophone, FaPhoneAlt, FaStop } from 'react-icons/fa';

interface Call {
  id: string;
  status: 'active' | 'completed';
  phoneNumber: string;
  startTime: string;
  transcription: string[];
}

const AgentConfigForm = () => {
  const [greeting, setGreeting] = useState('');
  const [storeHours, setStoreHours] = useState('');
  const [dailySpecials, setDailySpecials] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [activeCalls, setActiveCalls] = useState<Call[]>([]);
  const [selectedTab, setSelectedTab] = useState(0);

  // Fetch initial configuration
  useEffect(() => {
    const fetchConfig = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('agents')
          .select('agent_greeting, agent_store_hours, agent_daily_specials')
          .single();

        if (error) {
          console.error('Error fetching agent config:', error);
        } else if (data) {
          setGreeting(data.agent_greeting || '');
          setStoreHours(data.agent_store_hours || '');
          setDailySpecials(data.agent_daily_specials || '');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, []);

  // Handle configuration save
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase
        .from('agents')
        .update({
          agent_greeting: greeting,
          agent_store_hours: storeHours,
          agent_daily_specials: dailySpecials,
        })
        .eq('id', '00000000-0000-0000-0000-000000000000')
        .single();

      if (error) {
        console.error('Error saving agent config:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle voice test recording
  const toggleRecording = () => {
    setIsRecording(!isRecording);
    // TODO: Implement microphone recording logic
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Tab.Group selectedIndex={selectedTab} onChange={setSelectedTab}>
        <Tab.List className="flex space-x-4 border-b mb-6">
          <Tab className={({ selected }) =>
            `px-4 py-2 font-medium ${
              selected ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'
            }`
          }>
            Configuration
          </Tab>
          <Tab className={({ selected }) =>
            `px-4 py-2 font-medium ${
              selected ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'
            }`
          }>
            Testing
          </Tab>
          <Tab className={({ selected }) =>
            `px-4 py-2 font-medium ${
              selected ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'
            }`
          }>
            Live Calls
          </Tab>
        </Tab.List>

        <Tab.Panels>
          {/* Configuration Panel */}
          <Tab.Panel>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Greeting Text</label>
                <textarea
                  value={greeting}
                  onChange={(e) => setGreeting(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Store Hours</label>
                <textarea
                  value={storeHours}
                  onChange={(e) => setStoreHours(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Daily Specials</label>
                <textarea
                  value={dailySpecials}
                  onChange={(e) => setDailySpecials(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  rows={3}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {loading ? 'Saving...' : 'Save Configuration'}
              </button>
            </form>
          </Tab.Panel>

          {/* Testing Panel */}
          <Tab.Panel>
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium mb-4">Voice Testing</h3>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={toggleRecording}
                    className={`p-4 rounded-full ${
                      isRecording ? 'bg-red-600' : 'bg-blue-600'
                    } text-white hover:opacity-90`}
                  >
                    {isRecording ? <FaStop /> : <FaMicrophone />}
                  </button>
                  <span className="text-sm text-gray-600">
                    {isRecording ? 'Recording... Click to stop' : 'Click to start testing'}
                  </span>
                </div>
                <div className="mt-4 p-4 bg-gray-50 rounded-md">
                  <h4 className="text-sm font-medium mb-2">Transcription</h4>
                  <p className="text-gray-600 italic">No transcription available</p>
                </div>
              </div>
            </div>
          </Tab.Panel>

          {/* Live Calls Panel */}
          <Tab.Panel>
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium mb-4">Active Calls</h3>
                {activeCalls.length === 0 ? (
                  <p className="text-gray-600">No active calls</p>
                ) : (
                  <div className="space-y-4">
                    {activeCalls.map((call) => (
                      <div key={call.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <FaPhoneAlt className="text-green-600" />
                            <span className="font-medium">{call.phoneNumber}</span>
                          </div>
                          <span className="text-sm text-gray-600">{call.startTime}</span>
                        </div>
                        <div className="bg-gray-50 p-3 rounded">
                          {call.transcription.map((line, i) => (
                            <p key={i} className="text-sm">{line}</p>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
};

export default AgentConfigForm;
