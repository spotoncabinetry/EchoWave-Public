import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { User, AuthError } from '@supabase/supabase-js';
import { Database } from '../types/supabase';
import { AuthService } from '../lib/supabase/services/auth.service';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface Restaurant {
  id: string;
  name: string;
  address: string | null;
  phone_number: string | null;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface AuthContextType {
  user: User | null;
  restaurant: Restaurant | null;
  signUp: (email: string, password: string) => Promise<{ user?: User; error?: AuthError }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  loading: boolean;
  error: Error | null;
}

export const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const router = useRouter();
  const supabase = createClientComponentClient<Database>();

  useEffect(() => {
    // Check active sessions and sets the user
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await AuthService.getSession();
        setUser(session?.user ?? null);
      } catch (error) {
        console.error('Error checking auth session:', error);
        setError(error instanceof Error ? error : new Error('Failed to check auth session'));
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for changes on auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase.auth]);

  // Fetch restaurant data when user changes
  useEffect(() => {
    async function fetchRestaurant() {
      if (!user) {
        setRestaurant(null);
        return;
      }

      try {
        const { data, error: restaurantError } = await supabase
          .from('restaurants')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (restaurantError) {
          throw restaurantError;
        }

        // Transform data to match Restaurant type
        if (data) {
          const restaurant: Restaurant = {
            id: data.id,
            name: data.name,
            address: data.address,
            phone_number: data.phone_number,
            owner_id: data.owner_id,
            created_at: data.created_at,
            updated_at: data.updated_at
          };
          setRestaurant(restaurant);
        } else {
          setRestaurant(null);
        }
      } catch (err) {
        console.error('Error fetching restaurant:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch restaurant data'));
        setRestaurant(null);
      }
    }

    fetchRestaurant();
  }, [user, supabase]);

  const signUp = async (email: string, password: string) => {
    try {
      setLoading(true);
      const result = await AuthService.signUp(email, password);
      return { user: result.user };
    } catch (error) {
      console.error('Error in signUp:', error);
      setError(error instanceof Error ? error : new Error('Failed to sign up'));
      return { error: error as AuthError };
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { data, error } = await AuthService.signIn(email, password);

      if (error) {
        console.error('❌ Sign in error:', error);
        setError(error instanceof Error ? error : new Error('Failed to sign in'));
        return { error };
      }

      if (!data?.user) {
        console.error('❌ No user data returned from sign in');
        setError(new Error('No user data returned'));
        return { error: new AuthError('No user data returned') };
      }

      // Set the user in context
      setUser(data.user);

      // Handle routing based on role and profile completion
      const role = data.user.user_metadata.role || 'user';
      console.log('🎭 User role:', role);
      console.log('🏪 Has restaurant profile:', data.user.user_metadata.hasRestaurantProfile);

      if (role === 'admin') {
        console.log('📍 Redirecting to admin dashboard...');
        router.push('/admin/dashboard');
      } else if (!data.user.user_metadata.hasRestaurantProfile) {
        console.log('📍 Redirecting to profile setup...');
        router.push('/auth/setup-profile');
      } else {
        console.log('📍 Redirecting to user dashboard...');
        router.push('/user/dashboard');
      }

      return { error: null };
    } catch (error) {
      console.error('❌ Unexpected error in sign in:', error);
      setError(error instanceof Error ? error : new Error('Failed to sign in'));
      return { error: error instanceof AuthError ? error : new AuthError('Unexpected error during sign in') };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      await AuthService.signOut();
      setUser(null);
      setRestaurant(null);
      router.push('/');
    } catch (error: any) {
      console.error('Error signing out:', error);
      setError(error instanceof Error ? error : new Error('Failed to sign out'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      restaurant,
      signIn,
      signUp,
      signOut,
      loading,
      error
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
