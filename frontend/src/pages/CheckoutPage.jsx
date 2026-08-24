import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router';
import api from '../services/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import SlotPicker from '../components/SlotPicker';

import { Smartphone, CreditCard, Building2, Wallet, ShieldCheck, Check, Lock, Zap } from 'lucide-react';

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      return resolve(true);
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const PAYMENT_METHODS = [
  {
    id: 'upi',
    name: 'UPI (Instant & Free)',
    subtitle: 'Google Pay, PhonePe, Paytm, BHIM & any UPI App',
    badge: 'Fastest & Recommended',
    badgeColor: 'bg-primary/10 text-primary border border-primary/20',
    icon: Smartphone,
    brandPills: ['GPay', 'PhonePe', 'Paytm', 'BHIM'],
  },
  {
    id: 'card',
    name: 'Credit or Debit Card',
    subtitle: 'Visa, MasterCard, RuPay, Maestro & Diners Club',
    badge: '3D Secure OTP',
    badgeColor: 'bg-info/10 text-info border border-info/20',
    icon: CreditCard,
    brandPills: ['Visa', 'Mastercard', 'RuPay'],
  },
  {
    id: 'netbanking',
    name: 'Net Banking',
    subtitle: 'HDFC, SBI, ICICI, Axis, Kotak & 50+ Banks',
    badge: 'Direct Transfer',
    badgeColor: 'bg-accent/10 text-accent border border-accent/20',
    icon: Building2,
    brandPills: ['HDFC', 'SBI', 'ICICI', 'Axis'],
  },
  {
    id: 'wallet',
    name: 'Wallets & Postpaid',
    subtitle: 'Paytm Wallet, Amazon Pay, Mobikwik & PhonePe',
    badge: '1-Click Checkout',
    badgeColor: 'bg-purple-50 text-purple-700 border border-purple-200',
    icon: Wallet,
    brandPills: ['Paytm', 'Amazon Pay', 'Mobikwik'],
  },
];

