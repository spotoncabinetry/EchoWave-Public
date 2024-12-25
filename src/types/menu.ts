export interface MenuItem {
  id: string;
  restaurant_id: string;
  category_id: string | null;
  name: string;
  description: string;
  price: number;
  image_url: string | null;
  is_available: boolean;
  position: number;
  display_order: number;
  created_at: string;
  updated_at: string;
  ingredients?: string[];
}

export interface MenuItemNote {
  id: string;
  menu_item_id: string;
  note_type: string;
  content: string;
  expires_at: string | null;
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

export interface MenuUpload {
  id: string;
  restaurant_id: string;
  file_url: string;
  status: string;
  metadata?: Record<string, any> | null;
  error_message?: string | null;
  created_at: string;
  updated_at: string;
}

export interface MenuUploadResponse {
  success: boolean;
  categories: MenuCategory[];
  items: MenuItem[];
  errors?: string[];
}

// New interfaces for GPT response
export interface GPTMenuCategory {
  name: string;
  description?: string;
  timing?: string;
  items: GPTMenuItem[];
}

export interface GPTMenuItem {
  name: string;
  description?: string;
  base_price?: number;
  price?: number;  // Added to support final processed price
  size_options?: {
    size: string;
    price: number;
  }[];
  add_ons?: {
    name: string;
    price: number;
    special_pricing?: boolean;
  }[];
  special_tags?: string[];
  dietary_info?: {
    vegetarian?: boolean;
    vegan?: boolean;
    gluten_free?: boolean;
    spicy?: boolean;
  };
  ingredients?: string[];
  possible_toppings?: string[];
}

export interface SpecialNote {
  type: string;
  content: string;
}

export interface GPTMenuAnalysis {
  categories: GPTMenuCategory[];
  special_notes: SpecialNote[];
}
