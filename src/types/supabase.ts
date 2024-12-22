export type MenuUploadStatus = 'pending' | 'processing' | 'completed' | 'failed';

export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled';
export type OrderType = 'dine-in' | 'takeaway' | 'delivery';
export type PaymentStatus = 'pending' | 'paid' | 'refunded' | 'failed';

export interface Database {
  public: {
    Tables: {
      orders: {
        Row: {
          id: string;
          profile_id: string;
          customer_phone: string;
          customer_name: string | null;
          status: OrderStatus;
          items: Record<string, any>;
          total_amount: number;
          special_instructions: string | null;
          order_type: OrderType;
          payment_status: PaymentStatus;
          payment_method: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          customer_phone: string;
          customer_name?: string | null;
          status: OrderStatus;
          items: Record<string, any>;
          total_amount: number;
          special_instructions?: string | null;
          order_type: OrderType;
          payment_status: PaymentStatus;
          payment_method?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string;
          customer_phone?: string;
          customer_name?: string | null;
          status?: OrderStatus;
          items?: Record<string, any>;
          total_amount?: number;
          special_instructions?: string | null;
          order_type?: OrderType;
          payment_status?: PaymentStatus;
          payment_method?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          email: string;
          phone_number: string;
          address: string;
          role: 'user' | 'admin';
          restaurant_id: string | null;
          business_hours: Record<string, any> | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          phone_number?: string;
          address?: string;
          role?: 'user' | 'admin';
          restaurant_id?: string | null;
          business_hours?: Record<string, any> | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          phone_number?: string;
          address?: string;
          role?: 'user' | 'admin';
          restaurant_id?: string | null;
          business_hours?: Record<string, any> | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      restaurants: {
        Row: {
          id: string;
          name: string;
          address: string | null;
          phone_number: string | null;
          owner_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          address?: string | null;
          phone_number?: string | null;
          owner_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          address?: string | null;
          phone_number?: string | null;
          owner_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      menu_items: {
        Row: {
          id: string;
          restaurant_id: string;
          category_id: string | null;
          name: string;
          description: string;
          price: number;
          image_url: string | null;
          is_available: boolean;
          ingredients: string[];
          position: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          restaurant_id: string;
          category_id?: string | null;
          name: string;
          description?: string;
          price: number;
          image_url?: string | null;
          is_available?: boolean;
          ingredients?: string[];
          position?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          restaurant_id?: string;
          category_id?: string | null;
          name?: string;
          description?: string;
          price?: number;
          image_url?: string | null;
          is_available?: boolean;
          ingredients?: string[];
          position?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      menu_categories: {
        Row: {
          id: string;
          restaurant_id: string;
          name: string;
          description: string | null;
          position: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          restaurant_id: string;
          name: string;
          description?: string | null;
          position?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          restaurant_id?: string;
          name?: string;
          description?: string | null;
          position?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      menu_uploads: {
        Row: {
          id: string;
          restaurant_id: string;
          file_url: string;
          status: MenuUploadStatus;
          error_message: string | null;
          metadata: Record<string, any> | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          restaurant_id: string;
          file_url: string;
          status: MenuUploadStatus;
          error_message?: string | null;
          metadata?: Record<string, any> | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          restaurant_id?: string;
          file_url?: string;
          status?: MenuUploadStatus;
          error_message?: string | null;
          metadata?: Record<string, any> | null;
          created_at?: string;
          updated_at?: string;
        };
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
