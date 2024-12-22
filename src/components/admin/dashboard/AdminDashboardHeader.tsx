import { useAuth } from '../../../contexts/AuthContext';

export default function AdminDashboardHeader() {
  const { user, signOut } = useAuth();

  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <span className="text-2xl font-bold text-red-600">EchoWave Admin</span>
            </div>
          </div>
          
          <div className="flex items-center">
            <div className="ml-3 relative">
              <div className="flex items-center space-x-4">
                <span className="text-gray-700">{user?.email}</span>
                <button
                  onClick={() => signOut()}
                  className="text-gray-700 hover:text-gray-900"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
