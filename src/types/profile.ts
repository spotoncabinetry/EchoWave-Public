export type UserRole = 'user' | 'admin';

export interface Profile {
  id: string;
  email: string;
  phone_number?: string | null;
  restaurant_name?: string | null;
  address?: string | null;
  role: UserRole;
  business_hours?: Record<string, any> | null;
  restaurant_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProfileUpdateInput {
  email?: string;
  phone_number?: string | null;
  restaurant_name?: string | null;
  address?: string | null;
  role?: UserRole;
  business_hours?: Record<string, any> | null;
  restaurant_id?: string | null;
}
