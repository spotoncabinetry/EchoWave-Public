import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { Database } from '@/lib/supabase/types/database.types';
import type { MenuItem, MenuCategory } from '@/types/database';

type Agent = Database['public']['Tables']['agents']['Row'];
type Tables = Database['public']['Tables'];
type DBMenuCategory = Database['public']['Tables']['menu_categories']['Row'];
type DBMenuItem = Database['public']['Tables']['menu_items']['Row'];

interface UseAgentReturn {
  agent: Agent | null;
  menuItems: MenuItem[];
  menuCategories: MenuCategory[];
  loading: boolean;
  error: Error | null;
  updateAgent: (data: Partial<Agent>) => Promise<Agent | undefined>;
  refreshData: () => Promise<void>;
}

export function useAgent(restaurantId: string): UseAgentReturn {
  const [agent, setAgent] = useState<Agent | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [menuCategories, setMenuCategories] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch agent configuration
      const { data: agentData, error: agentError } = await supabase
        .from('agents')
        .select()
        .eq('restaurant_id', restaurantId)
        .maybeSingle();

      if (agentError) {
        // If no agent exists, create one
        if (agentError.code === 'PGRST116') {
          const { data: newAgent, error: createError } = await supabase
            .from('agents')
            .insert({
              restaurant_id: restaurantId,
              agent_greeting: 'Hello! How can I assist you today?',
              agent_store_hours: 'We are open Monday to Friday, 9 AM to 9 PM.',
              agent_daily_specials: 'Ask me about our daily specials!',
              menu_enabled: true,
              transcription: { enabled: true, language: 'en-AU' },
              ai_response: { enabled: true, voice: 'alloy', language: 'en-AU' }
            })
            .select()
            .single();

          if (createError) throw createError;
          setAgent(newAgent);
        } else {
          throw agentError;
        }
      } else {
        setAgent(agentData);
      }

      // Fetch menu categories
      const { data: categories, error: categoriesError } = await supabase
        .from('menu_categories')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('created_at');

      if (categoriesError) throw categoriesError;
      
      // Map database categories to frontend MenuCategory type
      const mappedCategories: MenuCategory[] = categories.map((cat, index) => ({
        id: cat.id,
        restaurant_id: cat.restaurant_id,
        name: cat.name,
        description: cat.description || '',
        position: index,
        created_at: cat.created_at,
        updated_at: cat.updated_at
      }));
      
      setMenuCategories(mappedCategories);

      // Fetch menu items
      const { data: items, error: itemsError } = await supabase
        .from('menu_items')
        .select('*, menu_item_notes(*)')
        .eq('restaurant_id', restaurantId)
        .order('position');

      if (itemsError) throw itemsError;
      
      // Map database items to frontend MenuItem type
      const mappedItems: MenuItem[] = items.map((item, index) => ({
        id: item.id,
        restaurant_id: item.restaurant_id,
        category_id: item.category_id || '',
        name: item.name,
        description: item.description || '',
        price: item.price,
        image_url: item.image_url || '',
        is_available: item.is_available,
        ingredients: item.ingredients || [],
        position: item.position || index,
        display_order: item.position || index,
        created_at: item.created_at,
        updated_at: item.updated_at
      }));
      
      setMenuItems(mappedItems);

    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err : new Error('Unknown error occurred'));
    } finally {
      setLoading(false);
    }
  };

  const updateAgent = async (data: Partial<Agent>) => {
    if (!agent?.id) return;

    try {
      const { data: updatedAgent, error: updateError } = await supabase
        .from('agents')
        .update(data)
        .eq('id', agent.id)
        .select()
        .single();

      if (updateError) throw updateError;
      if (updatedAgent) {
        setAgent(updatedAgent);
        return updatedAgent;
      }
    } catch (err) {
      console.error('Error updating agent:', err);
      setError(err instanceof Error ? err : new Error('Unknown error occurred'));
      throw err;
    }
  };

  useEffect(() => {
    if (restaurantId) {
      fetchData();
    }
  }, [restaurantId]);

  return {
    agent,
    menuItems,
    menuCategories,
    loading,
    error,
    updateAgent,
    refreshData: fetchData
  };
}

// Helper function to build AI context from agent and menu data
export function buildAIContext(
  agent: Agent,
  menuItems: MenuItem[],
  menuCategories: MenuCategory[]
): string {
  const context = [];

  // Add agent configuration
  context.push(`Greeting: ${agent.agent_greeting}`);
  context.push(`Store Hours: ${agent.agent_store_hours}`);
  context.push(`Daily Specials: ${agent.agent_daily_specials}`);

  // Add menu categories and items
  const categoriesMap = new Map(
    menuCategories.map(category => [category.id, category])
  );

  const itemsByCategory = menuItems.reduce((acc, item) => {
    if (!item.category_id) return acc;
    if (!acc[item.category_id]) {
      acc[item.category_id] = [];
    }
    acc[item.category_id].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  // Build menu context
  context.push('\nMenu:');
  menuCategories.forEach(category => {
    context.push(`\n${category.name}:`);
    const items = itemsByCategory[category.id] || [];
    items.forEach(item => {
      context.push(
        `- ${item.name} ($${item.price}): ${item.description}`
      );
    });
  });

  return context.join('\n');
}
