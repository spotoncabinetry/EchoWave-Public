import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '../../types/supabase';
import RestaurantProfileSetup from '../../components/auth/RestaurantProfileSetup';

export default function SetupProfilePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient<Database>();

  useEffect(() => {
    const checkProfile = async () => {
      if (!user) {
        router.push('/auth/login');
        return;
      }

      // Check if user already has a profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('restaurant_id')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) {
        console.error('Error checking profile:', profileError);
        setLoading(false);
        return;
      }

      // If profile has restaurant_id, redirect to dashboard
      if (profileData?.restaurant_id) {
        console.log('Restaurant profile exists, redirecting to dashboard...');
        router.push('/user/dashboard');
        return;
      }

      setLoading(false);
    };

    checkProfile();
  }, [user, router, supabase]);


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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="text-center text-3xl font-extrabold text-gray-900">
          Complete Your Profile
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Let's set up your restaurant information to get started
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Set Up Your Restaurant</h3>
            <RestaurantProfileSetup />
          </div>
        </div>
      </div>
    </div>
  );
}
