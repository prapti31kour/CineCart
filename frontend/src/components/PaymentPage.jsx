import React, { useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

/**
 * PaymentPage.jsx
 * - Handles stock decrease, order creation, and cart clearing
 * - Uses JWT Authorization for all requests
 * - Provides meaningful error messages and logs network responses
 * - Supports fallback for vcdName -> vcdID when decreasing stock
 * - Fixed DELETE with body issue to avoid Network Error
 */

function PaymentPage({ cart }) {
  const navigate = useNavigate();
  const location = useLocation();

  const email = (localStorage.getItem('userEmail') || '').trim();
  const token = localStorage.getItem('token'); // JWT token

  const itemsFromCartPage = location.state?.items ?? [];
  const subtotalFromCartPage = location.state?.subtotal;

  const sourceItems = (itemsFromCartPage.length ? itemsFromCartPage : cart) || [];

  const totalPrice = useMemo(() => {
    if (typeof subtotalFromCartPage === 'number') return subtotalFromCartPage;
    return sourceItems.reduce(
      (total, item) => total + (Number(item.price || 0) * Number(item.quantity || 0)),
      0
    );
  }, [subtotalFromCartPage, sourceItems]);

  const [address, setAddress] = useState(location.state?.address || '');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [isProcessing, setIsProcessing] = useState(false);

  const buildPayloadItems = () =>
    sourceItems.map((item) => ({
      vcdID: String(item.vcdID ?? item.id ?? '').trim(),
      title: item.title ?? '',
      price: Number(item.price ?? 0),
      quantity: Number(item.quantity ?? 1),
    }));

  const tryEmptyCart = async () => {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    // Using safer axios({ method: 'delete', ... }) syntax
    try {
      await axios({
        method: 'delete',
        url: 'http://localhost:5000/api/cart/empty',
        headers,
        data: { email },
      });
      console.log('Cart emptied via /api/cart/empty');
      return true;
    } catch (e1) {
      console.warn('/api/cart/empty failed:', e1?.response?.data || e1?.message);
      try {
        await axios({
          method: 'delete',
          url: 'http://localhost:5000/api/auth/empty',
          headers,
          data: { email },
        });
        console.log('Cart emptied via /api/auth/empty');
        return true;
      } catch (e2) {
        console.warn('/api/auth/empty failed:', e2?.response?.data || e2?.message);
        return false;
      }
    }
  };

  const handlePay = async () => {
    if (!email) return alert('Please log in before placing an order.');
    if (!token) return alert('Missing authentication token. Please log in.');
    if (!address || address.trim().length < 5) return alert('Enter a valid shipping address (min 5 characters).');
    if (!Array.isArray(sourceItems) || sourceItems.length === 0) return alert('Your cart is empty. Add items before paying.');

    const itemsPayload = buildPayloadItems();
    console.log('handlePay -> itemsPayload:', itemsPayload, 'email:', email);

    setIsProcessing(true);

    try {
      // 1) Decrease stock
      await Promise.all(itemsPayload.map((it) =>
        axios.patch(
          'http://localhost:5000/api/vcds/decrease',
          { vcdName: it.title?.trim() || it.vcdID || '', quantity: it.quantity },
          { headers: { Authorization: `Bearer ${token}` } }
        ).catch(err => {
          const reason = err?.response?.data?.message || err?.message || 'Stock update failed';
          throw new Error(`${it.vcdID || it.title || 'unknown'}: ${reason}`);
        })
      ));

      // 2) Create order
      const orderPayload = { email, items: itemsPayload, paymentMethod, address, clearCart: true, totalPrice };
      const createRes = await axios.post(
        'http://localhost:5000/api/orders/create',
        orderPayload,
        { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } }
      );

      if (!createRes || createRes.status >= 400) throw new Error(`Order creation failed: ${JSON.stringify(createRes?.data)}`);

      // 3) Empty cart (best-effort)
      const emptied = await tryEmptyCart();
      if (!emptied) alert('Order placed, but cart could not be cleared on server.');

      alert('Payment successful — order placed.');
      navigate('/orders');
    } catch (err) {
      console.error('Payment flow failed:', err);
      alert(`Payment failed: ${err.message || 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-4xl font-bold mb-8 text-center bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
        Checkout
      </h1>

      <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Payment Form */}
        <div className="bg-gray-800 bg-opacity-40 p-8 rounded-lg shadow-xl">
          <h2 className="text-2xl font-semibold mb-6">Payment Details</h2>
          <form onSubmit={(e) => e.preventDefault()}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-1">Card Number</label>
              <input type="text" placeholder="**** **** **** ****"
                className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 focus:outline-none focus:border-purple-500" />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-1">Name on Card</label>
              <input type="text" placeholder="John Doe"
                className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 focus:outline-none focus:border-purple-500" />
            </div>

            <div className="flex space-x-4 mb-6">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-300 mb-1">Expiry Date (MM/YY)</label>
                <input type="text" placeholder="MM/YY"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 focus:outline-none focus:border-purple-500" />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-300 mb-1">CVC</label>
                <input type="text" placeholder="***"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 focus:outline-none focus:border-purple-500" />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-1">Shipping Address</label>
              <textarea value={address} onChange={(e) => setAddress(e.target.value)}
                placeholder="123 Dream Street, Mumbai, India" rows={3}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 focus:outline-none focus:border-purple-500 resize-none" />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-1">Payment Method</label>
              <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 focus:outline-none focus:border-purple-500">
                <option value="UPI">UPI</option>
                <option value="Card">Card</option>
                <option value="NetBanking">Net Banking</option>
                <option value="COD">Cash on Delivery</option>
              </select>
            </div>

            <button type="button" onClick={handlePay}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold py-3 px-6 rounded-lg transition duration-300 transform hover:scale-[1.01]"
              disabled={totalPrice <= 0 || isProcessing}>
              {isProcessing ? 'Processing...' : `Pay $${totalPrice.toFixed(2)}`}
            </button>
          </form>
        </div>

        {/* Order Summary */}
        <div className="bg-gray-800 bg-opacity-40 p-8 rounded-lg shadow-xl h-fit">
          <h2 className="text-2xl font-semibold mb-6 border-b border-gray-700 pb-4">Order Summary</h2>
          <div className="space-y-4 max-h-64 overflow-y-auto pr-2">
            {sourceItems.map((item) => (
              <div key={item.id ?? item.vcdID ?? Math.random()} className="flex justify-between items-center text-gray-300">
                <span className="text-sm">{item.title} ({item.quantity})</span>
                <span className="font-medium">${(Number(item.price || 0) * Number(item.quantity || 0)).toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-700 mt-6 pt-4">
            <div className="flex justify-between font-bold text-xl">
              <span>Total</span>
              <span>${totalPrice.toFixed(2)}</span>
            </div>
            <div className="text-sm text-gray-400 mt-2">Email: {email || 'Not logged in'}</div>
            <div className="text-sm text-gray-400 mt-1">Address: {address || 'No address entered'}</div>
          </div>
        </div>
      </div>

      <div className="text-center mt-12">
        <button onClick={() => navigate('/cart')} className="text-purple-400 hover:text-purple-300 text-lg">&larr; Back to Cart</button>
      </div>
    </div>
  );
}

export default PaymentPage;