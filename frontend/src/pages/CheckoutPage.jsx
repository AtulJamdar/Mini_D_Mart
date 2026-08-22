import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router';
import api from '../services/api';
import { useCart } from '../context/CartContext';
import SlotPicker from '../components/SlotPicker';

export default function CheckoutPage() {
  const { cart, fetchCart } = useCart();
  const navigate = useNavigate();

  const [fulfillmentType, setFulfillmentType] = useState('pickup');
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
  const [errorMsg, setErrorMsg] = useState('');
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
    e.preventDefault();
    setErrorMsg('');

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
      const payload = {
        fulfillmentType,
        storeId: selectedStoreId,
        pickupSlotId: fulfillmentType === 'pickup' ? selectedSlotId : undefined,
        address: fulfillmentType === 'delivery' ? address : undefined,
      };

      const res = await api.post('/orders/checkout', payload);
      if (res.data.success) {
        setSuccessOrder(res.data.data);
        await fetchCart();
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Checkout failed.');
    } finally {
      setSubmitting(false);
    }
  };

  if (successOrder) {
    return (
      <div className="max-w-xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-border text-center space-y-4">
        <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto text-3xl">
          ✓
        </div>
        <h1 className="text-2xl font-bold text-text">Order Confirmed!</h1>
        <p className="text-sm text-gray-500">
          Order ID: <span className="font-mono font-bold text-text">{successOrder._id}</span>
        </p>
        <div className="p-4 bg-bg rounded-xl text-left text-xs space-y-1.5 border border-border">
          <div className="flex justify-between">
            <span className="text-gray-500">Fulfillment:</span>
            <span className="font-bold uppercase text-primary">{successOrder.fulfillmentType}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Total:</span>
            <span className="font-bold text-text">₹{successOrder.totalAmount.toFixed(2)}</span>
          </div>
        </div>
        <div className="flex justify-center gap-3 pt-2">
          <Link
            to="/orders"
            className="px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity"
          >
            View Orders
          </Link>
          <Link
            to="/shop"
            className="px-5 py-2.5 border border-border text-text text-sm font-semibold rounded-xl hover:bg-bg transition-colors"
          >
            Back to Shop
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text">Checkout</h1>
        <p className="text-sm text-gray-500">Choose fulfillment and place your order</p>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-error/10 border border-error/20 text-error text-sm font-medium">
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <form onSubmit={handleCheckout} className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-border shadow-xs space-y-4">
            <h2 className="text-base font-bold text-text">1. Fulfillment Method</h2>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setFulfillmentType('pickup')}
                className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${
                  fulfillmentType === 'pickup'
                    ? 'border-primary bg-primary/5 text-primary ring-2 ring-primary/20'
                    : 'border-border bg-white text-gray-500 hover:border-gray-300'
                }`}
              >
                <div className="text-2xl mb-1">🏪</div>
                <div className="font-bold text-sm text-text">Store Pickup</div>
              </button>

              <button
                type="button"
                onClick={() => setFulfillmentType('delivery')}
                className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${
                  fulfillmentType === 'delivery'
                    ? 'border-primary bg-primary/5 text-primary ring-2 ring-primary/20'
                    : 'border-border bg-white text-gray-500 hover:border-gray-300'
                }`}
              >
                <div className="text-2xl mb-1">🚚</div>
                <div className="font-bold text-sm text-text">Home Delivery</div>
              </button>
            </div>
          </div>

          {fulfillmentType === 'pickup' ? (
            <div className="bg-white p-6 rounded-2xl border border-border shadow-xs space-y-4">
              <h2 className="text-base font-bold text-text">2. Pickup Store & Slot</h2>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  Select Store
                </label>
                <select
                  value={selectedStoreId}
                  onChange={(e) => setSelectedStoreId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-bg text-text text-sm focus:outline-none focus:border-primary"
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
            <div className="bg-white p-6 rounded-2xl border border-border shadow-xs space-y-4">
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
                  placeholder="Flat 4B, Sunrise Apartments"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-bg text-text text-sm focus:outline-none focus:border-primary"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <input
                  type="text"
                  required
                  placeholder="City"
                  value={address.city}
                  onChange={(e) => setAddress({ ...address, city: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-bg text-text text-sm"
                />
                <input
                  type="text"
                  required
                  placeholder="State"
                  value={address.state}
                  onChange={(e) => setAddress({ ...address, state: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-bg text-text text-sm"
                />
                <input
                  type="text"
                  required
                  placeholder="PIN"
                  value={address.pincode}
                  onChange={(e) => setAddress({ ...address, pincode: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-bg text-text text-sm"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !cart || cart.items.length === 0}
            className="w-full py-3.5 px-4 bg-primary text-white font-bold rounded-xl hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50 text-sm shadow-xs flex items-center justify-center gap-2"
          >
            {submitting ? 'Processing Order...' : `Confirm & Place Order (₹${cart?.total?.toFixed(2) || '0.00'})`}
          </button>
        </form>

        <div className="bg-white rounded-2xl border border-border p-6 shadow-xs h-fit space-y-4">
          <h2 className="font-bold text-text text-base border-b border-border pb-3">
            Items in Order ({cart?.itemCount || 0})
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
            <div className="flex justify-between text-sm font-bold text-text pt-2 border-t border-border">
              <span>Total</span>
              <span className="text-primary">₹{cart?.total?.toFixed(2) || '0.00'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
