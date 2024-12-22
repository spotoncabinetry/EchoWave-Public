import { ReactNode } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import DashboardSidebar from './DashboardSidebar';
import DashboardHeader from './DashboardHeader';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function UserDashboardLayout({ children }: DashboardLayoutProps) {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-100">
      <DashboardHeader />
      
      <div className="flex">
        <DashboardSidebar />
        
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
