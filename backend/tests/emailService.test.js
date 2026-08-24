import emailService, { refreshTransporter } from '../src/services/emailService.js';
import { getStaffInviteTemplate } from '../src/emails/staffInvite.js';
import { getOrderConfirmationTemplate } from '../src/emails/orderConfirmation.js';
import { getLowStockAlertTemplate } from '../src/emails/lowStockAlert.js';

describe('Email Service & Template Tests', () => {
  const origEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...origEnv };
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;
    refreshTransporter();
  });

  afterAll(() => {
    process.env = origEnv;
    refreshTransporter();
  });

  test('Staff Invite Template generates valid subject, text and HTML', () => {
    const template = getStaffInviteTemplate({
      name: 'Rohan Sharma',
      email: 'rohan.sharma@example.com',
      role: 'store_manager',
      storeName: 'Pune Kothrud Branch',
      loginUrl: 'http://localhost:5173/login',
      tempPassword: 'SecureTempPass123!',
    });

    expect(template.subject).toMatch(/Store Manager/i);
    expect(template.text).toContain('rohan.sharma@example.com');
    expect(template.text).toContain('SecureTempPass123!');
    expect(template.text).toContain('http://localhost:5173/login');
    expect(template.html).toContain('Pune Kothrud Branch');
    expect(template.html).toContain('Store Manager');
  });

  test('Order Confirmation Template renders pickup & delivery summary accurately', () => {
    const mockOrder = {
      _id: '64d1f2a3e890b21a8f9c1234',
      fulfillmentType: 'pickup',
      subtotal: 500,
      taxAmount: 25,
      deliveryFee: 0,
      totalAmount: 525,
      items: [
        {
          productId: { name: 'Farm Fresh Whole Milk (1L)' },
          qty: 2,
          priceAtOrder: 64,
        },
      ],
    };
    const mockUser = { name: 'Pooja Verma', email: 'pooja@example.com' };
    const mockStore = {
      name: 'Mumbai Andheri Store',
      address: { street: 'Link Road', city: 'Mumbai' },
    };

    const template = getOrderConfirmationTemplate({
      order: mockOrder,
      user: mockUser,
      store: mockStore,
    });

    expect(template.subject).toMatch(/Order Confirmed/i);
    expect(template.text).toContain('Farm Fresh Whole Milk (1L)');
    expect(template.text).toContain('Mumbai Andheri Store');
    expect(template.text).toContain('525.00');
    expect(template.html).toContain('₹525.00');
    expect(template.html).toContain('Store Pickup');
  });

  test('Low Stock Alert Template flags critical stock and details store location', () => {
    const mockProduct = { name: 'Basmati Rice 5kg', unit: '5kg Bag' };
    const mockStore = { name: 'Thane Central' };

    // 1. Low stock
    const lowStockTemplate = getLowStockAlertTemplate({
      product: mockProduct,
      store: mockStore,
      currentStock: 3,
      threshold: 5,
    });

    expect(lowStockTemplate.subject).toContain('LOW STOCK ALERT');
    expect(lowStockTemplate.text).toContain('Current Available Units: 3 5kg Bag');
    expect(lowStockTemplate.text).toContain('Thane Central');

    // 2. Out of stock
    const outOfStockTemplate = getLowStockAlertTemplate({
      product: mockProduct,
      store: mockStore,
      currentStock: 0,
      threshold: 5,
    });

    expect(outOfStockTemplate.subject).toContain('OUT OF STOCK');
    expect(outOfStockTemplate.text).toContain('CRITICAL - Out of Stock');
    expect(outOfStockTemplate.html).toContain('OUT OF STOCK');
  });

  test('emailService fallbacks to dev console log when SMTP is not configured', async () => {
    const res = await emailService.sendEmail({
      to: 'staff@example.com',
      subject: 'Dev Test Email',
      text: 'Sample plain body',
      html: '<p>Sample html body</p>',
    });

    expect(res.success).toBe(true);
    expect(res.simulated).toBe(true);
    expect(res.to).toBe('staff@example.com');
  });

  test('emailService handles missing recipient safely without throwing', async () => {
    const res = await emailService.sendEmail({
      to: '',
      subject: 'Missing recipient',
      text: 'Hello',
    });

    expect(res.success).toBe(false);
    expect(res.error).toBeDefined();
  });
});
