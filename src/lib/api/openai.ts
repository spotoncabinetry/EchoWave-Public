import OpenAI from 'openai';
import { environment } from '@/config/environment';

// Create OpenAI client with environment variables
export const openai = new OpenAI({
  apiKey: environment.openai.apiKey,
  organization: environment.openai.organization,
});

// Helper function for chat completions
export async function createChatCompletion(
  messages: OpenAI.Chat.ChatCompletionMessageParam[],
  options: Partial<OpenAI.Chat.ChatCompletionCreateParams> = {}
) {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages,
      temperature: 0.7,
      max_tokens: 500,
      ...options,
    });

    return response.choices[0].message;
  } catch (error) {
    console.error('OpenAI API Error:', error);
    throw error;
  }
}
