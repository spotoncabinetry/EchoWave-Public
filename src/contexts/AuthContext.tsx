import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { User, AuthError } from '@supabase/supabase-js';
import { Database } from '../types/supabase';
import { AuthService } from '../lib/supabase/services/auth.service';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export interface AuthContextType {
  user: User | null;
  signUp: (email: string, password: string) => Promise<{ user?: User; error?: AuthError }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
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

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const signUp = async (email: string, password: string) => {
    try {
      setLoading(true);
      const result = await AuthService.signUp(email, password);
      return { user: result.user };
    } catch (error) {
      console.error('Error in signUp:', error);
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
        return { error };
      }

      if (!data?.user) {
        console.error('❌ No user data returned from sign in');
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
      router.push('/');
    } catch (error: any) {
      console.error('Error signing out:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, signUp, signIn, signOut, loading }}>
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
