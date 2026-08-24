import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router';
import PhoneAuthFlow from '../components/PhoneAuthFlow';
import AuthContext from '../context/AuthContext';

describe('Customer Registration/Login Phone + OTP 3-Screen Flow Tests', () => {
  let mockRequestOtp;
  let mockVerifyOtp;
  let mockOnSuccess;

  beforeEach(() => {
    mockRequestOtp = vi.fn();
    mockVerifyOtp = vi.fn();
    mockOnSuccess = vi.fn();
  });

  const renderComponent = (authOverrides = {}) => {
    const authValue = {
      user: null,
      loading: false,
      error: null,
      requestOtp: mockRequestOtp,
      verifyOtp: mockVerifyOtp,
      isAuthenticated: false,
      ...authOverrides,
    };

    return render(
      <AuthContext.Provider value={authValue}>
        <BrowserRouter>
          <PhoneAuthFlow onSuccess={mockOnSuccess} />
        </BrowserRouter>
      </AuthContext.Provider>
    );
  };

  test('Screen 1: Phone validation and button enabling', async () => {
    renderComponent();

    expect(screen.getByTestId('screen-1-phone')).toBeInTheDocument();
    const phoneInput = screen.getByPlaceholderText('9876543210');
    const continueBtn = screen.getByTestId('continue-btn');

    // Initially disabled (empty)
    expect(continueBtn).toBeDisabled();

    // Partial phone number (less than 10 digits)
    fireEvent.change(phoneInput, { target: { value: '98765' } });
    expect(continueBtn).toBeDisabled();

    // 10 digits
    fireEvent.change(phoneInput, { target: { value: '9876543210' } });
    expect(continueBtn).not.toBeDisabled();
  });

  test('New User Flow: Screen 1 -> Screen 2 ("Help Us Know You Better") -> Screen 3 (OTP)', async () => {
    mockRequestOtp.mockResolvedValue({
      success: true,
      data: { phone: '9876543210', isNewUser: true },
    });
    mockVerifyOtp.mockResolvedValue({
      success: true,
      user: { _id: 'u1', name: 'Aarav Gupta', phone: '9876543210', role: 'customer' },
    });

    renderComponent();

    const phoneInput = screen.getByPlaceholderText('9876543210');
    const continueBtn = screen.getByTestId('continue-btn');

    // 1. Enter phone and click Continue
    fireEvent.change(phoneInput, { target: { value: '9876543210' } });
    fireEvent.click(continueBtn);

    // 2. Expect Screen 2 to appear with "Help Us Know You Better"
    await waitFor(() => {
      expect(screen.getByTestId('screen-2-name')).toBeInTheDocument();
    });
    expect(screen.getByText('Help Us Know You Better')).toBeInTheDocument();

    // Verify red "Required" chips are visible when fields are empty
    expect(screen.getByTestId('firstname-required-chip')).toBeInTheDocument();
    expect(screen.getByTestId('lastname-required-chip')).toBeInTheDocument();

    const saveBtn = screen.getByTestId('save-continue-btn');
    expect(saveBtn).toBeDisabled();

    // Fill in First Name
    const firstNameInput = screen.getByPlaceholderText('e.g. Ramesh');
    fireEvent.change(firstNameInput, { target: { value: 'Aarav' } });
    expect(screen.queryByTestId('firstname-required-chip')).not.toBeInTheDocument();
    expect(saveBtn).toBeDisabled(); // Still disabled because last name is empty

    // Fill in Last Name
    const lastNameInput = screen.getByPlaceholderText('e.g. Sharma');
    fireEvent.change(lastNameInput, { target: { value: 'Gupta' } });
    expect(screen.queryByTestId('lastname-required-chip')).not.toBeInTheDocument();
    expect(saveBtn).not.toBeDisabled();

    // Click "Save and Continue" to go to Screen 3
    fireEvent.click(saveBtn);

    // 3. Expect Screen 3 to appear with OTP entry and phone info
    await waitFor(() => {
      expect(screen.getByTestId('screen-3-otp')).toBeInTheDocument();
    });
    expect(screen.getByText(/OTP Sent via SMS to/i)).toBeInTheDocument();
    expect(screen.getByText('+91 9876543210')).toBeInTheDocument();
    expect(screen.getByText(/Resend via SMS in/i)).toBeInTheDocument();

    // Verify OTP input & submission
    const otpInput = screen.getByPlaceholderText('••••••');
    const verifyBtn = screen.getByTestId('verify-otp-btn');
    expect(verifyBtn).toBeDisabled();

    fireEvent.change(otpInput, { target: { value: '654321' } });
    expect(verifyBtn).not.toBeDisabled();

    fireEvent.click(verifyBtn);

    await waitFor(() => {
      expect(mockVerifyOtp).toHaveBeenCalledWith({
        phone: '9876543210',
        otp: '654321',
        firstName: 'Aarav',
        lastName: 'Gupta',
      });
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  test('Existing User Flow: Screen 1 -> Screen 3 directly (skipping Screen 2)', async () => {
    mockRequestOtp.mockResolvedValue({
      success: true,
      data: { phone: '9876543210', isNewUser: false },
    });

    renderComponent();

    const phoneInput = screen.getByPlaceholderText('9876543210');
    fireEvent.change(phoneInput, { target: { value: '9876543210' } });
    fireEvent.click(screen.getByTestId('continue-btn'));

    // Should skip Screen 2 and directly show Screen 3
    await waitFor(() => {
      expect(screen.getByTestId('screen-3-otp')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('screen-2-name')).not.toBeInTheDocument();
    expect(screen.getByText(/OTP Sent via SMS to/i)).toBeInTheDocument();
  });

  test('Navigation: Go Back links work across screens', async () => {
    // 1. New user navigation
    mockRequestOtp.mockResolvedValue({
      success: true,
      data: { phone: '9876543210', isNewUser: true },
    });

    renderComponent();

    fireEvent.change(screen.getByPlaceholderText('9876543210'), { target: { value: '9876543210' } });
    fireEvent.click(screen.getByTestId('continue-btn'));

    await waitFor(() => expect(screen.getByTestId('screen-2-name')).toBeInTheDocument());

    // Click Go Back from Screen 2 to Screen 1
    fireEvent.click(screen.getByTestId('screen2-goback'));
    expect(screen.getByTestId('screen-1-phone')).toBeInTheDocument();
  });
});
