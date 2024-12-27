import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { Database } from '@/lib/supabase/types/database.types';

type Agent = Database['public']['Tables']['agents']['Row'];

export function useAgent(restaurantId: string) {
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchAgent = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from('agents')
          .select('*')
          .eq('restaurant_id', restaurantId)
          .single();

        if (fetchError) throw fetchError;

        // Set default values for new fields if they don't exist
        const agentWithDefaults: Agent = {
          ...data,
          menu_items_enabled: data.menu_items_enabled ?? true,
          menu_categories_enabled: data.menu_categories_enabled ?? true,
          voice_id: data.voice_id ?? 'alloy'
        };

        setAgent(agentWithDefaults);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch agent'));
      } finally {
        setLoading(false);
      }
    };

    if (restaurantId) {
      fetchAgent();
    }
  }, [restaurantId]);

  return { agent, loading, error };
}
