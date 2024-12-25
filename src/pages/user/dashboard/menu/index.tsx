import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import UserDashboardLayout from '../../../../components/user/dashboard/UserDashboardLayout';
import MenuList from '../../../../components/user/menu/MenuList';
import AddMenuItemForm from '../../../../components/user/menu/AddMenuItemForm';
import { MenuItem, MenuCategory } from '../../../../types/menu';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '../../../../types/supabase';

export default function UserMenuPage() {
  const supabase = createClientComponentClient<Database>();
  const router = useRouter();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const initializeData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await fetchMenuData();
      }
    };
    initializeData();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        fetchMenuData();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchMenuData = async () => {
    setLoading(true);
    console.log('Fetching menu data...');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get the profile to get restaurant_id
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('restaurant_id')
        .eq('id', user.id)
        .single();

      if (profileError) {
        if (profileError.message.includes('no rows')) {
          router.push('/auth/setup-profile');
          return;
        }
        throw profileError;
      }

      if (!profileData?.restaurant_id) {
        router.push('/auth/setup-profile');
        return;
      }

      const restaurantId = profileData.restaurant_id;

      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('menu_categories')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('display_order', { ascending: true });

      if (categoriesError) throw categoriesError;

      // Fetch menu items
      const { data: itemsData, error: itemsError } = await supabase
        .from('menu_items')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('display_order', { ascending: true });

      if (itemsError) throw itemsError;

      // Transform the data to match the required types
      const transformedCategories: MenuCategory[] = (categoriesData || []).map(cat => ({
        id: cat.id,
        restaurant_id: restaurantId,
        name: cat.name,
        description: cat.description || null,
        created_at: cat.created_at || new Date().toISOString(),
        updated_at: cat.updated_at || new Date().toISOString()
      }));

      const transformedItems: MenuItem[] = (itemsData || []).map(item => ({
        id: item.id,
        restaurant_id: restaurantId,
        category_id: item.category_id || null,
        name: item.name,
        description: item.description || '',
        price: item.price || 0,
        image_url: item.image_url || null,
        is_available: item.is_available || false,
        position: item.position !== null ? item.position : 0,
        display_order: item.display_order,
        created_at: item.created_at || new Date().toISOString(),
        updated_at: item.updated_at || new Date().toISOString()
      }));

      setCategories(transformedCategories);
      setMenuItems(transformedItems);
    } catch (error) {
      console.error('Error fetching menu data:', error);
      setMenuItems([]);
      setCategories([]);
    } finally {
      console.log('Fetch completed');
      setLoading(false);
    }
  };

  const handleAddItem = async (newItem: Partial<MenuItem>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get the profile to get restaurant_id
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('restaurant_id')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;
      if (!profileData?.restaurant_id) throw new Error('No restaurant found');

      // Prepare the menu item data according to the schema
      const menuItemData = {
        restaurant_id: profileData.restaurant_id,
        name: newItem.name || '',
        description: newItem.description || '',
        price: newItem.price || 0,
        category_id: newItem.category_id || null,
        image_url: newItem.image_url || null,
        is_available: newItem.is_available ?? true,
        ingredients: newItem.ingredients || [],
        position: newItem.position !== null ? newItem.position : 0,
        display_order: newItem.display_order,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('menu_items')
        .insert([menuItemData as any]);

      if (error) throw error;
      setIsAddingItem(false);
      fetchMenuData();
    } catch (error) {
      console.error('Error adding item:', error);
    }
  };

  const handleUpdateItem = async (id: string, updates: Partial<MenuItem>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get the current item to preserve existing values
      const { data: currentItem, error: fetchError } = await supabase
        .from('menu_items')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;
      if (!currentItem) throw new Error('Item not found');

      // Prepare the update data
      const { restaurant_id, ...updateData } = {
        ...updates,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('menu_items')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
      fetchMenuData();
    } catch (error) {
      console.error('Error updating item:', error);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;
      fetchMenuData();
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  const handleUpdateCategory = async (id: string, updates: Partial<MenuCategory>) => {
    try {
      const { error } = await supabase
        .from('menu_categories')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      fetchMenuData();
    } catch (error) {
      console.error('Error updating category:', error);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      const { error } = await supabase
        .from('menu_categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchMenuData();
    } catch (error) {
      console.error('Error deleting category:', error);
    }
  };

  const handleAddCategory = async (name: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get the profile to get restaurant_id
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('restaurant_id')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;
      if (!profileData?.restaurant_id) throw new Error('No restaurant found');

      const restaurantId = profileData.restaurant_id;

      const { error } = await supabase
        .from('menu_categories')
        .insert([{ name, restaurant_id: restaurantId }]);

      if (error) throw error;
      fetchMenuData();
    } catch (error) {
      console.error('Error adding category:', error);
    }
  };

  return (
    <UserDashboardLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">Menu Management</h1>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : menuItems.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No menu items found. Use the upload feature to add items to your menu.</p>
          </div>
        ) : (
          <MenuList
            items={menuItems}
            categories={categories}
            supabase={supabase}
            onDelete={handleDeleteItem}
            onUpdate={handleUpdateItem}
            onUpdateCategory={handleUpdateCategory}
            onDeleteCategory={handleDeleteCategory}
            onAddCategory={handleAddCategory}
            onAddItem={handleAddItem}
            onRefresh={fetchMenuData}
          />
        )}

        {isAddingItem && (
          <AddMenuItemForm
            categories={categories}
            onAddItem={handleAddItem}
            onClose={() => setIsAddingItem(false)}
          />
        )}
      </div>
    </UserDashboardLayout>
  );
}
