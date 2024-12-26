export interface Agent {
  id: string;
  restaurant_id: string;
  created_at: string;
  updated_at: string;
  agent_greeting: string;
  agent_store_hours: string;
  agent_daily_specials: string;
  menu_items_enabled: boolean;
  menu_categories_enabled: boolean;
}

export interface MenuItem {
  id: string;
  restaurant_id: string;
  name: string;
  description: string;
  price: number;
  image_url: string | null;
  is_available: boolean;
  ingredients: string[];
  position: number | null;
  display_order: number;
  created_at: string;
  updated_at: string;
  category_id: string | null;
}

export interface MenuCategory {
  id: string;
  restaurant_id: string;
  name: string;
  description: string | null;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface MenuItemNote {
  id: string;
  menu_item_id: string;
  note_type: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  created_at: string;
  updated_at: string;
  agent_greeting: string;
  agent_store_hours: string;
  agent_daily_specials: string;
  order_id: string;
}
