import { jest } from '@jest/globals';
import otpService, { sendOtp, refreshTwilioClient } from '../src/services/otpService.js';

describe('OTP Service & Twilio SMS Dispatch Tests', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.TWILIO_ACCOUNT_SID;
    delete process.env.TWILIO_AUTH_TOKEN;
    delete process.env.TWILIO_PHONE_NUMBER;
    refreshTwilioClient();
  });

  afterAll(() => {
    process.env = originalEnv;
    refreshTwilioClient();
  });

  test('sendOtp fallbacks to dev console log when Twilio is unconfigured without throwing', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    const result = await sendOtp('9876543210', '456789');

    expect(result.success).toBe(true);
    expect(result.devMode).toBe(true);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('[DEV OTP] +919876543210: 456789'));

    consoleSpy.mockRestore();
  });

  test('sendOtp handles 10-digit number normalization cleanly', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    const result = await sendOtp('+919876543210', '112233');

    expect(result.success).toBe(true);
    expect(result.phone).toBe('9876543210');
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('+919876543210: 112233'));

    consoleSpy.mockRestore();
  });

  test('sendOtp gracefully catches Twilio API failure and falls back to console log without throwing', async () => {
    process.env.TWILIO_ACCOUNT_SID = 'AC_TEST_ACCOUNT_SID_MOCK_12345';
    process.env.TWILIO_AUTH_TOKEN = 'test_auth_token_mock_12345';
    process.env.TWILIO_PHONE_NUMBER = '+15551234567';

    const config = refreshTwilioClient();
    expect(config).toBeDefined();

    // Mock Twilio messages.create to simulate an API error (e.g. unverified number on trial account)
    jest.spyOn(config.client.messages, 'create').mockRejectedValueOnce(
      new Error('The number is unverified. Trial accounts cannot send to unverified numbers.')
    );

    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    const result = await sendOtp('9876543210', '654321');

    expect(result.success).toBe(true);
    expect(result.fallback).toBe(true);
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('[TWILIO SMS WARNING]'));
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('[DEV OTP] +919876543210: 654321'));

    warnSpy.mockRestore();
    logSpy.mockRestore();
  });

  test('sendOtp dispatches successfully when Twilio API call resolves', async () => {
    process.env.TWILIO_ACCOUNT_SID = 'AC_TEST_ACCOUNT_SID_MOCK_12345';
    process.env.TWILIO_AUTH_TOKEN = 'test_auth_token_mock_12345';
    process.env.TWILIO_PHONE_NUMBER = '+15551234567';

    const config = refreshTwilioClient();
    expect(config).toBeDefined();

    jest.spyOn(config.client.messages, 'create').mockResolvedValueOnce({
      sid: 'SM_TEST_MOCK_MESSAGE_SID_123',
    });

    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    const result = await sendOtp('9876543210', '998877');

    expect(result.success).toBe(true);
    expect(result.messageSid).toBe('SM_TEST_MOCK_MESSAGE_SID_123');
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Successfully sent OTP to +919876543210'));

    logSpy.mockRestore();
  });
});
