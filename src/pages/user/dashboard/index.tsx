import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import UserDashboardLayout from '../../../components/user/dashboard/UserDashboardLayout';
import { createClient } from '../../../lib/supabase/client';
import { Database } from '../../../lib/supabase/types/database.types';
import { Session, SupabaseClient } from '@supabase/supabase-js';

interface RestaurantProfile {
  restaurant_name: string;
  phone_number: string;
  address: string;
}

export default function UserDashboardPage() {
  const [supabase] = useState<SupabaseClient<Database>>(() => createClient());
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<RestaurantProfile | null>(null);
  const [menuItemCount, setMenuItemCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Single useEffect for session initialization and auth state changes
  useEffect(() => {
    let mounted = true;

    // Initialize session and fetch data
    const initialize = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        
        // Only proceed if component is still mounted
        if (!mounted) return;

        if (!initialSession) {
          setLoading(false);
          router.push('/auth/login');
          return;
        }

        setSession(initialSession);
        await fetchUserData(initialSession);
      } catch (error) {
        if (mounted) {
          console.error('Error initializing:', error);
          setError('Failed to initialize session');
          setLoading(false);
        }
      }
    };

    initialize();

    // Set up auth listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!mounted) return;
      
      if (newSession?.user.id !== session?.user.id) {
        setSession(newSession);
        if (newSession) {
          fetchUserData(newSession);
        } else {
          router.push('/auth/login');
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase, router]); // Remove session from dependencies

  const fetchUserData = async (currentSession: Session) => {
    if (!currentSession) return;

    try {
      // Get profile with RLS policy (auth.uid() = id)
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, email, restaurant_id, address, phone_number')
        .eq('id', currentSession.user.id)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        setError(profileError.message);
        setLoading(false);
        return;
      }

      if (!profileData?.restaurant_id) {
        console.log('No restaurant found, redirecting to setup...');
        router.push('/auth/setup-profile');
        return;
      }

      // Get restaurant with RLS policy (auth.uid() = user_id)
      const { data: restaurantData, error: restaurantError } = await supabase
        .from('restaurants')
        .select('id, name, phone_number, address')
        .eq('user_id', currentSession.user.id)
        .single();

      if (restaurantError) {
        console.error('Error fetching restaurant:', restaurantError);
        if (restaurantError.code === 'PGRST116') {
          console.log('RLS policy prevented access to restaurant');
          router.push('/auth/setup-profile');
          return;
        }
        setError(restaurantError.message);
        setLoading(false);
        return;
      }

      setProfile({
        restaurant_name: restaurantData.name,
        phone_number: restaurantData.phone_number || '',
        address: restaurantData.address || ''
      });

      // Get menu items count (assuming menu_items has RLS policy for restaurant_id)
      const { count: menuCount, error: menuError } = await supabase
        .from('menu_items')
        .select('*', { count: 'exact', head: true })
        .eq('restaurant_id', restaurantData.id);

      if (!menuError) {
        setMenuItemCount(menuCount || 0);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching user data:', error);
      setError('Failed to load user data');
      setLoading(false);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <UserDashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
        </div>
      </UserDashboardLayout>
    );
  }

  // Show error state
  if (error) {
    return (
      <UserDashboardLayout>
        <div className="text-center text-red-600">
          <h2 className="text-2xl font-bold">Error</h2>
          <p className="mt-2">{error}</p>
        </div>
      </UserDashboardLayout>
    );
  }

  // Show loading profile state
  if (!session || !profile) {
    return (
      <UserDashboardLayout>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Loading Profile</h2>
          <p className="mt-2 text-gray-600">Please wait while we load your restaurant information...</p>
        </div>
      </UserDashboardLayout>
    );
  }

  return (
    <UserDashboardLayout>
      <div className="space-y-6">
        {/* Restaurant Info */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">{profile.restaurant_name}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Phone Number</p>
              <p className="text-lg">{profile.phone_number}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Address</p>
              <p className="text-lg">{profile.address}</p>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Menu Items</h3>
            <p className="text-3xl font-bold text-blue-600">{menuItemCount}</p>
          </div>
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Recent Activity</h3>
            <p className="text-gray-600">Coming soon</p>
          </div>
        </div>
      </div>
    </UserDashboardLayout>
  );
}
