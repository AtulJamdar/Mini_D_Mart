/**
 * Staff Invitation Email Template
 */

export const getStaffInviteTemplate = ({
  name,
  email,
  role,
  storeName,
  loginUrl = process.env.FRONTEND_URL || 'http://localhost:5173/login',
  tempPassword,
}) => {
  const roleLabel = role === 'store_manager' ? 'Store Manager' : 'Store Staff';
  const branchLabel = storeName ? ` at the ${storeName} branch` : '';
  const subject = `Welcome to Mini D-Mart — Your ${roleLabel} Account Details`;

  const text = `
Hello ${name},

You have been invited to join Mini D-Mart as ${roleLabel}${branchLabel}.

Your Account Login Details:
------------------------------------------
Email: ${email}
Temporary Password: ${tempPassword}
Login URL: ${loginUrl}
------------------------------------------

Please log in using the link above and update your password upon your first sign-in.

Regards,
Mini D-Mart Administration Team
  `.trim();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 20px; }
    .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; }
    .header { background: #059669; padding: 24px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0; font-size: 22px; font-weight: 700; }
    .content { padding: 32px 24px; }
    .credentials { background: #f1f5f9; border-radius: 12px; padding: 20px; margin: 20px 0; border: 1px dashed #cbd5e1; }
    .cred-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; }
    .cred-row:last-child { margin-bottom: 0; }
    .cred-label { font-weight: 600; color: #64748b; }
    .cred-val { font-weight: 700; color: #0f172a; font-family: monospace; }
    .btn { display: inline-block; background: #059669; color: #ffffff !important; text-decoration: none; padding: 12px 28px; border-radius: 10px; font-weight: 600; font-size: 14px; margin-top: 10px; }
    .footer { padding: 20px 24px; background: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #64748b; }
    .notice { font-size: 13px; color: #64748b; margin-top: 16px; line-height: 1.5; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🛒 Mini D-Mart Staff Onboarding</h1>
    </div>
    <div class="content">
      <p style="font-size: 16px; margin-top: 0;">Hello <strong>${name}</strong>,</p>
      <p style="color: #475569; font-size: 14px; line-height: 1.5;">
        You have been registered as an authorized <strong>${roleLabel}</strong>${branchLabel} on Mini D-Mart.
      </p>

      <div class="credentials">
        <div class="cred-row"><span class="cred-label">Login Email:</span> <span class="cred-val">${email}</span></div>
        <div class="cred-row"><span class="cred-label">Temporary Password:</span> <span class="cred-val">${tempPassword}</span></div>
        <div class="cred-row"><span class="cred-label">Assigned Role:</span> <span class="cred-val">${roleLabel}</span></div>
      </div>

      <div style="text-align: center; margin: 24px 0;">
        <a href="${loginUrl}" class="btn">Access Employee Portal</a>
      </div>

      <p class="notice">
        🔒 <em>Security Notice:</em> Your account requires a password change upon initial sign-in. Never share your temporary credentials with anyone.
      </p>
    </div>
    <div class="footer">
      Mini D-Mart &copy; ${new Date().getFullYear()} Management & Fulfillment Systems
    </div>
  </div>
</body>
</html>
  `.trim();

  return { subject, html, text };
};
