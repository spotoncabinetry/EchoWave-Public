import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../../../contexts/AuthContext';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import UserDashboardLayout from '../../../../components/user/dashboard/UserDashboardLayout';

interface Restaurant {
  id: string;
  user_id: string;
  name: string;
  phone_number: string;
  address: string;
  created_at: string;
  updated_at: string;
}

type RestaurantInsert = Omit<Restaurant, 'id' | 'created_at' | 'updated_at'>;
type RestaurantUpdate = Partial<Pick<Restaurant, 'name' | 'phone_number' | 'address'>>;

interface ProfileFormData {
  restaurant_name: string;
  phone_number: string;
  address: string;
}

export default function ProfilePage() {
  const { user } = useAuth();
  const router = useRouter();
  const supabase = createClientComponentClient();

  const [formData, setFormData] = useState<ProfileFormData>({
    restaurant_name: '',
    phone_number: '',
    address: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;

      try {
        // Get restaurant details where the user is the owner
        const { data: restaurants, error: fetchError } = await supabase
          .from('restaurants')
          .select()
          .eq('user_id', user.id);

        if (fetchError) {
          console.error('Error fetching restaurant:', fetchError);
          setError('Failed to load restaurant data');
          setLoading(false);
          return;
        }

        // If no restaurant exists, create one
        if (!restaurants || restaurants.length === 0) {
          const newRestaurant: RestaurantInsert = {
            user_id: user.id,
            name: '',
            phone_number: '',
            address: ''
          };

          try {
            const { data: created, error: insertError } = await supabase
              .from('restaurants')
              .insert(newRestaurant)
              .select()
              .single();
              
            if (insertError) {
              if (insertError.code === '42501') {
                console.error('RLS Error:', insertError);
                setError('Permission denied. Please contact support.');
              } else {
                console.error('Error creating restaurant:', insertError);
                setError('Failed to create restaurant profile');
              }
              setLoading(false);
              return;
            }

            if (created) {
              setFormData({
                restaurant_name: created.name || '',
                phone_number: created.phone_number || '',
                address: created.address || ''
              });
            }
          } catch (err) {
            console.error('Error in restaurant creation:', err);
            setError('An unexpected error occurred');
            setLoading(false);
            return;
          }
        } else {
          const restaurant = restaurants[0];
          setFormData({
            restaurant_name: restaurant.name || '',
            phone_number: restaurant.phone_number || '',
            address: restaurant.address || ''
          });
        }
      } catch (err) {
        console.error('Error loading profile:', err);
        setError('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const updateData: RestaurantUpdate = {
        name: formData.restaurant_name,
        phone_number: formData.phone_number,
        address: formData.address
      };

      const { error: updateError } = await supabase
        .from('restaurants')
        .update(updateData)
        .eq('user_id', user.id);

      if (updateError) {
        if (updateError.code === '42501') {
          console.error('RLS Error:', updateError);
          setError('Permission denied. Please contact support.');
        } else {
          console.error('Error updating restaurant:', updateError);
          setError('Failed to update restaurant profile');
        }
        return;
      }

      setSuccess('Profile updated successfully');
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('An unexpected error occurred');
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
      <div className="max-w-2xl mx-auto py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Restaurant Profile</h1>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm text-green-600">{success}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="restaurant_name" className="block text-sm font-medium text-gray-700">
              Restaurant Name
            </label>
            <input
              type="text"
              id="restaurant_name"
              value={formData.restaurant_name}
              onChange={(e) => setFormData(prev => ({ ...prev, restaurant_name: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700">
              Phone Number
            </label>
            <input
              type="tel"
              id="phone_number"
              value={formData.phone_number}
              onChange={(e) => setFormData(prev => ({ ...prev, phone_number: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700">
              Address
            </label>
            <textarea
              id="address"
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </UserDashboardLayout>
  );
}
