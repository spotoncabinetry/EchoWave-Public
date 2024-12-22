export interface MenuItem {
  id: string;
  restaurant_id: string | null;
  category_id: string | null;
  name: string;
  description: string;
  price: number;
  image_url: string | null;
  is_available: boolean;
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
  restaurant_id: string | null;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface MenuUpload {
  id: string;
  restaurant_id: string | null;
  file_url: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface MenuUploadResponse {
  success: boolean;
  categories: MenuCategory[];
  items: MenuItem[];
  errors?: string[];
}
