import React from 'react';
import AgentConfigForm from '@/components/user/agent/AgentConfigForm';
import UserDashboardLayout from '@/components/user/dashboard/UserDashboardLayout';

const AgentSettingsPage = () => {
  return (
    <UserDashboardLayout>
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">AI Receptionist Settings</h1>
        <AgentConfigForm />
        <p>Last updated: {new Date().toISOString()}</p>
      </div>
    </UserDashboardLayout>
  );
};

export default AgentSettingsPage;
