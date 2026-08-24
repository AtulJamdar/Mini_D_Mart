import nodemailer from 'nodemailer';
import { getStaffInviteTemplate } from '../emails/staffInvite.js';
import { getOrderConfirmationTemplate } from '../emails/orderConfirmation.js';
import { getLowStockAlertTemplate } from '../emails/lowStockAlert.js';

/**
 * Configure Nodemailer SMTP Transporter
 * Wires up environment variables SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS
 */
const createTransporter = () => {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT, 10) || 587;
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user) {
    return nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass,
      },
    });
  }

  // Null indicates fallback to dev mock logging mode
  return null;
};

let transporter = createTransporter();

// Helper to refresh transporter if env vars are dynamically provided during testing/runtime
export const refreshTransporter = () => {
  transporter = createTransporter();
  return transporter;
};

/**
 * Core sendEmail dispatcher
 * Handles real SMTP dispatch when configured, or safe mock console logging in dev/test.
 */
export const sendEmail = async ({ to, subject, text, html }) => {
  const fromEmail = process.env.SMTP_FROM_EMAIL || 'noreply@mini-dmart.com';
  const fromName = process.env.SMTP_FROM_NAME || 'Mini D-Mart';
  const from = `"${fromName}" <${fromEmail}>`;

  if (!to) {
    console.warn('[EMAIL SERVICE WARNING] Attempted to send email without recipient address.');
    return { success: false, error: 'Recipient address missing' };
  }

  // 1. Real SMTP transport path
  if (transporter) {
    try {
      const info = await transporter.sendMail({
        from,
        to,
        subject,
        text,
        html,
      });
      return {
        success: true,
        to,
        subject,
        messageId: info.messageId,
      };
    } catch (err) {
      console.error(`[EMAIL SERVICE ERROR] SMTP delivery failed to ${to}:`, err.message);
      // Do not rethrow - return error object so caller flow (checkout, user create) is not interrupted
      return {
        success: false,
        to,
        subject,
        error: err.message,
      };
    }
  }

  // 2. Local development fallback (Console stub)
  console.log(`[EMAIL SERVICE] Email sent to ${to} — Subject: "${subject}"`);
  return {
    success: true,
    to,
    subject,
    messageId: `dev-mock-${Date.now()}`,
    simulated: true,
  };
};

/**
 * Send Staff Invitation & Onboarding Email
 */
export const sendStaffInviteEmail = async ({
  email,
  name,
  role,
  storeName,
  loginUrl = process.env.FRONTEND_URL || 'http://localhost:5173/login',
  tempPassword,
}) => {
  const template = getStaffInviteTemplate({
    name,
    email,
    role,
    storeName,
    loginUrl,
    tempPassword,
  });

  return sendEmail({
    to: email,
    subject: template.subject,
    text: template.text,
    html: template.html,
  });
};

/**
 * Send Order Confirmation Email to Customer
 */
export const sendOrderConfirmationEmail = async ({ order, user, store }) => {
  if (!user?.email) {
    console.warn(`[EMAIL SERVICE] Skipped order confirmation email for order #${order._id}: Customer has no registered email.`);
    return { success: false, reason: 'No customer email' };
  }

  const template = getOrderConfirmationTemplate({ order, user, store });

  return sendEmail({
    to: user.email,
    subject: template.subject,
    text: template.text,
    html: template.html,
  });
};

/**
 * Send Low Stock Alert Email to Operations / Store Manager
 */
export const sendLowStockAlert = async ({
  product,
  store,
  currentStock,
  threshold = 5,
  recipientEmail,
}) => {
  const targetEmail = recipientEmail || process.env.ADMIN_ALERT_EMAIL || 'inventory@mini-dmart.com';
  const template = getLowStockAlertTemplate({
    product,
    store,
    currentStock,
    threshold,
  });

  return sendEmail({
    to: targetEmail,
    subject: template.subject,
    text: template.text,
    html: template.html,
  });
};

export default {
  sendEmail,
  sendStaffInviteEmail,
  sendOrderConfirmationEmail,
  sendLowStockAlert,
  refreshTransporter,
};
