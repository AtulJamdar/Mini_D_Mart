import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { useAuth } from '../context/AuthContext';
import PhoneStep from './auth/PhoneStep';
import NameStep from './auth/NameStep';
import OtpStep from './auth/OtpStep';

export default function PhoneAuthFlow({ onSuccess }) {
  // Screen steps: 1 = Phone Entry, 2 = Name Entry (New Users Only), 3 = OTP Entry
  const [step, setStep] = useState(1);

  // Form state held locally across all 3 screens without DB mutation
  const [phone, setPhone] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [otp, setOtp] = useState('');
  const [isNewUser, setIsNewUser] = useState(false);

  // UI & network state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [countdown, setCountdown] = useState(44);
  const [canResend, setCanResend] = useState(false);

  const { requestOtp, verifyOtp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const timerRef = useRef(null);

  const redirectPath = location.state?.from?.pathname || '/';

  // 10-digit validation check
  const isPhoneValid = /^\d{10}$/.test(phone.trim());

  // Countdown timer for Screen 3
  useEffect(() => {
    if (step === 3) {
      setCountdown(44);
      setCanResend(false);

      if (timerRef.current) clearInterval(timerRef.current);

      timerRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [step]);

  // Handle phone input formatting (digits only, max 10)
  const handlePhoneChange = (e) => {
    const rawVal = e.target.value.replace(/\D/g, '').slice(0, 10);
    setPhone(rawVal);
    setError('');
  };

  // Screen 1 -> Screen 2 or 3: Request OTP
  const handleContinuePhone = async (e) => {
    if (e) e.preventDefault();
    if (!isPhoneValid) return;

    setError('');
    setInfoMessage('');
    setLoading(true);

    try {
      const result = await requestOtp(phone);
      if (result.success) {
        const isNew = result.data?.isNewUser;
        setIsNewUser(!!isNew);

        if (isNew) {
          // Screen 2: New user needs to provide First Name + Last Name
          setStep(2);
        } else {
          // Screen 3: Existing user skips Screen 2 and goes straight to OTP
          setStep(3);
        }
      } else {
        setError(result.error || 'Failed to send OTP. Please check your phone number.');
      }
    } catch (err) {
      setError(err.message || 'Network error requesting OTP.');
    } finally {
      setLoading(false);
    }
  };

  // Screen 2 -> Screen 3: Save Name and Continue
  const handleSaveAndContinue = (e) => {
    if (e) e.preventDefault();
    setError('');

    if (!firstName.trim() || !lastName.trim()) {
      setError('Please fill in both First Name and Last Name.');
      return;
    }

    // Advance to Screen 3 without saving to DB yet
    setStep(3);
  };

  // Resend OTP in Screen 3
  const handleResendOtp = async () => {
    if (!canResend || loading) return;

    setError('');
    setInfoMessage('');
    setLoading(true);

    try {
      const result = await requestOtp(phone);
      if (result.success) {
        setInfoMessage('A new OTP has been sent via SMS.');
        setCountdown(44);
        setCanResend(false);

        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timerRef.current);
              setCanResend(true);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        setError(result.error || 'Failed to resend OTP. Please try again.');
      }
    } catch (err) {
      setError(err.message || 'Failed to resend OTP.');
    } finally {
      setLoading(false);
    }
  };

  // Screen 3: Verify OTP and finalize Registration/Login
  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    if (!otp.trim()) {
      setError('Please enter the 6-digit OTP.');
      return;
    }

    setError('');
    setInfoMessage('');
    setLoading(true);

    try {
      const result = await verifyOtp({
        phone,
        otp: otp.trim(),
        firstName: isNewUser ? firstName.trim() : undefined,
        lastName: isNewUser ? lastName.trim() : undefined,
      });

      if (result.success) {
        if (onSuccess) {
          onSuccess(result.user);
        } else {
          navigate(redirectPath, { replace: true });
        }
      } else {
        setError(result.error || 'Invalid OTP. Please check and try again.');
      }
    } catch (err) {
      setError(err.message || 'OTP verification error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      {/* Error alert */}
      {error && (
        <div
          data-testid="auth-error-alert"
          className="mb-5 p-3.5 rounded-xl bg-error/10 border border-error/20 text-error text-xs font-medium flex items-center gap-2 animate-fadeIn"
        >
          <span className="text-base">⚠️</span>
          <span className="flex-1">{error}</span>
        </div>
      )}

      {/* Info / Success toast */}
      {infoMessage && (
        <div
          data-testid="auth-info-alert"
          className="mb-5 p-3.5 rounded-xl bg-primary/10 border border-primary/20 text-primary text-xs font-medium flex items-center gap-2 animate-fadeIn"
        >
          <span className="text-base">✅</span>
          <span className="flex-1">{infoMessage}</span>
        </div>
      )}

      {/* Screen 1 */}
      {step === 1 && (
        <PhoneStep
          phone={phone}
          onPhoneChange={handlePhoneChange}
          onSubmit={handleContinuePhone}
          isPhoneValid={isPhoneValid}
          loading={loading}
        />
      )}

      {/* Screen 2 */}
      {step === 2 && (
        <NameStep
          firstName={firstName}
          lastName={lastName}
          onFirstNameChange={(e) => {
            setFirstName(e.target.value);
            setError('');
          }}
          onLastNameChange={(e) => {
            setLastName(e.target.value);
            setError('');
          }}
          onSubmit={handleSaveAndContinue}
          onGoBack={() => {
            setError('');
            setStep(1);
          }}
        />
      )}

      {/* Screen 3 */}
      {step === 3 && (
        <OtpStep
          phone={phone}
          otp={otp}
          onOtpChange={(e) => {
            const val = e.target.value.replace(/\D/g, '').slice(0, 6);
            setOtp(val);
            setError('');
          }}
          countdown={countdown}
          canResend={canResend}
          loading={loading}
          onResendOtp={handleResendOtp}
          onSubmit={handleVerifyOtp}
          onGoBack={() => {
            setError('');
            if (isNewUser) {
              setStep(2);
            } else {
              setStep(1);
            }
          }}
        />
      )}
    </div>
  );
}
