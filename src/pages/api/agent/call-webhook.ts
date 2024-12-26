import { NextApiRequest, NextApiResponse } from 'next';
import twilio from 'twilio';
import { validateRequest } from 'twilio/lib/webhooks/webhooks';
import { supabase } from '@/lib/supabase/client';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioClient = twilio(accountSid, authToken);

const callWebhook = async (req: NextApiRequest, res: NextApiResponse) => {
  if (!accountSid || !authToken) {
    console.error('Missing Twilio credentials');
    return res.status(500).json({ error: 'Missing Twilio credentials' });
  }

  // Verify Twilio signature
  const twilioSignature = req.headers['x-twilio-signature'] as string;
  const url = `https://${req.headers.host}${req.url}`;
  const params = req.body;

  if (!validateRequest(authToken, twilioSignature, url, params)) {
    console.error('Twilio signature validation failed.');
    return res.status(400).json({ error: 'Twilio signature validation failed.' });
  }

  try {
    // Get ephemeral token from /api/agent/ephemeral-token
    const tokenResponse = await fetch(
      `https://${req.headers.host}/api/agent/ephemeral-token`
    );
    const { token } = await tokenResponse.json();

    // TODO: Connect to OpenAI Realtime API
    // TODO: Stream audio from Twilio to OpenAI
    // TODO: Handle OpenAI response
    // TODO: Save transcript to Supabase

    // Respond to Twilio with TwiML
    res.setHeader('Content-Type', 'text/xml');
    res.status(200).send(`
      <Response>
        <Start>
          <Stream url="wss://${req.headers.host}/api/agent/call"/>
        </Start>
        <Say>Please wait while we connect you to our AI receptionist.</Say>
        <Pause length="10"/>
      </Response>
    `);
  } catch (error) {
    console.error('Error handling Twilio webhook:', error);
    res.status(500).json({ error: 'Failed to handle Twilio webhook' });
  }
};

export default callWebhook;
