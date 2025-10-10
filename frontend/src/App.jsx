// src/App.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import api from './api';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './components/HomePage';
import CartPage from './components/CartPage';
import PaymentPage from './components/PaymentPage';
import AdminDashboard from './components/AdminDashboard';
import Login from './components/Login';
import Signup from './components/signup';
import OrderHistoryPage from './components/OrderHistoryPage';
import MovieDetails from './components/MovieDetails';

export default function App() {
  const [cart, setCart] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // initial auth: read token & user info
  useEffect(() => {
    const email = localStorage.getItem('userEmail');
    const role = localStorage.getItem('userRole');
    const token = localStorage.getItem('token');

    if (token && email) {
      setCurrentUser({ email, role });

      // fetch server-side cart for logged-in user
      (async () => {
        try {
          const res = await api.get('/api/cart'); // api automatically sends token
          // API returns array (your cart route returns array or { cart: [] } - handle both)
          const data = Array.isArray(res.data) ? res.data : (res.data.cart ?? []);
          setCart(data || []);
        } catch (err) {
          console.warn('Failed to load server cart:', err?.response?.data || err?.message);
          setCart([]); // fallback
        }
      })();
    } else {
      // guest: load local cart
      try {
        const localCart = window.localStorage.getItem('cinecart');
        setCart(localCart ? JSON.parse(localCart) : []);
      } catch {
        setCart([]);
      }
    }
  }, []);

  // persist guest cart to local storage when not logged in
  useEffect(() => {
    if (!localStorage.getItem('token')) {
      window.localStorage.setItem('cinecart', JSON.stringify(cart));
    }
  }, [cart]);

  // handle login (called from Login/Signup)
  const handleLogin = (userData) => {
    setCurrentUser(userData);

    // After login, sync server cart into UI
    (async () => {
      try {
        const res = await api.get('/api/cart'); // protected, interceptor attaches token
        const data = Array.isArray(res.data) ? res.data : (res.data.cart ?? []);
        setCart(data || []);
      } catch (err) {
        console.warn('Failed to fetch cart after login:', err?.response?.data || err.message);
        setCart([]);
      }
    })();
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userRole');
    setCurrentUser(null);
    setCart([]);
  };

  /**
   * Robust handleAddToCart
   * - Accepts multiple shapes from child components:
   *   1) server response object (e.g. { cart: [...] } or { message:..., cart: [...] })
   *   2) array (cart array)
   *   3) movie object (client-side) — in this case: if logged in -> refresh server cart; if guest -> update local cart
   *
   * Rationale:
   *  - Some components (MovieCard) POST to /api/cart/add themselves and then call onAddToCart(resp.data)
   *  - Others may call onAddToCart with a movie object expecting App to POST
   *  - This handler tolerantly handles both approaches and avoids "missing id" alerts or duplicate POSTs
   */
  const handleAddToCart = async (payloadOrMovie) => {
    try {
      const token = localStorage.getItem('token');

      // Case: payload is a cart array
      if (Array.isArray(payloadOrMovie)) {
        setCart(payloadOrMovie);
        return;
      }

      // Case: payload is server response containing cart
      if (payloadOrMovie && typeof payloadOrMovie === 'object' && Array.isArray(payloadOrMovie.cart)) {
        setCart(payloadOrMovie.cart);
        return;
      }

      // Case: payload is server response but has direct array as data (e.g. res.data is array)
      if (payloadOrMovie && typeof payloadOrMovie === 'object' && payloadOrMovie.length && Array.isArray(payloadOrMovie)) {
        setCart(payloadOrMovie);
        return;
      }

      // Case: payload is a movie-like object (client sent movie)
      if (payloadOrMovie && typeof payloadOrMovie === 'object' && (payloadOrMovie.vcdID || payloadOrMovie.id || payloadOrMovie._id)) {
        const vcdID = String(payloadOrMovie.vcdID ?? payloadOrMovie.id ?? payloadOrMovie._id).trim();

        if (!vcdID) {
          // defensive fallback: refresh server cart if logged in, else do guest local update
          if (token) {
            const res = await api.get('/api/cart');
            const data = Array.isArray(res.data) ? res.data : (res.data.cart ?? []);
            setCart(data || []);
            return;
          }
          // guest fallback: add to local cart from provided movie
          setCart(prev => {
            const existing = prev.find(i => (i.vcdID ?? i.id) === vcdID);
            if (existing) {
              return prev.map(i => ((i.vcdID ?? i.id) === vcdID ? { ...i, quantity: (Number(i.quantity) || 0) + 1 } : i));
            }
            return [...prev, { vcdID, title: payloadOrMovie.title ?? '', price: payloadOrMovie.price ?? 0, quantity: 1 }];
          });
          return;
        }

        // If logged in prefer authoritative refresh from server (since many children already POST)
        if (token) {
          try {
            const res = await api.get('/api/cart');
            const data = Array.isArray(res.data) ? res.data : (res.data.cart ?? []);
            setCart(data || []);
            return;
          } catch (err) {
            console.warn('Failed to refresh server cart after add:', err?.response?.data || err?.message);
            // fallthrough to guest behavior if token fails
          }
        }

        // guest: update local cart
        setCart(prev => {
          const existing = prev.find(i => (i.vcdID ?? i.id) === vcdID);
          if (existing) {
            return prev.map(i => ((i.vcdID ?? i.id) === vcdID ? { ...i, quantity: (Number(i.quantity) || 0) + 1 } : i));
          }
          return [...prev, { vcdID, title: payloadOrMovie.title ?? '', price: payloadOrMovie.price ?? 0, quantity: 1 }];
        });
        return;
      }

      // Unknown payload: to be safe, refresh server cart if logged in, else warn user (no double POST)
      if (localStorage.getItem('token')) {
        try {
          const res = await api.get('/api/cart');
          const data = Array.isArray(res.data) ? res.data : (res.data.cart ?? []);
          setCart(data || []);
          return;
        } catch (err) {
          console.warn('Could not refresh cart (unknown payload):', err?.response?.data || err?.message);
          alert('Could not update cart; see console.');
        }
      } else {
        console.warn('handleAddToCart received unexpected payload (guest):', payloadOrMovie);
        alert('Unable to add — missing item id.');
      }
    } catch (err) {
      console.error('handleAddToCart error:', err);
      alert('Failed to update cart. See console for details.');
    }
  };

  const handleUpdateQuantity = async (itemId, quantity) => {
    if (currentUser) {
      try {
        const res = await api.put('/api/cart/update', { itemId, quantity });
        // backend returns { success: true, cart: [...] }
        const data = res?.data?.cart ?? (Array.isArray(res.data) ? res.data : null);
        if (data) setCart(data);
        else {
          // if server didn't return cart, fetch authoritative cart
          const r = await api.get('/api/cart');
          const fetched = Array.isArray(r.data) ? r.data : (r.data.cart ?? []);
          setCart(fetched || []);
        }
      } catch (err) {
        console.error('Update quantity failed:', err?.response?.data || err.message);
        alert(err?.response?.data?.message || 'Failed to update quantity');
      }
    } else {
      setCart(prev => prev.map(it => it.id === itemId ? { ...it, quantity: Number(quantity) } : it));
    }
  };

  const handleRemoveItem = async (itemId) => {
    if (currentUser) {
      try {
        await api.delete('/api/cart/remove', { data: { vcdID: itemId } });
        // re-fetch authoritative cart
        const res = await api.get('/api/cart');
        const data = Array.isArray(res.data) ? res.data : (res.data.cart ?? []);
        setCart(data || []);
      } catch (err) {
        console.error('Remove item failed:', err?.response?.data || err.message);
        alert(err?.response?.data?.message || 'Failed to remove item');
      }
    } else {
      setCart(prev => prev.filter(i => i.id !== itemId));
    }
  };

  const cartCount = useMemo(() => cart.reduce((s, it) => s + (Number(it.quantity) || 0), 0), [cart]);

  return (
    <BrowserRouter>
      <div className="bg-[#0c0a1a] text-white min-h-screen flex flex-col">
        <Navbar
          cartCount={cartCount}
          user={currentUser}
          handleLogout={handleLogout}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
        />
        <main className="flex-grow">
          <Routes>
            <Route
              path="/"
              element={
                <HomePage
                  onAddToCart={handleAddToCart}
                  searchTerm={searchTerm}
                  userEmail={currentUser?.email}
                />
              }
            />
            <Route path="/cart" element={<CartPage cart={cart} onUpdateQuantity={handleUpdateQuantity} onRemoveItem={handleRemoveItem} />} />
            <Route path="/payment" element={<PaymentPage cart={cart} />} />
            <Route path="/login" element={<Login handleLogin={handleLogin} />} />
            <Route path="/signup" element={<Signup handleLogin={handleLogin} />} />
            <Route path="/dashboard" element={<AdminDashboard />} />
            <Route path="/orders" element={<OrderHistoryPage userEmail={currentUser?.email} />} />
            <Route path="/movie/:vcdID" element={<MovieDetails />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}

// // src/App.jsx
// import React, { useEffect, useMemo, useState } from 'react';
// import { BrowserRouter, Routes, Route } from 'react-router-dom';

// import api from './api';
// import Navbar from './components/Navbar';
// import Footer from './components/Footer';
// import HomePage from './components/HomePage';
// import CartPage from './components/CartPage';
// import PaymentPage from './components/PaymentPage';
// import AdminDashboard from './components/AdminDashboard';
// import Login from './components/Login';
// import Signup from './components/signup';
// import OrderHistoryPage from './components/OrderHistoryPage';
// import MovieDetails from './components/MovieDetails';

// export default function App() {
//   const [cart, setCart] = useState([]);
//   const [currentUser, setCurrentUser] = useState(null);
//   const [searchTerm, setSearchTerm] = useState('');

//   // initial auth: read token & user info
//   useEffect(() => {
//     const email = localStorage.getItem('userEmail');
//     const role = localStorage.getItem('userRole');
//     const token = localStorage.getItem('token');
//     if (token && email) {
//       setCurrentUser({ email, role });
//       // fetch server-side cart for this user
//       (async () => {
//         try {
//           const res = await api.get('/api/cart');
//           setCart(res.data || []);
//         } catch (err) {
//           console.warn('Failed to load server cart:', err?.response?.data || err.message);
//           setCart([]); // fallback
//         }
//       })();
//     } else {
//       // load local cinecart if user not logged in (guest)
//       try {
//         const localCart = window.localStorage.getItem('cinecart');
//         setCart(localCart ? JSON.parse(localCart) : []);
//       } catch {
//         setCart([]);
//       }
//     }
//   }, []);

//   // persist guest cart to local storage when not logged in
//   useEffect(() => {
//     if (!localStorage.getItem('token')) {
//       window.localStorage.setItem('cinecart', JSON.stringify(cart));
//     }
//   }, [cart]);

//   // handle login (called from Login/Signup)
//   const handleLogin = (userData) => {
//     setCurrentUser(userData);
//     // After login, sync server cart into UI
//     (async () => {
//       try {
//         const res = await api.get('/api/cart'); // protected
//         setCart(res.data || []);
//       } catch (err) {
//         console.warn('Failed to fetch cart after login:', err?.response?.data || err.message);
//         setCart([]);
//       }
//     })();
//   };

//   const handleLogout = () => {
//     localStorage.removeItem('token');
//     localStorage.removeItem('userEmail');
//     localStorage.removeItem('userRole');
//     setCurrentUser(null);
//     setCart([]);
//   };

//   // Cart management uses protected endpoints when logged in
//   const handleAddToCart = async (movie) => {
//     if (currentUser) {
//       try {
//         const res = await api.post('/api/cart/add', { vcdID: movie.id, quantity: 1 });
//         setCart(res.data.cart || []);
//       } catch (err) {
//         console.error('Add to cart failed:', err?.response?.data || err.message);
//         alert(err?.response?.data?.message || 'Failed to add to cart');
//       }
//     } else {
//       // guest: local-cart behavior
//       setCart(prev => {
//         const existing = prev.find(i => i.id === movie.id);
//         if (existing) return prev.map(i => i.id === movie.id ? { ...i, quantity: i.quantity + 1 } : i);
//         return [...prev, { ...movie, quantity: 1 }];
//       });
//     }
//   };

//   const handleUpdateQuantity = async (itemId, quantity) => {
//     if (currentUser) {
//       try {
//         const res = await api.put('/api/cart/update', { itemId, quantity });
//         setCart(res.data.cart || []);
//       } catch (err) {
//         console.error('Update quantity failed:', err?.response?.data || err.message);
//         alert(err?.response?.data?.message || 'Failed to update quantity');
//       }
//     } else {
//       setCart(prev => prev.map(it => it.id === itemId ? { ...it, quantity: Number(quantity) } : it));
//     }
//   };

//   const handleRemoveItem = async (itemId) => {
//     if (currentUser) {
//       try {
//         await api.delete('/api/cart/remove', { data: { vcdID: itemId } });
//         // fetch fresh cart
//         const res = await api.get('/api/cart');
//         setCart(res.data || []);
//       } catch (err) {
//         console.error('Remove item failed:', err?.response?.data || err.message);
//         alert(err?.response?.data?.message || 'Failed to remove item');
//       }
//     } else {
//       setCart(prev => prev.filter(i => i.id !== itemId));
//     }
//   };

//   const cartCount = useMemo(() => cart.reduce((s, it) => s + (Number(it.quantity) || 0), 0), [cart]);

//   return (
//     <BrowserRouter>
//       <div className="bg-[#0c0a1a] text-white min-h-screen flex flex-col">
//         <Navbar
//           cartCount={cartCount}
//           user={currentUser}
//           handleLogout={handleLogout}
//           searchTerm={searchTerm}
//           onSearchChange={setSearchTerm}
//         />
//         <main className="flex-grow">
//           <Routes>
//             <Route path="/" element={<HomePage onAddToCart={handleAddToCart} searchTerm={searchTerm} userEmail={currentUser?.email} />} />
//             <Route path="/cart" element={<CartPage cart={cart} onUpdateQuantity={handleUpdateQuantity} onRemoveItem={handleRemoveItem} />} />
//             <Route path="/payment" element={<PaymentPage cart={cart} />} />
//             <Route path="/login" element={<Login handleLogin={handleLogin} />} />
//             <Route path="/signup" element={<Signup handleLogin={handleLogin} />} />
//             <Route path="/dashboard" element={<AdminDashboard />} />
//             <Route path="/orders" element={<OrderHistoryPage userEmail={currentUser?.email} />} />
//             <Route path="/movie/:vcdID" element={<MovieDetails />} />
//           </Routes>
//         </main>
//         <Footer />
//       </div>
//     </BrowserRouter>
//   );
// }