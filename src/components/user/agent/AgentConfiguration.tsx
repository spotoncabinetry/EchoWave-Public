import React, { useState } from 'react';
import { Switch } from '@headlessui/react';
import type { Database } from '@/lib/supabase/types/database.types';

type Agent = Database['public']['Tables']['agents']['Row'];

interface AgentConfigurationProps {
  agent: Agent;
  onUpdate: (updates: Partial<Agent>) => Promise<void>;
}

const AgentConfiguration: React.FC<AgentConfigurationProps> = ({ agent, onUpdate }) => {
  const [isSaving, setIsSaving] = useState(false);

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
          ...agent.transcription,
          enabled
        } as any
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
      await onUpdate({
        transcription: {
          ...agent.transcription,
          language
        } as any
      });
    } catch (error) {
      console.error('Error updating language settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleVoiceChange = async (voice: string) => {
    setIsSaving(true);
    try {
      await onUpdate({
        ai_response: {
          ...agent.ai_response,
          voice
        } as any
      });
    } catch (error) {
      console.error('Error updating voice settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 bg-white shadow-sm rounded-lg p-6">
      {/* Menu Integration */}
      <div>
        <h3 className="text-lg font-medium text-gray-900">Menu Integration</h3>
        <div className="mt-2 max-w-xl text-sm text-gray-500">
          <p>Enable this to allow the AI to access and discuss your menu items.</p>
        </div>
        <div className="mt-5">
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
              >
                <span
                  className={`${
                    agent.menu_enabled ? 'opacity-0 duration-100 ease-out' : 'opacity-100 duration-200 ease-in'
                  } absolute inset-0 flex h-full w-full items-center justify-center transition-opacity`}
                  aria-hidden="true"
                >
                  <svg className="h-3 w-3 text-gray-400" fill="none" viewBox="0 0 12 12">
                    <path
                      d="M4 8l2-2m0 0l2-2M6 6L4 4m2 2l2 2"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <span
                  className={`${
                    agent.menu_enabled ? 'opacity-100 duration-200 ease-in' : 'opacity-0 duration-100 ease-out'
                  } absolute inset-0 flex h-full w-full items-center justify-center transition-opacity`}
                  aria-hidden="true"
                >
                  <svg className="h-3 w-3 text-blue-600" fill="currentColor" viewBox="0 0 12 12">
                    <path d="M3.707 5.293a1 1 0 00-1.414 1.414l1.414-1.414zM5 8l-.707.707a1 1 0 001.414 0L5 8zm4.707-3.293a1 1 0 00-1.414-1.414l1.414 1.414zm-7.414 2l2 2 1.414-1.414-2-2-1.414 1.414zm3.414 2l4-4-1.414-1.414-4 4 1.414 1.414z" />
                  </svg>
                </span>
              </span>
            </Switch>
          </div>
        </div>
      </div>

      {/* Transcription Settings */}
      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-lg font-medium text-gray-900">Transcription Settings</h3>
        <div className="mt-2 max-w-xl text-sm text-gray-500">
          <p>Configure how the AI processes and understands customer speech.</p>
        </div>
        <div className="mt-5 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900">Transcription</h4>
              <p className="text-sm text-gray-500">Enable call transcription</p>
            </div>
            <Switch
              checked={(agent.transcription as any)?.enabled || false}
              onChange={handleTranscriptionToggle}
              className={`${
                (agent.transcription as any)?.enabled ? 'bg-blue-600' : 'bg-gray-200'
              } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
            >
              <span
                className={`${
                  (agent.transcription as any)?.enabled ? 'translate-x-5' : 'translate-x-0'
                } pointer-events-none relative inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
              />
            </Switch>
          </div>

          <div>
            <label htmlFor="language" className="block text-sm font-medium text-gray-700">
              Language
            </label>
            <select
              id="language"
              name="language"
              className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
              value={(agent.transcription as any)?.language || 'en-AU'}
              onChange={(e) => handleLanguageChange(e.target.value)}
            >
              <option value="en-AU">English (Australia)</option>
              <option value="en-US">English (United States)</option>
              <option value="en-GB">English (United Kingdom)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Voice Settings */}
      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-lg font-medium text-gray-900">AI Voice Settings</h3>
        <div className="mt-2 max-w-xl text-sm text-gray-500">
          <p>Choose how your AI agent sounds when speaking to customers.</p>
        </div>
        <div className="mt-5">
          <label htmlFor="voice" className="block text-sm font-medium text-gray-700">
            AI Voice
          </label>
          <select
            id="voice"
            name="voice"
            className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
            value={(agent.ai_response as any)?.voice || 'alloy'}
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

      {/* Test Results */}
      {agent.test_error_message && (
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-medium text-gray-900">Last Test Results</h3>
          <div className="mt-2">
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error during test</h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{agent.test_error_message}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-500">
            <p>Test duration: {agent.test_duration_seconds} seconds</p>
            <p>Last tested: {new Date(agent.last_test_at || '').toLocaleString()}</p>
          </div>
        </div>
      )}
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
