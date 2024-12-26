import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FaCog, FaMicrophone, FaPhoneAlt } from 'react-icons/fa';

const AgentLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const currentPath = router.pathname;

  const tabs = [
    {
      name: 'Configuration',
      href: '/user/agent/configuration',
      icon: <FaCog className="w-5 h-5" />,
    },
    {
      name: 'Testing',
      href: '/user/agent/testing',
      icon: <FaMicrophone className="w-5 h-5" />,
    },
    {
      name: 'Live Calls',
      href: '/user/agent/live-calls',
      icon: <FaPhoneAlt className="w-5 h-5" />,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => {
                const isActive = currentPath === tab.href;
                return (
                  <Link
                    key={tab.name}
                    href={tab.href}
                    className={`
                      group inline-flex items-center px-4 py-4 border-b-2 font-medium text-sm
                      ${
                        isActive
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }
                    `}
                  >
                    <span className="mr-2">{tab.icon}</span>
                    {tab.name}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="mt-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentLayout;
