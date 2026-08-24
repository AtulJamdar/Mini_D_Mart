/**
 * Low Stock Inventory Alert Email Template
 */

export const getLowStockAlertTemplate = ({
  product,
  store,
  currentStock,
  threshold = 5,
}) => {
  const isOutOfStock = currentStock <= 0;
  const severityLabel = isOutOfStock ? 'OUT OF STOCK' : 'LOW STOCK ALERT';
  const subject = `⚠️ [${severityLabel}] ${product.name} at ${store?.name || 'Store Branch'}`;

  const text = `
Inventory Alert: ${severityLabel}
------------------------------------------
Product: ${product.name}
Store / Branch: ${store?.name || 'Unassigned / All'}
Current Available Units: ${currentStock} ${product.unit || 'units'}
Reorder Threshold: ${threshold} units
Status: ${isOutOfStock ? 'CRITICAL - Out of Stock' : 'Low Inventory - Reorder Recommended'}
------------------------------------------

Please review inventory levels and replenish stock via the Mini D-Mart Store Manager Portal.

Regards,
Mini D-Mart Inventory Automation System
  `.trim();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 20px; }
    .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; }
    .header { background: ${isOutOfStock ? '#dc2626' : '#d97706'}; padding: 24px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0; font-size: 20px; font-weight: 700; }
    .content { padding: 24px; }
    .stock-box { background: ${isOutOfStock ? '#fef2f2' : '#fffbeb'}; border: 1px solid ${isOutOfStock ? '#fca5a5' : '#fde68a'}; border-radius: 12px; padding: 20px; margin: 16px 0; }
    .stat-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; }
    .stat-row:last-child { margin-bottom: 0; }
    .stat-label { font-weight: 600; color: #64748b; }
    .stat-val { font-weight: 700; color: #0f172a; }
    .stat-critical { color: ${isOutOfStock ? '#dc2626' : '#d97706'}; font-weight: 800; }
    .footer { padding: 16px 24px; background: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #64748b; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⚠️ ${severityLabel}</h1>
      <p style="margin: 4px 0 0 0; opacity: 0.9; font-size: 13px;">Branch Inventory Management Notification</p>
    </div>
    <div class="content">
      <p style="font-size: 15px; margin-top: 0;">Attention Store Operations Team,</p>
      <p style="color: #475569; font-size: 13px; line-height: 1.5;">
        The inventory for <strong>${product.name}</strong> has dropped below the threshold and requires replenishment.
      </p>

      <div class="stock-box">
        <div class="stat-row"><span class="stat-label">Product:</span> <span class="stat-val">${product.name}</span></div>
        <div class="stat-row"><span class="stat-label">Store Location:</span> <span class="stat-val">${store?.name || 'Local Store'}</span></div>
        <div class="stat-row"><span class="stat-label">Remaining Stock:</span> <span class="stat-critical">${currentStock} ${product.unit || 'units'}</span></div>
        <div class="stat-row"><span class="stat-label">Alert Trigger Threshold:</span> <span class="stat-val">${threshold} units</span></div>
      </div>

      <p style="font-size: 13px; color: #64748b;">
        Please log into the Store Manager Portal to update supplier purchase orders and replenish stock levels.
      </p>
    </div>
    <div class="footer">
      Mini D-Mart Inventory Sentinel &copy; ${new Date().getFullYear()}
    </div>
  </div>
</body>
</html>
  `.trim();

  return { subject, html, text };
};
