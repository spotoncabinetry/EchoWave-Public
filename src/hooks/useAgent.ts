import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Agent } from '@/types/agent';
import { Database } from '@/lib/supabase/types/database.types';

type AgentRow = Database['public']['Tables']['agents']['Row'];
type AgentInsert = Database['public']['Tables']['agents']['Insert'];

export function useAgent(restaurantId: string) {
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchAgent = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!restaurantId) {
          setAgent(null);
          return;
        }

        const { data, error: fetchError } = await supabase
          .from('agents')
          .select('*')
          .eq('restaurant_id', restaurantId)
          .single();

        if (fetchError) throw new Error(fetchError.message);

        if (!data) {
          // Create default agent if none exists
          const defaultAgent: AgentInsert = {
            restaurant_id: restaurantId,
            agent_greeting: 'Hello! Welcome to our restaurant.',
            agent_store_hours: '',
            agent_daily_specials: '',
            menu_enabled: true,
            menu_items_enabled: true,
            menu_categories_enabled: true,
            voice_id: 'alloy',
            transcription: null,
            ai_response: null,
            test_error_message: null,
            test_duration_seconds: null,
            last_test_at: null
          };

          const { data: newAgent, error: createError } = await supabase
            .from('agents')
            .insert(defaultAgent)
            .select()
            .single();

          if (createError) throw new Error(createError.message);
          
          // Convert database row to Agent type
          setAgent(convertToAgent(newAgent as AgentRow));
        } else {
          // Convert database row to Agent type
          setAgent(convertToAgent(data as AgentRow));
        }
      } catch (err) {
        console.error('Error fetching agent:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch agent'));
        setAgent(null);
      } finally {
        setLoading(false);
      }
    };

    fetchAgent();
  }, [restaurantId]);

  return { agent, loading, error };
}

function convertToAgent(row: AgentRow): Agent {
  return {
    id: row.id,
    restaurant_id: row.restaurant_id,
    agent_greeting: row.agent_greeting,
    agent_store_hours: row.agent_store_hours || null,
    agent_daily_specials: row.agent_daily_specials || null,
    menu_enabled: row.menu_enabled,
    voice_id: row.voice_id,
    language: 'en-AU', // Default value since not in DB
    personality_type: 'friendly', // Default value since not in DB
    max_conversation_turns: 10, // Default value since not in DB
    is_active: true, // Default value since not in DB
    voice_recording_url: null, // Default value since not in DB
    transcription: typeof row.transcription === 'string' ? row.transcription : null,
    ai_response: typeof row.ai_response === 'string' ? row.ai_response : null,
    test_duration_seconds: row.test_duration_seconds,
    last_test_at: row.last_test_at,
    test_success: false, // Default value since not in DB
    test_error_message: row.test_error_message,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}
