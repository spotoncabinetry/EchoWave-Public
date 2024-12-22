import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import UserDashboardLayout from '../../../../components/user/dashboard/UserDashboardLayout';
import { useAuth } from '../../../../contexts/AuthContext';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '../../../../types/supabase';

const supabase = createClientComponentClient<Database>();

interface RestaurantSettings {
  name: string;
  phone_number: string;
  address: string;
}

export default function SettingsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<RestaurantSettings | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (user?.id) {
      fetchSettings();
    }
  }, [user]);

  const fetchSettings = async () => {
    if (!user?.id) return;

    try {
      setErrorMessage('');
      // First get the profile to get the restaurant_id
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('restaurant_id')
        .eq('id', user.id)
        .single();

      if (profileError) {
        if (profileError.message.includes('no rows')) {
          router.push('/auth/setup-profile');
          return;
        }
        throw profileError;
      }

      if (!profileData.restaurant_id) {
        router.push('/auth/setup-profile');
        return;
      }

      // Then get the restaurant data
      const { data: restaurantData, error: restaurantError } = await supabase
        .from('restaurants')
        .select('name, phone_number, address')
        .eq('id', profileData.restaurant_id)
        .single();

      if (restaurantError) throw restaurantError;

      setSettings({
        name: restaurantData.name || '',
        phone_number: restaurantData.phone_number || '',
        address: restaurantData.address || '',
      });
    } catch (error) {
      console.error('Error fetching settings:', error);
      setErrorMessage('Failed to load restaurant settings. Please try refreshing the page.');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!settings || !user?.id) return;

    setSaving(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      // First get the profile to get the restaurant_id
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('restaurant_id')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;
      if (!profileData.restaurant_id) throw new Error('No restaurant ID found');

      // Update restaurant data
      const { error: updateError } = await supabase
        .from('restaurants')
        .update({
          name: settings.name,
          address: settings.address,
          phone_number: settings.phone_number,
        })
        .eq('id', profileData.restaurant_id);

      if (updateError) throw updateError;

      // Update user metadata to reflect the new restaurant name
      const { error: metadataError } = await supabase.auth.updateUser({
        data: {
          restaurantName: settings.name
        }
      });

      if (metadataError) throw metadataError;

      setSuccessMessage('Settings saved successfully!');
      await fetchSettings();
    } catch (error) {
      console.error('Error saving settings:', error);
      setErrorMessage('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <UserDashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
        </div>
      </UserDashboardLayout>
    );
  }

  return (
    <UserDashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Restaurant Settings</h1>
          <button
            onClick={saveSettings}
            disabled={saving}
            className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
              saving ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {saving ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Saving...
              </>
            ) : 'Save Changes'}
          </button>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="bg-green-50 border-l-4 border-green-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700">{successMessage}</p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {errorMessage && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{errorMessage}</p>
              </div>
            </div>
          </div>
        )}

        {settings && (
          <div className="bg-white shadow rounded-lg p-6 space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Restaurant Name
              </label>
              <input
                type="text"
                id="name"
                value={settings.name}
                onChange={(e) => {
                  setSettings({ ...settings, name: e.target.value });
                  setSuccessMessage(''); // Clear success message when user starts editing
                }}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700">
                Phone Number
              </label>
              <input
                type="tel"
                id="phone_number"
                value={settings.phone_number}
                onChange={(e) => {
                  setSettings({ ...settings, phone_number: e.target.value });
                  setSuccessMessage('');
                }}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                Address
              </label>
              <input
                type="text"
                id="address"
                value={settings.address}
                onChange={(e) => {
                  setSettings({ ...settings, address: e.target.value });
                  setSuccessMessage('');
                }}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
          </div>
        )}
      </div>
    </UserDashboardLayout>
  );
}
