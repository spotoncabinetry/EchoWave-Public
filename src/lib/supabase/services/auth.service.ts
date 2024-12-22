import { supabase } from '../client';
import { AuthError, AuthResponse } from '@supabase/supabase-js';

interface SignUpMetadata {
  phone_number: string;
  restaurant_name: string;
  address: string;
}

interface SignUpResult {
  data?: AuthResponse['data'];
  error: AuthError | null;
}

export class AuthService {
  static async signIn(email: string, password: string): Promise<{ data: AuthResponse['data'] | null; error: AuthError | null }> {
    try {
      console.log('🔑 Starting sign in process...', { email });
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('❌ Sign in failed:', error);
        return { data: null, error };
      }

      console.log('✅ Sign in successful:', { 
        userId: data.user?.id,
        hasSession: !!data.session
      });

      // Check if user has a profile
      if (data.user) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, email, role, restaurant_id')
          .eq('id', data.user.id)
          .single();

        if (profileError) {
          console.error('❌ Error checking profile:', profileError);
          return { data: null, error: new AuthError('Error checking user profile') };
        }

        // If profile exists, get restaurant details
        if (profileData?.restaurant_id) {
          const { data: restaurantData, error: restaurantError } = await supabase
            .from('restaurants')
            .select('id, name')
            .eq('id', profileData.restaurant_id)
            .single();

          if (restaurantError && !restaurantError.message.includes('no rows')) {
            console.error('❌ Error fetching restaurant:', restaurantError);
            return { data: null, error: new AuthError('Error fetching restaurant') };
          }

          // Update user metadata
          const { error: updateError } = await supabase.auth.updateUser({
            data: {
              hasRestaurantProfile: true,
              restaurantId: restaurantData?.id,
              restaurantName: restaurantData?.name,
              role: profileData.role
            }
          });

          if (updateError) {
            console.error('❌ Error updating user metadata:', updateError);
            return { data: null, error: updateError };
          }

          return {
            data: {
              ...data,
              user: {
                ...data.user,
                user_metadata: {
                  ...data.user.user_metadata,
                  hasRestaurantProfile: true,
                  restaurantId: restaurantData?.id,
                  restaurantName: restaurantData?.name,
                  role: profileData.role
                }
              }
            },
            error: null
          };
        } else {
          // Profile exists but no restaurant yet
          return {
            data: {
              ...data,
              user: {
                ...data.user,
                user_metadata: {
                  ...data.user.user_metadata,
                  hasRestaurantProfile: false,
                  role: profileData.role
                }
              }
            },
            error: null
          };
        }
      }

      return { data, error: null };
    } catch (error) {
      console.error('❌ Unexpected error during sign in:', error);
      const authError = error instanceof AuthError ? error : new AuthError('Unexpected error during sign in');
      return { data: null, error: authError };
    }
  }

  static async signUp(email: string, password: string) {
    try {
      console.log('🚀 Starting signup process...', { email });
      
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: 'user' // Set default role as user during signup
          }
        }
      });

      if (signUpError) {
        console.error('❌ Auth signup failed:', signUpError);
        throw signUpError;
      }

      if (!authData.user) {
        console.error('❌ No user data returned from auth signup');
        throw new AuthError('No user data returned');
      }

      console.log('✅ Auth user created successfully:', { 
        userId: authData.user.id,
        role: authData.user.user_metadata?.role 
      });
      
      return { user: authData.user };
    } catch (error) {
      console.error('❌ Error in signUp process:', error);
      throw error instanceof AuthError ? error : new AuthError('Unexpected error during sign up');
    }
  }

  static async createRestaurantProfile(userId: string, restaurantData: {
    name: string;
    phone_number: string;
    address: string;
  }) {
    try {
      console.log('🏪 Creating restaurant profile...', { userId, restaurantData });

      // Check if user already has a restaurant
      const { data: existingRestaurant, error: checkError } = await supabase
        .from('restaurants')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (checkError && !checkError.message.includes('no rows')) {
        console.error('❌ Error checking existing restaurant:', checkError);
        return { error: new AuthError('Error checking existing restaurant') };
      }

      if (existingRestaurant) {
        console.log('⚠️ Restaurant already exists for user');
        return { data: existingRestaurant, error: null };
      }

      // Create new restaurant
      const { data: restaurant, error: restaurantError } = await supabase
        .from('restaurants')
        .insert([{
          user_id: userId,
          name: restaurantData.name,
          phone_number: restaurantData.phone_number,
          address: restaurantData.address
        }])
        .select()
        .single();

      if (restaurantError) {
        console.error('❌ Error creating restaurant:', restaurantError);
        return { error: new AuthError('Error creating restaurant') };
      }

      // Update profile with restaurant_id
      const { error: updateProfileError } = await supabase
        .from('profiles')
        .update({ restaurant_id: restaurant.id })
        .eq('id', userId);

      if (updateProfileError) {
        console.error('❌ Error updating profile:', updateProfileError);
        // Try to rollback restaurant creation
        await supabase.from('restaurants').delete().eq('id', restaurant.id);
        return { error: new AuthError('Error updating profile') };
      }

      console.log('✅ Restaurant profile created successfully:', restaurant);

      // Update user metadata
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          hasRestaurantProfile: true,
          restaurantId: restaurant.id,
          restaurantName: restaurant.name
        }
      });

      if (updateError) {
        console.error('❌ Error updating user metadata:', updateError);
        return { error: updateError };
      }

      return { data: restaurant, error: null };
    } catch (error) {
      console.error('❌ Unexpected error creating restaurant:', error);
      return { error: error instanceof AuthError ? error : new AuthError('Unexpected error creating restaurant') };
    }
  }

  static async signOut() {
    return await supabase.auth.signOut();
  }

  static async getCurrentUser() {
    return await supabase.auth.getUser();
  }

  static async getSession() {
    return await supabase.auth.getSession();
  }
}
