export interface MenuItem {
    id: string;
    name: string;
    description: string;
    price: number;
    category_id: string | null;
    is_available: boolean;
    display_order: number;
    restaurant_id: string;
    image_url: string | null;
    position: number | null;
    ingredients?: string[];
    created_at: string;
    updated_at: string;
}

export interface MenuCategory {
    id: string;
    name: string;
    restaurant_id: string;
    created_at: string;
    updated_at: string;
}

export interface MenuItemNote {
    id: string;
    menu_item_id: string;
    note: string;
    note_type?: string;
    expires_at?: string;
    created_at: string;
    updated_at: string;
}

export interface GPTMenuItem {
    name: string;
    description: string;
    price: number;
    base_price?: number;
    category: string;
    ingredients?: string[];
    special_notes?: SpecialNote[];
    size_options?: {
        size: string;
        price: number;
    }[];
    add_ons?: {
        name: string;
        price: number;
    }[];
}

export interface GPTMenuAnalysis {
    categories: GPTMenuCategory[];
    special_notes?: SpecialNote[];
}

export interface GPTMenuCategory {
    name: string;
    items: GPTMenuItem[];
}

export interface GPTMenuAnalysis {
    categories: GPTMenuCategory[];
}

export interface SpecialNote {
    type: string;
    content: string;
    expires_at?: string;
}
