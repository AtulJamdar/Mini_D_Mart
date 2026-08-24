import twilio from 'twilio';

let cachedClient = null;
let cachedConfigKey = null;

/**
 * Configure Twilio SMS Client dynamically from environment variables
 * Evaluated on-demand so it always reads process.env after dotenv.config() loads.
 */
export const getTwilioConfig = () => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
  const rawFromNumber = process.env.TWILIO_PHONE_NUMBER?.trim();
  const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID?.trim();

  if (accountSid && authToken && (rawFromNumber || verifyServiceSid)) {
    const configKey = `${accountSid}:${authToken}:${rawFromNumber}:${verifyServiceSid}`;
    if (cachedClient && cachedConfigKey === configKey) {
      return cachedClient;
    }

    try {
      const client = twilio(accountSid, authToken);

      let fromNumber = rawFromNumber;
      if (fromNumber && !fromNumber.startsWith('+')) {
        if (fromNumber.startsWith('1') || /^(800|888|877|866|855|844|833)/.test(fromNumber)) {
          fromNumber = `+1${fromNumber.replace(/^1/, '')}`;
        } else if (fromNumber.length === 10) {
          fromNumber = `+91${fromNumber}`;
        } else {
          fromNumber = `+${fromNumber}`;
        }
      }

      cachedClient = { client, fromNumber, verifyServiceSid };
      cachedConfigKey = configKey;
      return cachedClient;
    } catch (err) {
      console.warn('[TWILIO INIT WARNING] Failed to initialize Twilio client:', err.message);
      return null;
    }
  }

  cachedClient = null;
  cachedConfigKey = null;
  return null;
};

// Helper for resetting cache during testing
export const refreshTwilioClient = () => {
  cachedClient = null;
  cachedConfigKey = null;
  return getTwilioConfig();
};

/**
 * OTP Service for Mini D-Mart
 * Handles dispatching OTPs to users.
 * - If Twilio Verify or Twilio SMS credentials are present: dispatches real SMS.
 * - If Twilio is not configured or if Twilio dispatch fails (e.g. trial account template restriction):
 *   gracefully falls back to console.log dev mode without throwing or breaking the flow.
 */
export const sendOtp = async (phone, otp) => {
  // Normalize destination phone number (ensure international E.164 format e.g. +91XXXXXXXXXX)
  const rawDigits = phone.replace(/[^\d+]/g, '').trim();
  const cleanPhone = rawDigits.replace(/^\+91/, '').replace(/^\+/, '');
  const formattedPhone = rawDigits.startsWith('+')
    ? rawDigits
    : cleanPhone.length === 10
    ? `+91${cleanPhone}`
    : `+${cleanPhone}`;

  const twilioConfig = getTwilioConfig();

  // 1. Path A: Twilio Verify Service (ideal for OTPs without template errors)
  if (twilioConfig?.client && twilioConfig?.verifyServiceSid) {
    try {
      console.log(`[TWILIO VERIFY] Sending verification via Service ${twilioConfig.verifyServiceSid} to ${formattedPhone}...`);
      const verification = await twilioConfig.client.verify.v2
        .services(twilioConfig.verifyServiceSid)
        .verifications.create({
          to: formattedPhone,
          channel: 'sms',
          customCode: otp,
        });

      console.log(`[TWILIO VERIFY] Verification sent to ${formattedPhone} — Status: ${verification.status}`);
      return {
        success: true,
        phone: cleanPhone,
        verificationSid: verification.sid,
      };
    } catch (err) {
      console.warn(`[TWILIO VERIFY WARNING] ${err.code ? `[Code ${err.code}] ` : ''}${err.message}`);
      console.log(`[DEV OTP] ${formattedPhone}: ${otp}`);
      return {
        success: true,
        phone: cleanPhone,
        fallback: true,
        error: err.message,
      };
    }
  }

  // 2. Path B: Direct Twilio Programmable SMS
  if (twilioConfig?.client && twilioConfig?.fromNumber) {
    try {
      console.log(`[TWILIO SMS] Sending OTP SMS from ${twilioConfig.fromNumber} to ${formattedPhone}...`);
      const message = await twilioConfig.client.messages.create({
        body: `Your Mini D-Mart verification code is ${otp}. Valid for 5 minutes. Do not share this OTP with anyone.`,
        from: twilioConfig.fromNumber,
        to: formattedPhone,
      });

      console.log(`[TWILIO SMS] Successfully sent OTP to ${formattedPhone} — Message SID: ${message.sid}`);
      return {
        success: true,
        phone: cleanPhone,
        messageSid: message.sid,
      };
    } catch (err) {
      // Graceful fallback if Twilio API call fails (e.g. Code 572006 trial account template restriction or unverified trial number)
      console.warn(`[TWILIO SMS WARNING] ${err.code ? `[Code ${err.code}] ` : ''}${err.message}`);
      if (err.code === 572006) {
        console.warn(`[TWILIO TRIAL NOTICE] Twilio Trial accounts sending to India (+91) require an upgraded account or a registered Twilio Verify Service (TWILIO_VERIFY_SERVICE_SID) to send custom text. The code is logged below for instant testing.`);
      }
      console.log(`[DEV OTP] ${formattedPhone}: ${otp}`);
      return {
        success: true,
        phone: cleanPhone,
        fallback: true,
        error: err.message,
      };
    }
  }

  // 3. Safe development / non-configured fallback path
  console.log(`[DEV OTP] ${formattedPhone}: ${otp}`);

  return {
    success: true,
    phone: cleanPhone,
    devMode: true,
  };
};

export default {
  sendOtp,
  getTwilioConfig,
  refreshTwilioClient,
};
