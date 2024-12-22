import { useState } from 'react';
import { useRouter } from 'next/router';
import { AuthService } from '../../lib/supabase/services/auth.service';
import { useAuth } from '../../contexts/AuthContext';

export default function RestaurantProfileSetup() {
  const [restaurantName, setRestaurantName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const router = useRouter();
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (!user) {
        throw new Error('User must be authenticated');
      }

      const { error: profileError } = await AuthService.createRestaurantProfile(
        user.id,
        {
          name: restaurantName,
          phone_number: phoneNumber,
          address: address
        }
      );
      
      if (profileError) {
        setError(profileError.message || 'An error occurred while setting up your restaurant profile');
        return;
      }

      // Redirect to user dashboard after successful profile creation
      router.push('/user/dashboard');
    } catch (error: any) {
      console.error('❌ Profile setup error:', error);
      setError(error.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
        Set Up Your Restaurant
      </h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}

      <div className="mb-4">
        <label htmlFor="restaurantName" className="block text-gray-700 text-sm font-medium mb-2">
          Restaurant Name
        </label>
        <input
          id="restaurantName"
          type="text"
          value={restaurantName}
          onChange={(e) => setRestaurantName(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      <div className="mb-4">
        <label htmlFor="phoneNumber" className="block text-gray-700 text-sm font-medium mb-2">
          Phone Number
        </label>
        <input
          id="phoneNumber"
          type="tel"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      <div className="mb-6">
        <label htmlFor="address" className="block text-gray-700 text-sm font-medium mb-2">
          Address
        </label>
        <input
          id="address"
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
          isLoading ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        {isLoading ? 'Setting Up Profile...' : 'Complete Setup'}
      </button>
    </form>
  );
}
