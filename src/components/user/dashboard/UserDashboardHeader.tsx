import { useEffect, useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '../../../types/supabase';

interface RestaurantInfo {
  name: string | null;
}

export default function UserDashboardHeader() {
  const { user, signOut } = useAuth();
  const [restaurant, setRestaurant] = useState<RestaurantInfo | null>(null);
  const supabase = createClientComponentClient<Database>();

  useEffect(() => {
    if (!user) return;

    // Get restaurant name from user metadata
    const restaurantName = user.user_metadata?.restaurantName;
    if (restaurantName) {
      setRestaurant({ name: restaurantName });
    }
  }, [user]);

  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-8">
            {/* Logo */}
            <div className="flex-shrink-0">
              <span className="text-2xl font-bold text-blue-600">EchoWave</span>
            </div>
            
            {/* Divider */}
            {restaurant?.name && (
              <div className="h-6 w-px bg-gray-200" />
            )}
            
            {/* Restaurant Name */}
            {restaurant?.name && (
              <div className="flex items-center">
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500">Restaurant</span>
                  <span className="text-lg font-semibold text-gray-900">
                    {restaurant.name}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* User Info & Sign Out */}
          <div className="flex items-center space-x-6">
            <div className="flex flex-col items-end">
              <span className="text-xs text-gray-500">Signed in as</span>
              <span className="text-sm text-gray-700">{user?.email}</span>
            </div>
            <button
              onClick={() => signOut()}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
