export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      agents: {
        Row: {
          id: string;
          restaurant_id: string;
          created_at: string;
          updated_at: string;
          agent_greeting: string;
          agent_store_hours: string;
          agent_daily_specials: string;
          menu_enabled: boolean;
          transcription: Json;
          ai_response: Json;
        };
        Insert: {
          id?: string;
          restaurant_id: string;
          created_at?: string;
          updated_at?: string;
          agent_greeting?: string;
          agent_store_hours?: string;
          agent_daily_specials?: string;
          menu_enabled?: boolean;
          transcription?: Json;
          ai_response?: Json;
        };
        Update: {
          id?: string;
          restaurant_id?: string;
          created_at?: string;
          updated_at?: string;
          agent_greeting?: string;
          agent_store_hours?: string;
          agent_daily_specials?: string;
          menu_enabled?: boolean;
          transcription?: Json;
          ai_response?: Json;
        };
      };
      customer_call_logs: {
        Row: {
          id: string;
          restaurant_id: string;
          customer_id: string;
          agent_id: string;
          transcript: string | null;
          outcome: string | null;
          interaction_summary: string | null;
          call_tags: string[] | null;
          duration_seconds: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          restaurant_id: string;
          customer_id: string;
          agent_id: string;
          transcript?: string | null;
          outcome?: string | null;
          interaction_summary?: string | null;
          call_tags?: string[] | null;
          duration_seconds?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          restaurant_id?: string;
          customer_id?: string;
          agent_id?: string;
          transcript?: string | null;
          outcome?: string | null;
          interaction_summary?: string | null;
          call_tags?: string[] | null;
          duration_seconds?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      menu_items: {
        Row: {
          id: string;
          category_id: string | null;
          restaurant_id: string;
          name: string;
          description: string | null;
          price: number;
          image_url: string | null;
          is_available: boolean;
          ingredients: string[];
          position: number | null;
          display_order: number;
          created_at: string;
          updated_at: string;
          dietary_info: Json | null;
        };
        Insert: {
          id?: string;
          category_id?: string | null;
          restaurant_id: string;
          name: string;
          description?: string | null;
          price?: number;
          image_url?: string | null;
          is_available?: boolean;
          ingredients?: string[];
          position?: number | null;
          display_order?: number;
          created_at?: string;
          updated_at?: string;
          dietary_info?: Json | null;
        };
        Update: {
          id?: string;
          category_id?: string | null;
          restaurant_id?: string;
          name?: string;
          description?: string | null;
          price?: number;
          image_url?: string | null;
          is_available?: boolean;
          ingredients?: string[];
          position?: number | null;
          display_order?: number;
          created_at?: string;
          updated_at?: string;
          dietary_info?: Json | null;
        };
      };
      menu_item_notes: {
        Row: {
          id: string;
          menu_item_id: string;
          content: string;
          note_type: string | null;
          expires_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          menu_item_id: string;
          content: string;
          note_type?: string | null;
          expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          menu_item_id?: string;
          content?: string;
          note_type?: string | null;
          expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      menu_categories: {
        Row: {
          id: string;
          restaurant_id: string;
          name: string;
          description: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          restaurant_id: string;
          name: string;
          description: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          restaurant_id?: string;
          name?: string;
          description?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      restaurants: {
        Row: {
          id: string;
          profile_id: string;
          name: string;
          phone: string | null;
          created_at: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          name: string;
          phone?: string | null;
          created_at?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          id?: string;
          profile_id?: string;
          name?: string;
          phone?: string | null;
          created_at?: string;
          updated_at?: string;
          user_id?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          name: string | null;
          email: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name?: string | null;
          email: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string | null;
          email?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      agents: {
        Row: {
          id: string;
          restaurant_id: string;
          agent_greeting: string;
          agent_store_hours: string;
          agent_daily_specials: string;
          menu_enabled: boolean;
          transcription: Json;
          ai_response: Json;
          test_error_message: string | null;
          test_duration_seconds: number | null;
          last_test_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          restaurant_id: string;
          agent_greeting: string;
          agent_store_hours: string;
          agent_daily_specials: string;
          menu_enabled?: boolean;
          transcription?: Json;
          ai_response?: Json;
          test_error_message?: string | null;
          test_duration_seconds?: number | null;
          last_test_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          restaurant_id?: string;
          agent_greeting?: string;
          agent_store_hours?: string;
          agent_daily_specials?: string;
          menu_enabled?: boolean;
          transcription?: Json;
          ai_response?: Json;
          test_error_message?: string | null;
          test_duration_seconds?: number | null;
          last_test_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      customers: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          agent_greeting: string | null;
          agent_store_hours: string | null;
          agent_daily_specials: string | null;
          order_id: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          agent_greeting?: string | null;
          agent_store_hours?: string | null;
          agent_daily_specials?: string | null;
          order_id?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          agent_greeting?: string | null;
          agent_store_hours?: string | null;
          agent_daily_specials?: string | null;
          order_id?: string | null;
        };
      };
      orders: {
        Row: {
          id: string;
          profile_id: string;
          customer_phone: string;
          customer_name: string | null;
          status: string;
          items: Record<string, any>;
          total: number;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          customer_phone: string;
          customer_name?: string | null;
          status?: string;
          items: Record<string, any>;
          total?: number;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string;
          customer_phone?: string;
          customer_name?: string | null;
          status?: string;
          items?: Record<string, any>;
          total?: number;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      menu_uploads: {
        Row: {
          id: string;
          restaurant_id: string;
          file_path: string;
          status: string;
          error: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          restaurant_id: string;
          file_path: string;
          status?: string;
          error?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          restaurant_id?: string;
          file_path?: string;
          status?: string;
          error?: string | null;
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
