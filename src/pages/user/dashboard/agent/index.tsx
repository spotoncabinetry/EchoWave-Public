import { useState } from 'react';
import UserDashboardLayout from '@/components/user/dashboard/UserDashboardLayout';
import { Tab } from '@headlessui/react';
import { FaCog, FaMicrophone, FaPhoneAlt } from 'react-icons/fa';
import AgentConfiguration from '@/components/user/agent/AgentConfiguration';
import AgentTesting from '@/components/user/agent/AgentTesting';
import AgentLiveCalls from '@/components/user/agent/AgentLiveCalls';
import { useAuth } from '@/contexts/AuthContext';
import { useAgent } from '@/hooks/useAgent';

const AgentDashboard = () => {
  const [selectedTab, setSelectedTab] = useState(0);
  const { restaurant } = useAuth();
  const { agent, loading, error, updateAgent } = useAgent(restaurant?.id || '');

  const tabs = [
    {
      name: 'Configuration',
      icon: <FaCog className="w-5 h-5" />,
      component: <AgentConfiguration agent={agent} onUpdate={updateAgent} />,
    },
    {
      name: 'Testing',
      icon: <FaMicrophone className="w-5 h-5" />,
      component: <AgentTesting />,
    },
    {
      name: 'Live Calls',
      icon: <FaPhoneAlt className="w-5 h-5" />,
      component: <AgentLiveCalls />,
    },
  ];

  if (!restaurant) {
    return (
      <UserDashboardLayout>
        <div className="py-6">
          <div className="text-center text-gray-500">
            Please set up your restaurant profile first
          </div>
        </div>
      </UserDashboardLayout>
    );
  }

  return (
    <UserDashboardLayout>
      <div className="py-6">
        <Tab.Group selectedIndex={selectedTab} onChange={setSelectedTab}>
          <Tab.List className="flex space-x-4 border-b border-gray-200">
            {tabs.map((tab) => (
              <Tab
                key={tab.name}
                className={({ selected }) =>
                  `group inline-flex items-center px-4 py-2 border-b-2 font-medium text-sm
                  ${
                    selected
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`
                }
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
              </Tab>
            ))}
          </Tab.List>

          <Tab.Panels className="mt-4">
            {tabs.map((tab, idx) => (
              <Tab.Panel key={idx} className={idx === selectedTab ? '' : 'hidden'}>
                {tab.component}
              </Tab.Panel>
            ))}
          </Tab.Panels>
        </Tab.Group>
      </div>
    </UserDashboardLayout>
  );
};

export default AgentDashboard;