export default function CheckoutPage() {
  const { cart, fetchCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [fulfillmentType, setFulfillmentType] = useState('pickup');
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [stores, setStores] = useState([]);
  const [selectedStoreId, setSelectedStoreId] = useState('');
  const [slots, setSlots] = useState([]);
  const [selectedSlotId, setSelectedSlotId] = useState('');
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [address, setAddress] = useState({
    street: '',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400001',
  });

  const [submitting, setSubmitting] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [refundNotice, setRefundNotice] = useState('');
  const [paymentDismissed, setPaymentDismissed] = useState(false);
  const [successOrder, setSuccessOrder] = useState(null);

  useEffect(() => {
    const loadStores = async () => {
      try {
        const res = await api.get('/stores');
        if (res.data.success && res.data.data?.length > 0) {
          setStores(res.data.data);
          setSelectedStoreId(res.data.data[0]._id);
        }
      } catch (err) {
        console.error('Failed to load stores:', err.message);
      }
    };
    loadStores();
  }, []);

  useEffect(() => {
    if (!selectedStoreId) return;
    const loadSlots = async () => {
      setSlotsLoading(true);
      setSelectedSlotId('');
      try {
        const res = await api.get(`/stores/${selectedStoreId}/slots`);
        if (res.data.success) {
          setSlots(res.data.data);
          const firstAvailable = res.data.data.find((s) => !s.isFull);
          if (firstAvailable) setSelectedSlotId(firstAvailable._id);
        }
      } catch (err) {
        console.error('Failed to load slots:', err.message);
      } finally {
        setSlotsLoading(false);
      }
    };
    loadSlots();
  }, [selectedStoreId]);

  const handleCheckout = async (e) => {
    if (e) e.preventDefault();
    setErrorMsg('');
    setRefundNotice('');
    setPaymentDismissed(false);

    if (fulfillmentType === 'pickup') {
      if (!selectedStoreId) return setErrorMsg('Please select a pickup store.');
      if (!selectedSlotId) return setErrorMsg('Please select an available pickup slot.');
    } else {
      if (!address.street || !address.city || !address.state || !address.pincode) {
        return setErrorMsg('Please complete all delivery address fields.');
      }
    }

    setSubmitting(true);
    try {
      // 1. Ensure Razorpay SDK is loaded
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        throw new Error('Could not load Razorpay payment SDK. Please check your internet connection.');
      }

      // 2. Initialize checkout session and generate Razorpay order (amount in paise)
      const payload = {
        fulfillmentType,
        storeId: selectedStoreId,
        pickupSlotId: fulfillmentType === 'pickup' ? selectedSlotId : undefined,
        address: fulfillmentType === 'delivery' ? address : undefined,
      };

      const res = await api.post('/payments/razorpay/order', payload);
      if (!res.data.success || !res.data.data?.razorpayOrderId) {
        throw new Error(res.data.message || 'Failed to initialize payment order.');
      }

      const { razorpayOrderId, amount, currency, keyId } = res.data.data;

      // 3. Open Razorpay Checkout modal
      const options = {
        key: keyId,
        amount: amount,
        currency: currency || 'INR',
        name: 'Mini D-Mart',
        description: `Order Checkout (${fulfillmentType === 'pickup' ? 'Store Pickup' : 'Home Delivery'})`,
        order_id: razorpayOrderId,
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
          contact: user?.phone || '',
          method: paymentMethod,
        },
        theme: {
          color: '#16a34a',
        },
        handler: async (response) => {
          setVerifying(true);
          try {
            const verifyRes = await api.post('/payments/razorpay/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            if (verifyRes.data.success) {
              setSuccessOrder(verifyRes.data.data);
              await fetchCart();
            }
          } catch (verifyErr) {
            const errData = verifyErr.response?.data;
            if (errData?.error === 'PAYMENT_AUTO_REFUNDED' || errData?.message?.includes('refund')) {
              setRefundNotice(errData.message);
            } else {
              setErrorMsg(errData?.message || 'Payment verification failed. Please contact customer support.');
            }
          } finally {
            setVerifying(false);
          }
        },
        modal: {
          ondismiss: () => {
            setPaymentDismissed(true);
            setErrorMsg('Payment cancelled or window closed. You can retry placing your order whenever you are ready.');
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (failResponse) => {
        console.error('Payment failed:', failResponse.error);
        setErrorMsg(`Payment failed: ${failResponse.error.description || failResponse.error.reason}`);
        setPaymentDismissed(true);
      });
      rzp.open();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Checkout failed.');
    } finally {
      setSubmitting(false);
    }
  };

  if (successOrder) {
    return (
      <div className="max-w-xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-border text-center space-y-4">
        <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto text-3xl font-bold">
          ✓
        </div>
        <h1 className="text-2xl font-bold text-text">Payment Verified & Order Confirmed!</h1>
        <p className="text-sm text-gray-500">
          Order ID: <span className="font-mono font-bold text-text">{successOrder._id}</span>
        </p>

        {successOrder.paymentDetails?.razorpayPaymentId && (
          <div className="text-[11px] font-mono bg-bg px-3 py-1.5 rounded-lg text-gray-500 inline-block border border-border">
            💳 Payment ID: {successOrder.paymentDetails.razorpayPaymentId}
          </div>
        )}

        <div className="p-4 bg-bg rounded-xl text-left text-xs space-y-2 border border-border">
          <div className="flex justify-between">
            <span className="text-gray-500">Fulfillment Method:</span>
            <span className="font-bold uppercase text-primary">{successOrder.fulfillmentType}</span>
          </div>
          {successOrder.storeId?.name && (
            <div className="flex justify-between">
              <span className="text-gray-500">Store Branch:</span>
              <span className="font-semibold text-text">{successOrder.storeId.name}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-border pt-2">
            <span className="text-gray-500">Total Paid (via Razorpay):</span>
            <span className="font-bold text-base text-text">₹{successOrder.totalAmount?.toFixed(2)}</span>
          </div>
        </div>

        <div className="flex justify-center gap-3 pt-2">
          <Link
            to="/orders"
            className="px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity"
          >
            View My Orders
          </Link>
          <Link
            to="/shop"
            className="px-5 py-2.5 border border-border text-text text-sm font-semibold rounded-xl hover:bg-bg transition-colors"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text">Checkout & Payment</h1>
        <p className="text-sm text-gray-500">Select your fulfillment preference and complete secure Razorpay payment</p>
      </div>

      {refundNotice && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 text-xs font-medium space-y-1">
          <div className="font-bold flex items-center gap-1.5 text-amber-800">
            <span>⚠️</span> Auto-Refund Processed
          </div>
          <div>{refundNotice}</div>
          <div className="text-[11px] text-amber-700">
            The charged amount has been credited back to your original payment method.
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-error/10 border border-error/20 text-error text-xs font-medium flex items-center justify-between">
          <div>{errorMsg}</div>
          {paymentDismissed && (
            <button
              onClick={handleCheckout}
              className="px-3 py-1 bg-error text-white font-bold rounded-lg text-xs hover:opacity-90 transition-opacity ml-3 cursor-pointer whitespace-nowrap"
            >
              Retry Payment
            </button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <form onSubmit={handleCheckout} className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* Fulfillment Selection */}
          <div className="bg-white p-4 sm:p-6 rounded-2xl border border-border shadow-xs space-y-4">
            <h2 className="text-base font-bold text-text">1. Fulfillment Method</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <button
                type="button"
                onClick={() => setFulfillmentType('pickup')}
                className={`p-3.5 sm:p-4 rounded-xl border text-left cursor-pointer transition-all ${
                  fulfillmentType === 'pickup'
                    ? 'border-primary bg-primary/5 text-primary ring-2 ring-primary/20'
                    : 'border-border bg-white text-gray-500 hover:border-gray-300'
                }`}
              >
                <div className="text-2xl mb-1">🏪</div>
                <div className="font-bold text-sm text-text">Store Pickup</div>
                <div className="text-[11px] text-gray-400 mt-0.5">Collect at nearest branch</div>
              </button>

              <button
                type="button"
                onClick={() => setFulfillmentType('delivery')}
                className={`p-3.5 sm:p-4 rounded-xl border text-left cursor-pointer transition-all ${
                  fulfillmentType === 'delivery'
                    ? 'border-primary bg-primary/5 text-primary ring-2 ring-primary/20'
                    : 'border-border bg-white text-gray-500 hover:border-gray-300'
                }`}
              >
                <div className="text-2xl mb-1">🚚</div>
                <div className="font-bold text-sm text-text">Home Delivery</div>
                <div className="text-[11px] text-gray-400 mt-0.5">Free on orders above ₹500</div>
              </button>
            </div>
          </div>

          {/* Location & Slot or Address Details */}
          {fulfillmentType === 'pickup' ? (
            <div className="bg-white p-4 sm:p-6 rounded-2xl border border-border shadow-xs space-y-4">
              <h2 className="text-base font-bold text-text">2. Pickup Store & Slot</h2>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  Select Store Branch
                </label>
                <select
                  value={selectedStoreId}
                  onChange={(e) => setSelectedStoreId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-bg text-text text-sm focus:outline-none focus:border-primary font-medium"
                >
                  {stores.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name} — {s.address.street}, {s.address.city}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  Select Time Slot
                </label>
                <SlotPicker
                  slots={slots}
                  selectedSlotId={selectedSlotId}
                  onSelectSlot={setSelectedSlotId}
                  loading={slotsLoading}
                />
              </div>
            </div>
          ) : (
            <div className="bg-white p-4 sm:p-6 rounded-2xl border border-border shadow-xs space-y-4">
              <h2 className="text-base font-bold text-text">2. Delivery Address</h2>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  Street Address
                </label>
                <input
                  type="text"
                  required
                  value={address.street}
                  onChange={(e) => setAddress({ ...address, street: e.target.value })}
                  placeholder="Flat 4B, Sunrise Apartments, M.G. Road"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-bg text-text text-sm focus:outline-none focus:border-primary"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  required
                  placeholder="City"
                  value={address.city}
                  onChange={(e) => setAddress({ ...address, city: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-bg text-text text-sm focus:outline-none focus:border-primary"
                />
                <input
                  type="text"
                  required
                  placeholder="State"
                  value={address.state}
                  onChange={(e) => setAddress({ ...address, state: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-bg text-text text-sm focus:outline-none focus:border-primary"
                />
                <input
                  type="text"
                  required
                  placeholder="PIN Code"
                  value={address.pincode}
                  onChange={(e) => setAddress({ ...address, pincode: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-bg text-text text-sm focus:outline-none focus:border-primary"
                />
              </div>
            </div>
          )}

          {/* Redesigned 3. Payment Method Section (Flipkart / Amazon style radio cards) */}
          <div className="bg-white p-4 sm:p-6 rounded-2xl border border-border shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-text">3. Select Payment Method</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Choose how you'd like to pay. 100% safe & encrypted transactions powered by Razorpay.
                </p>
              </div>
              <div className="hidden sm:flex items-center gap-1 text-xs text-primary font-bold bg-primary/10 px-2.5 py-1 rounded-full">
                <ShieldCheck className="w-4 h-4" />
                <span>100% Safe Checkout</span>
              </div>
            </div>

            {/* Payment Method Cards List */}
            <div className="space-y-3 pt-1">
              {PAYMENT_METHODS.map((pm) => {
                const isSelected = paymentMethod === pm.id;
                const IconComponent = pm.icon;

                return (
                  <label
                    key={pm.id}
                    className={`p-3.5 sm:p-4 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 block ${
                      isSelected
                        ? 'border-primary bg-primary/5 ring-2 ring-primary/20 shadow-xs'
                        : 'border-border bg-white hover:border-gray-300 hover:bg-bg/40'
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      {/* Custom Radio Circle */}
                      <div className="pt-0.5 shrink-0">
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                            isSelected ? 'border-primary bg-primary text-white' : 'border-gray-300 bg-white'
                          }`}
                        >
                          {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                        </div>
                      </div>

                      {/* Method Icon & Info */}
                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-xs sm:text-sm text-text flex items-center gap-1.5">
                            <IconComponent className={`w-4 h-4 ${isSelected ? 'text-primary' : 'text-gray-500'}`} />
                            <span>{pm.name}</span>
                          </span>
                          {pm.badge && (
                            <span className={`text-[10px] px-2 py-0.2 rounded-full font-bold uppercase tracking-wider ${pm.badgeColor}`}>
                              {pm.badge}
                            </span>
                          )}
                        </div>

                        <p className="text-[11px] text-gray-500 leading-relaxed font-normal">
                          {pm.subtitle}
                        </p>

                        {/* Brand Chips / Pills */}
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          {pm.brandPills.map((pill) => (
                            <span
                              key={pill}
                              className="text-[10px] px-2 py-0.5 rounded-md bg-bg border border-border text-gray-600 font-semibold"
                            >
                              {pill}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Hidden Native Radio Input */}
                    <input
                      type="radio"
                      name="payment_method"
                      value={pm.id}
                      checked={isSelected}
                      onChange={() => setPaymentMethod(pm.id)}
                      className="sr-only"
                    />
                  </label>
                );
              })}
            </div>

            {/* Security Guarantee Strip */}
            <div className="p-3 rounded-xl bg-bg border border-border text-[11px] text-gray-500 flex items-center gap-2">
              <Lock className="w-3.5 h-3.5 text-primary shrink-0" />
              <span>
                Your chosen payment option will be seamlessly pre-selected in the secure Razorpay payment modal.
              </span>
            </div>
          </div>

          {/* Secure Payment Submit Button */}
          <button
            type="submit"
            disabled={submitting || verifying || !cart || cart.items.length === 0}
            className="w-full py-3.5 px-4 bg-primary text-white font-bold rounded-xl hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50 text-sm shadow-xs flex items-center justify-center gap-2"
          >
            {verifying ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                Verifying Payment & Confirming Order...
              </span>
            ) : submitting ? (
              'Opening Razorpay Modal...'
            ) : (
              `🔒 Pay ₹${cart?.total?.toFixed(2) || '0.00'} via ${
                paymentMethod === 'upi'
                  ? 'UPI'
                  : paymentMethod === 'card'
                  ? 'Card'
                  : paymentMethod === 'netbanking'
                  ? 'Net Banking'
                  : 'Wallet'
              } (Razorpay Secure)`
            )}
          </button>
        </form>

        {/* Order Summary Sidebar */}
        <div className="bg-white rounded-2xl border border-border p-6 shadow-xs h-fit space-y-4">
          <h2 className="font-bold text-text text-base border-b border-border pb-3">
            Order Summary ({cart?.itemCount || 0} items)
          </h2>
          <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
            {cart?.items?.map((item) => (
              <div key={item._id || item.productId} className="flex justify-between items-center text-xs">
                <div className="truncate pr-2">
                  <div className="font-semibold text-text truncate">{item.name}</div>
                  <div className="text-gray-500">Qty: {item.qty} × ₹{item.price.toFixed(2)}</div>
                </div>
                <div className="font-bold text-text">₹{(item.price * item.qty).toFixed(2)}</div>
              </div>
            ))}
          </div>
          <div className="border-t border-border pt-3 space-y-2 text-xs">
            <div className="flex justify-between text-gray-500">
              <span>Subtotal</span>
              <span>₹{cart?.subtotal?.toFixed(2) || '0.00'}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>GST (5%)</span>
              <span>₹{cart?.tax?.toFixed(2) || '0.00'}</span>
            </div>
            {fulfillmentType === 'delivery' && (
              <div className="flex justify-between text-gray-500">
                <span>Delivery Fee</span>
                <span>{cart?.subtotal >= 500 ? 'FREE' : '₹30.00'}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-bold text-text pt-2 border-t border-border">
              <span>Total Payable</span>
              <span className="text-primary font-extrabold">₹{cart?.total?.toFixed(2) || '0.00'}</span>
            </div>
          </div>
          <div className="bg-bg p-3 rounded-xl border border-border text-[11px] text-gray-500 space-y-1">
            <div className="font-bold text-text">🛡️ 100% Secure Checkout</div>
            <p>End-to-end encrypted transactions powered by Razorpay. Supports UPI, Cards, NetBanking, and Wallets.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
