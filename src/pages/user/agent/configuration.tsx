import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import AgentLayout from '@/components/user/agent/AgentLayout';

const Configuration = () => {
  const [greeting, setGreeting] = useState('');
  const [storeHours, setStoreHours] = useState('');
  const [dailySpecials, setDailySpecials] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('agents')
          .select('agent_greeting, agent_store_hours, agent_daily_specials, updated_at')
          .single();

        if (error) {
          console.error('Error fetching agent config:', error);
        } else if (data) {
          setGreeting(data.agent_greeting || '');
          setStoreHours(data.agent_store_hours || '');
          setDailySpecials(data.agent_daily_specials || '');
          setLastUpdated(data.updated_at);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, []);

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
          updated_at: new Date().toISOString(),
        })
        .eq('id', '00000000-0000-0000-0000-000000000000')
        .single();

      if (error) {
        console.error('Error saving agent config:', error);
      } else {
        setLastUpdated(new Date().toISOString());
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AgentLayout>
      <div className="bg-white shadow-sm rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
            AI Receptionist Configuration
          </h3>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Greeting Text
              </label>
              <div className="mt-1">
                <textarea
                  rows={3}
                  value={greeting}
                  onChange={(e) => setGreeting(e.target.value)}
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  placeholder="Enter the greeting message for your AI receptionist..."
                />
              </div>
              <p className="mt-2 text-sm text-gray-500">
                This is the first message customers will hear when they call.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Store Hours
              </label>
              <div className="mt-1">
                <textarea
                  rows={3}
                  value={storeHours}
                  onChange={(e) => setStoreHours(e.target.value)}
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  placeholder="Enter your business hours..."
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Daily Specials
              </label>
              <div className="mt-1">
                <textarea
                  rows={3}
                  value={dailySpecials}
                  onChange={(e) => setDailySpecials(e.target.value)}
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  placeholder="Enter your daily specials..."
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-4">
              <div className="text-sm text-gray-500">
                {lastUpdated && `Last updated: ${new Date(lastUpdated).toLocaleString()}`}
              </div>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Configuration'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AgentLayout>
  );
};

export default Configuration;
