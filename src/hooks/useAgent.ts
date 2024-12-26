import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/lib/supabase/types/database.types';

type Agent = Database['public']['Tables']['agents']['Row'];

export function useAgent(restaurantId: string) {
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const supabase = createClientComponentClient<Database>();

  const fetchAgent = async () => {
    try {
      if (!restaurantId) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .single();

      if (error) throw error;

      if (!data) {
        // Create a new agent if one doesn't exist
        const { data: newAgent, error: createError } = await supabase
          .from('agents')
          .insert([
            {
              restaurant_id: restaurantId,
              language: 'en-AU',
              voice_id: 'alloy',
              menu_enabled: false,
              is_active: true,
              agent_greeting: "G'day! How can I help you today?",
              agent_store_hours: "We're open Monday to Friday, 9 AM to 9 PM",
              agent_daily_specials: "Today's special: Aussie burger with beetroot!"
            }
          ])
          .select()
          .single();

        if (createError) throw createError;
        setAgent(newAgent);
      } else {
        setAgent(data);
      }
    } catch (err) {
      console.error('Error fetching agent:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch agent'));
    } finally {
      setLoading(false);
    }
  };

  const updateAgent = async (updates: Partial<Agent>) => {
    if (!agent?.id || !restaurantId) return;

    try {
      const { data, error } = await supabase
        .from('agents')
        .update(updates)
        .eq('id', agent.id)
        .eq('restaurant_id', restaurantId)
        .select()
        .single();

      if (error) throw error;
      setAgent(data);
    } catch (err) {
      console.error('Error updating agent:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchAgent();
  }, [restaurantId]);

  return { agent, loading, error, updateAgent };
}
