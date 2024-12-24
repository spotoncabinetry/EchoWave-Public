export interface Restaurant {
  id: string;
  user_id: string;
  name: string;
  phone_number?: string | null;
  address?: string | null;
  created_at: string;
  updated_at: string;
}

export interface MenuItem {
  id: string;
  restaurant_id: string;
  category_id: string | null;
  name: string;
  description: string;
  price: number;
  image_url?: string | null;
  is_available: boolean;
  ingredients: string[];
  position: number;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface MenuCategory {
  id: string;
  restaurant_id: string;
  name: string;
  description: string | null;
  position: number;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export type MenuUploadStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface MenuUpload {
  id: string;
  restaurant_id: string;
  file_url: string | null;
  status: MenuUploadStatus;
  error_message?: string | null;
  metadata?: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  restaurant_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  status: string;
  total_amount: number;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  email: string;
  role: 'user' | 'admin';
  restaurant_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Database {
  public: {
    Tables: {
      restaurants: {
        Row: Restaurant;
        Insert: Omit<Restaurant, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Restaurant, 'id' | 'created_at' | 'updated_at'>>;
      };
      menu_items: {
        Row: MenuItem;
        Insert: Omit<MenuItem, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<MenuItem, 'id' | 'created_at' | 'updated_at'>>;
      };
      menu_categories: {
        Row: MenuCategory;
        Insert: Omit<MenuCategory, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<MenuCategory, 'id' | 'created_at' | 'updated_at'>>;
      };
      menu_uploads: {
        Row: MenuUpload;
        Insert: Omit<MenuUpload, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<MenuUpload, 'id' | 'created_at' | 'updated_at'>>;
      };
      orders: {
        Row: Order;
        Insert: Omit<Order, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Order, 'id' | 'created_at' | 'updated_at'>>;
      };
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>;
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
