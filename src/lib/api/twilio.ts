import twilio from 'twilio';
import { environment } from '@/config/environment';
import { TwilioCallOptions, TwilioMessageOptions } from '@/types/twilio';

// Create Twilio client with environment variables
export const twilioClient = twilio(
  environment.twilio.accountSid,
  environment.twilio.authToken
);

// Helper function to send SMS
export async function sendSMS(
  to: string,
  body: string,
  options: Partial<TwilioMessageOptions> = {}
) {
  try {
    const message = await twilioClient.messages.create({
      to,
      from: environment.twilio.phoneNumber,
      body,
      ...options,
    });

    return message;
  } catch (error) {
    console.error('Twilio API Error:', error);
    throw error;
  }
}

// Helper function to initiate a call
export async function initiateCall(
  to: string,
  twimlUrl: string,
  options: Partial<TwilioCallOptions> = {}
) {
  try {
    const call = await twilioClient.calls.create({
      to,
      from: environment.twilio.phoneNumber,
      url: twimlUrl,
      ...options,
    });

    return call;
  } catch (error) {
    console.error('Twilio API Error:', error);
    throw error;
  }
}
