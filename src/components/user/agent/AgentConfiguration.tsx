import React, { useState } from 'react';
import { Switch } from '@headlessui/react';
import type { Database } from '@/lib/supabase/types/database.types';

type Agent = Database['public']['Tables']['agents']['Row'];

interface AgentConfigurationProps {
  agent: Agent | null;
  onUpdate: (updates: Partial<Agent>) => Promise<void>;
}

const AgentConfiguration: React.FC<AgentConfigurationProps> = ({ agent, onUpdate }) => {
  const [isSaving, setIsSaving] = useState(false);

  if (!agent) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="text-gray-500">Loading agent configuration...</div>
      </div>
    );
  }

  const handleMenuToggle = async (enabled: boolean) => {
    setIsSaving(true);
    try {
      await onUpdate({
        menu_enabled: enabled
      });
    } catch (error) {
      console.error('Error updating menu settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTranscriptionToggle = async (enabled: boolean) => {
    setIsSaving(true);
    try {
      await onUpdate({
        transcription: {
          enabled,
          language: agent.language || 'en-AU'
        }
      });
    } catch (error) {
      console.error('Error updating transcription settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLanguageChange = async (language: string) => {
    setIsSaving(true);
    try {
      await onUpdate({ language });
    } catch (error) {
      console.error('Error updating language settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleVoiceChange = async (voice: string) => {
    setIsSaving(true);
    try {
      await onUpdate({ voice_id: voice });
    } catch (error) {
      console.error('Error updating voice settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleGreetingChange = async (greeting: string) => {
    setIsSaving(true);
    try {
      await onUpdate({ agent_greeting: greeting });
    } catch (error) {
      console.error('Error updating greeting:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleStoreHoursChange = async (hours: string) => {
    setIsSaving(true);
    try {
      await onUpdate({ agent_store_hours: hours });
    } catch (error) {
      console.error('Error updating store hours:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDailySpecialsChange = async (specials: string) => {
    setIsSaving(true);
    try {
      await onUpdate({ agent_daily_specials: specials });
    } catch (error) {
      console.error('Error updating daily specials:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium leading-6 text-gray-900">Agent Configuration</h3>
        <p className="mt-1 text-sm text-gray-500">
          Configure how your AI agent interacts with customers
        </p>
      </div>

      <div className="space-y-4">
        {/* Agent Basic Settings */}
        <div className="space-y-4">
          <div>
            <label htmlFor="greeting" className="block text-sm font-medium text-gray-700">
              Greeting Message
            </label>
            <textarea
              id="greeting"
              rows={2}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              value={agent.agent_greeting}
              onChange={(e) => handleGreetingChange(e.target.value)}
              placeholder="G'day! How can I help you today?"
            />
          </div>

          <div>
            <label htmlFor="storeHours" className="block text-sm font-medium text-gray-700">
              Store Hours
            </label>
            <textarea
              id="storeHours"
              rows={2}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              value={agent.agent_store_hours}
              onChange={(e) => handleStoreHoursChange(e.target.value)}
              placeholder="We're open Monday to Friday, 9 AM to 9 PM"
            />
          </div>

          <div>
            <label htmlFor="dailySpecials" className="block text-sm font-medium text-gray-700">
              Daily Specials
            </label>
            <textarea
              id="dailySpecials"
              rows={2}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              value={agent.agent_daily_specials}
              onChange={(e) => handleDailySpecialsChange(e.target.value)}
              placeholder="Today's special: Aussie burger with beetroot!"
            />
          </div>
        </div>

        {/* Menu Integration */}
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium text-gray-900">Menu Integration</h4>
            <p className="text-sm text-gray-500">Allow the agent to discuss menu items</p>
          </div>
          <Switch
            checked={agent.menu_enabled}
            onChange={handleMenuToggle}
            className={`${
              agent.menu_enabled ? 'bg-blue-600' : 'bg-gray-200'
            } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
          >
            <span
              className={`${
                agent.menu_enabled ? 'translate-x-5' : 'translate-x-0'
              } pointer-events-none relative inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
            />
          </Switch>
        </div>

        {/* Language Settings */}
        <div>
          <label htmlFor="language" className="block text-sm font-medium text-gray-700">
            Language
          </label>
          <select
            id="language"
            name="language"
            className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
            value={agent.language || 'en-AU'}
            onChange={(e) => handleLanguageChange(e.target.value)}
          >
            <option value="en-AU">English (Australia)</option>
            <option value="en-US">English (United States)</option>
            <option value="en-GB">English (United Kingdom)</option>
          </select>
        </div>

        {/* Voice Settings */}
        <div>
          <label htmlFor="voice" className="block text-sm font-medium text-gray-700">
            AI Voice
          </label>
          <select
            id="voice"
            name="voice"
            className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
            value={agent.voice_id || 'alloy'}
            onChange={(e) => handleVoiceChange(e.target.value)}
          >
            <option value="alloy">Alloy</option>
            <option value="echo">Echo</option>
            <option value="fable">Fable</option>
            <option value="onyx">Onyx</option>
            <option value="nova">Nova</option>
            <option value="shimmer">Shimmer</option>
          </select>
        </div>
      </div>

      {isSaving && (
        <div className="fixed bottom-0 right-0 mb-4 mr-4">
          <div className="rounded-md bg-blue-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-blue-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-blue-800">Saving changes...</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentConfiguration;
