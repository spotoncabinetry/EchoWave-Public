import { ReactNode } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import AdminDashboardSidebar from './AdminDashboardSidebar';
import AdminDashboardHeader from './AdminDashboardHeader';

interface AdminDashboardLayoutProps {
  children: ReactNode;
}

export default function AdminDashboardLayout({ children }: AdminDashboardLayoutProps) {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-100">
      <AdminDashboardHeader />
      
      <div className="flex">
        <AdminDashboardSidebar />
        
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
