/**
 * Customer Order Confirmation Email Template
 */

export const getOrderConfirmationTemplate = ({ order, user, store }) => {
  const isPickup = order.fulfillmentType === 'pickup';
  const orderNumber = order._id.toString().slice(-8).toUpperCase();
  const subject = `Order Confirmed #${orderNumber} — Mini D-Mart`;

  const itemsListText = (order.items || [])
    .map((item, idx) => {
      const prodName = item.productId?.name || item.name || `Item #${idx + 1}`;
      const price = item.priceAtOrder || item.price || 0;
      return `- ${prodName} x ${item.qty} (₹${(price * item.qty).toFixed(2)})`;
    })
    .join('\n');

  const fulfillmentInfoText = isPickup
    ? `Fulfillment: STORE PICKUP\nStore: ${store?.name || 'Local Store'}\nAddress: ${store?.address?.street || ''}, ${store?.address?.city || ''}`
    : `Fulfillment: HOME DELIVERY\nAddress: ${order.address?.street || ''}, ${order.address?.city || ''}, ${order.address?.pincode || ''}`;

  const text = `
Hello ${user?.name || 'Valued Customer'},

Thank you for shopping with Mini D-Mart! Your order has been placed successfully.

Order Summary: #${orderNumber}
------------------------------------------
${fulfillmentInfoText}

Items:
${itemsListText}

Subtotal: ₹${(order.subtotal || 0).toFixed(2)}
Tax: ₹${(order.taxAmount || 0).toFixed(2)}
Delivery Fee: ₹${(order.deliveryFee || 0).toFixed(2)}
Total Amount: ₹${(order.totalAmount || 0).toFixed(2)}
------------------------------------------

You can track your order status in your Mini D-Mart account.

Thank you,
Mini D-Mart Team
  `.trim();

  const itemsHtml = (order.items || [])
    .map((item, idx) => {
      const prodName = item.productId?.name || item.name || `Product Item #${idx + 1}`;
      const unitPrice = item.priceAtOrder || item.price || 0;
      const lineTotal = unitPrice * item.qty;
      return `
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 10px 0; color: #1e293b; font-size: 14px;">${prodName}</td>
          <td style="padding: 10px 0; text-align: center; color: #64748b; font-size: 14px;">${item.qty}</td>
          <td style="padding: 10px 0; text-align: right; font-weight: 600; color: #1e293b; font-size: 14px;">₹${lineTotal.toFixed(2)}</td>
        </tr>
      `;
    })
    .join('');

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
    .content { padding: 24px; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase; }
    .badge-pickup { background: #e0f2fe; color: #0284c7; }
    .badge-delivery { background: #fef3c7; color: #d97706; }
    .info-card { background: #f8fafc; border-radius: 12px; padding: 16px; margin: 16px 0; border: 1px solid #e2e8f0; font-size: 13px; line-height: 1.6; }
    .items-table { width: 100%; border-collapse: collapse; margin: 16px 0; }
    .summary-row { display: flex; justify-content: space-between; font-size: 13px; color: #64748b; margin-bottom: 6px; }
    .total-row { display: flex; justify-content: space-between; font-size: 16px; font-weight: 700; color: #059669; padding-top: 10px; border-top: 2px solid #e2e8f0; margin-top: 8px; }
    .footer { padding: 20px; background: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #64748b; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🛒 Order Confirmed!</h1>
      <p style="margin: 4px 0 0 0; opacity: 0.9; font-size: 13px;">Order #${orderNumber}</p>
    </div>
    <div class="content">
      <p style="font-size: 15px; margin-top: 0;">Hi <strong>${user?.name || 'Customer'}</strong>,</p>
      <p style="color: #475569; font-size: 13px;">
        Your order has been received and is being prepared for fulfillment.
      </p>

      <div class="info-card">
        <div style="margin-bottom: 8px;">
          <span class="badge ${isPickup ? 'badge-pickup' : 'badge-delivery'}">
            ${isPickup ? '🏪 Store Pickup' : '🚚 Home Delivery'}
          </span>
        </div>
        ${
          isPickup
            ? `<strong>Pickup Store:</strong> ${store?.name || 'Selected Branch'}<br>
               <strong>Location:</strong> ${store?.address?.street || ''}, ${store?.address?.city || ''}`
            : `<strong>Delivery Address:</strong> ${order.address?.street || ''}, ${order.address?.city || ''}, ${order.address?.state || ''} - ${order.address?.pincode || ''}`
        }
      </div>

      <table class="items-table">
        <thead>
          <tr style="border-bottom: 2px solid #e2e8f0; color: #64748b; font-size: 11px; text-transform: uppercase;">
            <th style="text-align: left; padding-bottom: 8px;">Product</th>
            <th style="text-align: center; padding-bottom: 8px;">Qty</th>
            <th style="text-align: right; padding-bottom: 8px;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <div style="background: #f8fafc; border-radius: 12px; padding: 16px; border: 1px solid #e2e8f0;">
        <div class="summary-row"><span>Subtotal:</span><span>₹${(order.subtotal || 0).toFixed(2)}</span></div>
        <div class="summary-row"><span>GST & Taxes (5%):</span><span>₹${(order.taxAmount || 0).toFixed(2)}</span></div>
        <div class="summary-row"><span>Delivery Charges:</span><span>${order.deliveryFee ? `₹${order.deliveryFee.toFixed(2)}` : 'FREE'}</span></div>
        <div class="total-row"><span>Total Paid:</span><span>₹${(order.totalAmount || 0).toFixed(2)}</span></div>
      </div>
    </div>
    <div class="footer">
      Thank you for choosing Mini D-Mart! &bull; Order #${orderNumber}
    </div>
  </div>
</body>
</html>
  `.trim();

  return { subject, html, text };
};
