export interface Agent {
  id: string;
  restaurant_id: string;
  agent_greeting: string;
  agent_store_hours: string | null;
  agent_daily_specials: string | null;
  menu_enabled: boolean;
  voice_id: string;
  language: string;
  personality_type: string;
  max_conversation_turns: number;
  is_active: boolean;
  voice_recording_url: string | null;
  transcription: string | null;
  ai_response: string | null;
  test_duration_seconds: number | null;
  last_test_at: string | null;
  test_success: boolean;
  test_error_message: string | null;
  created_at: string;
  updated_at: string;
  model?: string; // Optional model field
}

export interface AgentConfig {
  greeting: string;
  storeHours: string | null;
  dailySpecials: string | null;
  menuEnabled: boolean;
  language: string;
  personalityType: string;
  maxConversationTurns: number;
  isActive: boolean;
  model?: string;
}
