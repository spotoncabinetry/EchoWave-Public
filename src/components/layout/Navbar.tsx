import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';

export default function Navbar() {
  const { user, signOut, loading } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/auth/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleNavigation = (path: string) => {
    console.log(' Navigating to:', path);
    router.push(path);
  };

  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div 
              onClick={() => handleNavigation('/')}
              className="flex-shrink-0 flex items-center cursor-pointer"
            >
              <span className="text-2xl font-bold text-blue-600">EchoWave</span>
            </div>
          </div>
          
          <div className="flex items-center">
            {!loading && (
              <>
                {user ? (
                  <div className="ml-3 relative">
                    <div className="flex items-center space-x-4">
                      <span className="text-gray-700">{user.email}</span>
                      <button
                        onClick={handleSignOut}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => handleNavigation('/auth/login')}
                      className="text-gray-700 hover:text-gray-900"
                    >
                      Log in
                    </button>
                    <button
                      onClick={() => handleNavigation('/auth/signup')}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      Sign up
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
