import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// CartPage Component
function CartPage({ cart, onUpdateQuantity, onRemoveItem }) {
  const navigate = useNavigate();

  const [items, setItems] = useState([]);     // render ONLY from this (per-user)
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState('');

  const email = (localStorage.getItem('userEmail') || '').trim();

  useEffect(() => {
    const load = async () => {
      if (!email) return;
      const token = localStorage.getItem('token');
      if (!token) {
        setErrMsg('Please login to view your cart.');
        return;
      }

      setLoading(true);
      setErrMsg('');
      try {
        // 1) get this user's cart -> [{ vcdID, quantity }]
        const cartRes = await axios.get('http://localhost:5000/api/cart', {
          params: { email },
          headers: { Authorization: `Bearer ${token}` }
        });
        const idQty = Array.isArray(cartRes.data) ? cartRes.data : [];
        if (!idQty.length) { setItems([]); return; }

        // 2) for each vcdID, hit your per-ID endpoint
        const ids = [...new Set(idQty.map(x => String(x.vcdID).trim()))];
        const detailList = await Promise.all(
          ids.map(async (id) => {
            try {
              const r = await axios.get(`http://localhost:5000/api/vcds/by-id/${encodeURIComponent(id)}`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              return r.data; // single VCD doc
            } catch (_) {
              return null; // tolerate missing one
            }
          })
        );
        const byId = new Map(
          detailList.filter(Boolean).map(v => [String(v.vcdID).trim(), v])
        );

        // 3) merge quantities into detail docs -> UI shape
        const merged = idQty
          .map(({ vcdID, quantity }) => {
            const v = byId.get(String(vcdID).trim());
            if (!v) return null;
            return {
              id: String(vcdID), // keep id=vcdID so delete works
              vcdID: String(vcdID),
              image: v.vcdImage || v.image || '',
              title: v.vcdName || v.title || 'Unknown',
              price: Number(v.cost ?? v.price ?? 0),
              quantity: Number(quantity ?? 1)
            };
          })
          .filter(Boolean);

        setItems(merged);
      } catch (e) {
        console.error('Cart load failed:', e?.response?.data || e.message);
        setErrMsg(e?.response?.data?.message || 'Failed to load cart.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [email]);

  const subtotal = useMemo(
    () => items.reduce((s, it) => s + (Number(it.price) || 0) * (Number(it.quantity) || 0), 0),
    [items]
  );

  // 🔒 keep your delete flow identical; also prune local items
  const handleDelete = async (item) => {
    if (!email) {
      alert('No user email found. Please log in again.');
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please login first.');
      return;
    }

    const vcdID = (item.vcdID ?? item.id)?.toString().trim();
    if (!vcdID) {
      console.error('Missing vcdID on cart item:', item);
      alert('Unable to delete this item (missing ID).');
      return;
    }
    try {
      await axios.delete('http://localhost:5000/api/cart/remove', {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        data: { email, vcdID }
      });
      onRemoveItem(item.id); // unchanged
      setItems(prev => prev.filter(x => x.id !== item.id));
    } catch (err) {
      console.error('Delete failed:', err?.response?.data || err.message);
      alert(err?.response?.data?.message || 'Failed to delete item.');
    }
  };

  const handleQuantityChange = async (id, value) => {
        const newQuantity = Number(value);
        if (newQuantity < 1) return;
 
        const email = (localStorage.getItem('userEmail') || '').trim();
        const token = localStorage.getItem('token');
        if (!token) {
          alert('Please login first.');
          return;
        }

        const prevItems = [...items];
 
        // Optimistic UI update
        setItems(prev => prev.map(x => (x.id === id ? { ...x, quantity: newQuantity } : x)));
 
        try {
            await axios.put('http://localhost:5000/api/cart/update', {
                email,
                itemId: id, // matches backend
                quantity: newQuantity
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
 
            onUpdateQuantity(id, newQuantity);
        } catch (error) {
            console.error('Quantity update failed:', error);
            alert('Failed to update quantity on server.');
            // Revert local state
            setItems(prevItems);
        }
    };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-bold text-center mb-8 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
        Your Shopping Cart
      </h1>

      {loading && <p className="text-center text-gray-400">Loading your cart…</p>}
      {!loading && errMsg && <p className="text-center text-red-400">{errMsg}</p>}

      {!loading && items.length === 0 ? (
        <div className="text-center py-20 bg-gray-800 bg-opacity-40 rounded-lg">
          <p className="text-xl text-gray-400 mb-4">Your cart is empty.</p>
          <button
            onClick={() => navigate('/')}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-6 rounded-lg transition duration-300 transform hover:scale-105"
          >
            Continue Shopping
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="md:col-span-2 space-y-4">
            {items.map(item => (
              <div key={item.id} className="flex items-center bg-gray-800 bg-opacity-40 p-4 rounded-lg shadow-lg">
                <img src={item.image} alt={item.title} className="w-24 h-36 object-cover rounded-md mr-6" />
                <div className="flex-grow">
                  <h2 className="text-xl font-semibold">{item.title}</h2>
                  <p className="text-lg text-purple-400 font-bold">₹{Number(item.price || 0).toFixed(2)}</p>
                </div>
                <div className="flex items-center space-x-4">
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                    className="w-16 p-2 rounded bg-gray-700 text-center"
                  />
                  <button onClick={() => handleDelete(item)} className="text-red-500 hover:text-red-400 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="bg-gray-800 bg-opacity-40 p-6 rounded-lg shadow-lg h-fit">
            <h2 className="text-2xl font-bold mb-6 border-b border-gray-700 pb-4">Order Summary</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Subtotal</span>
                <span className="font-semibold">₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Shipping</span>
                <span className="font-semibold">FREE</span>
              </div>
            </div>
            <div className="border-t border-gray-700 mt-6 pt-6">
              <div className="flex justify-between text-xl font-bold">
                <span>Total</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              <button
                onClick={() => navigate('/payment' , { state: { items, subtotal } })}
                className="w-full mt-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-3 px-6 rounded-lg transition duration-300 transform hover:scale-105 shadow-lg"
              >
                Proceed to Checkout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CartPage;