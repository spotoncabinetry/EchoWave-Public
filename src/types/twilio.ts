import type { Twilio } from 'twilio';

export type TwilioCallOptions = Twilio.CallListInstanceCreateOptions;
export type TwilioMessageOptions = Twilio.MessageListInstanceCreateOptions;

export interface TwilioConfig {
  accountSid: string;
  authToken: string;
  phoneNumber: string;
}
