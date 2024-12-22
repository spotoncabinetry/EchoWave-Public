import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login?message=Please sign in to access the dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect due to useEffect
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Welcome to Your Dashboard
          </h1>
          <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 sm:mt-4">
            Manage your restaurant and view analytics
          </p>
        </div>
        
        <div className="mt-12 grid gap-5 max-w-lg mx-auto lg:grid-cols-3 lg:max-w-none">
          {/* Add your dashboard content here */}
          <div className="flex flex-col rounded-lg shadow-lg overflow-hidden">
            <div className="flex-1 bg-white p-6 flex flex-col justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-indigo-600">
                  Coming Soon
                </p>
                <div className="block mt-2">
                  <p className="text-xl font-semibold text-gray-900">
                    Dashboard Features
                  </p>
                  <p className="mt-3 text-base text-gray-500">
                    We're working on adding features to help you manage your restaurant effectively.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
