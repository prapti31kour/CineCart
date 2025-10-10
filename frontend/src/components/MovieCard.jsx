// src/components/MovieCard.jsx
import React from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import StarRating from './StarRating';

/**
 * MovieCard.jsx
 * - Keeps original UI/UX (clickable card, keyboard support, hover Add-to-Cart)
 * - Adds safe numeric normalization (Decimal128 -> Number)
 * - Uses token from localStorage and sends Authorization header
 * - Sends explicit payload { vcdID, quantity } to /api/cart/add
 *
 * Behavior unchanged otherwise.
 */

function MovieCard({ movie: rawMovie, onAddToCart, userEmail, quantity = 1 }) {
  const navigate = useNavigate();

  // --- Helpers: Normalize Decimal128-like objects and common numeric fields ---
  const maybeDecimalToNumber = (v) => {
    if (v && typeof v === 'object' && Object.prototype.hasOwnProperty.call(v, '$numberDecimal')) {
      const n = Number(v.$numberDecimal);
      return Number.isFinite(n) ? n : v;
    }
    return v;
  };

  const normalizeMovie = (mRaw) => {
    if (!mRaw || typeof mRaw !== 'object') return mRaw;
    const m = { ...mRaw };

    // normalize common numeric fields
    ['cost', 'price', 'rating', 'quantity', 'runtimeMinutes'].forEach((k) => {
      if (k in m && m[k] !== undefined && m[k] !== null) {
        m[k] = maybeDecimalToNumber(m[k]);
        if (typeof m[k] === 'string' && m[k].trim() !== '') {
          const parsed = Number(m[k]);
          if (Number.isFinite(parsed)) m[k] = parsed;
        }
      }
    });

    // support alternate naming
    if (!m.cost && m.price) m.cost = m.price;
    if (!m.price && m.cost) m.price = m.cost;

    // ensure id fields are strings
    m.vcdID = String(m.vcdID ?? m.id ?? '').trim();
    m.title = String(m.title ?? m.vcdName ?? m.name ?? '').trim();

    // unify image list/field
    if (Array.isArray(m.vcdImage) && !m.image) m.image = m.vcdImage;
    if (!m.image && m.vcdImage && typeof m.vcdImage === 'string') m.image = [m.vcdImage];

    return m;
  };

  const movie = normalizeMovie(rawMovie);

  // computed display-safe primitives
  const displayPrice = (movie.cost ?? movie.price) != null ? Number(movie.cost ?? movie.price) : 0;
  const displayRating = movie.rating != null ? Number(movie.rating) : 0;
  const displayQuantity = movie.quantity != null ? Number(movie.quantity) : 0;

  // poster handling: prefer movie.image (array) then movie.vcdImage string/array then fallback empty
  const poster = Array.isArray(movie.image)
    ? movie.image[0] || ''
    : (Array.isArray(movie.vcdImage) ? movie.vcdImage[0] : (movie.image || movie.vcdImage || ''));

  // Navigation handlers (unchanged)
  const handleCardClick = () => {
    const id = movie.vcdID ?? movie.id;
    if (!id) return;
    navigate(`/movie/${encodeURIComponent(id)}`);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleCardClick();
    }
  };

  // Add to cart (keeps original semantics: sends vcdID & quantity)
  const handleAddToCart = async (e) => {
    e.stopPropagation();

    // Sanitize quantity (use provided prop or fallback to 1)
    const parsed = Number(quantity);
    const qty = Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 1;

    if (!Number.isFinite(qty) || qty <= 0) {
      alert('Out of Stock');
      return;
    }

    // Get token (must exist for protected /api/cart/add)
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please login first');
      return;
    }

    const vcdID = String(movie.vcdID ?? movie.id ?? '').trim();
    if (!vcdID) {
      console.error('MovieCard: missing vcdID on movie:', movie);
      alert('Unable to add — missing item id.');
      return;
    }

    const payload = {
      vcdID,
      quantity: 1,
    };

    // Debug log (keeps you able to trace earlier bug)
    console.log('MovieCard: add to cart payload=', payload);

    try {
      const resp = await axios.post(
        'http://localhost:5000/api/cart/add',
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );

      // success path (same as original: call parent handler and navigate to cart)
      if (resp && (resp.status === 200 || resp.status === 201)) {
        if (typeof onAddToCart === 'function') {
          try {
            onAddToCart(resp.data || movie);
          } catch (err) {
            console.warn('onAddToCart threw:', err);
          }
        }
        navigate('/cart');
        return;
      }

      // unexpected but non-error response
      const serverMsg = resp?.data?.message || resp?.data || `Unexpected response: ${resp?.status}`;
      console.error('MovieCard add unexpected response:', resp);
      alert(typeof serverMsg === 'string' ? serverMsg : JSON.stringify(serverMsg));
    } catch (err) {
      // surface server message where possible (keeps behavior more informative)
      const serverData = err?.response?.data;
      const serverMsg =
        (serverData && (serverData.message || serverData.error)) ||
        serverData ||
        err?.message ||
        'Network or server error';

      console.error('MovieCard add failed:', serverData || err);
      alert(typeof serverMsg === 'string' ? serverMsg : JSON.stringify(serverMsg));
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={handleKeyPress}
      className="bg-gray-800 bg-opacity-40 rounded-lg overflow-hidden shadow-lg group transform hover:-translate-y-2 transition-transform duration-300 flex flex-col cursor-pointer"
      aria-label={`Open details for ${movie.title}`}
    >
      <div className="relative">
        <img src={poster} alt={movie.title} className="w-full h-72 object-cover" />

        <div
          className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center p-4"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={handleAddToCart}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transform scale-0 group-hover:scale-100 transition-transform duration-300"
            type="button"
            aria-label={`Add ${movie.title} to cart`}
          >
            Add to Cart
          </button>
        </div>
      </div>

      <div className="p-4 flex flex-col flex-grow">
        <h3 className="text-lg font-semibold truncate">{movie.title}</h3>
        <div className="flex justify-between items-center mt-2">
          <p className="text-xl font-bold text-purple-400">₹{(Number(displayPrice) || 0).toFixed(2)}</p>
          <StarRating rating={displayRating} />
        </div>
      </div>
    </div>
  );
}

export default MovieCard;

















// // src/components/MovieCard.jsx
// import React from 'react';
// import axios from 'axios';
// import { useNavigate } from 'react-router-dom';
// import StarRating from './StarRating';

// /**
//  * MovieCard.jsx
//  * - Sends JWT from localStorage in Authorization header
//  * - Sends explicit JSON payload { vcdID, quantity } in request body
//  * - Keeps click/keyboard navigation and hover Add-to-Cart UI
//  * - Defensive quantity handling to avoid "random" values
//  */
// function MovieCard({ movie, onAddToCart, userEmail, quantity = 1 }) {
//   const navigate = useNavigate();

//   const handleCardClick = () => {
//     const id = movie.vcdID ?? movie.id;
//     if (!id) return;
//     navigate(`/movie/${encodeURIComponent(id)}`);
//   };

//   const handleKeyPress = (e) => {
//     if (e.key === 'Enter' || e.key === ' ') {
//       e.preventDefault();
//       handleCardClick();
//     }
//   };

//   const handleAddToCart = async (e) => {
//     e.stopPropagation();

//     // Defensive quantity parsing: always produce a positive integer >= 1
//     const parsed = Number(quantity);
//     const qty = Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 1;

//     // Basic stock check (now uses sanitized qty)
//     if (!Number.isFinite(qty) || qty <= 0) {
//       alert('Out of Stock');
//       return;
//     }

//     // Read token (must be saved to localStorage on login as 'token')
//     const token = localStorage.getItem('token');
//     if (!token) {
//       alert('Please login first');
//       return;
//     }

//     // Build payload explicitly with deterministic qty
//     const vcdID = String(movie.vcdID ?? movie.id ?? '').trim();
//     if (!vcdID) {
//       // Defensive: if no id found, abort early and log
//       console.error('MovieCard: missing vcdID on movie:', movie);
//       alert('Unable to add — missing item id.');
//       return;
//     }

//     const payload = {
//       vcdID,
//       quantity: 1,
//     };

//     // Debug: inspect what we will send (useful to reproduce earlier bug)
//     console.log('Adding to cart — payload:', payload, 'Authorization:', `Bearer ${token}`);

//     try {
//       const resp = await axios.post(
//         'http://localhost:5000/api/cart/add', // protected route which expects JWT
//         payload,
//         {
//           headers: {
//             Authorization: `Bearer ${token}`,
//             'Content-Type': 'application/json',
//           },
//           // withCredentials: true, // enable if you rely on cookies
//           timeout: 10000,
//         }
//       );

//       // Check server response for success
//       if (resp && (resp.status === 200 || resp.status === 201)) {
//         // server returns updated cart in resp.data.cart (per your backend)
//         if (onAddToCart) {
//           try {
//             onAddToCart(resp.data || movie);
//           } catch (e) {
//             // don't break navigation if parent handler throws
//             console.warn('onAddToCart handler threw:', e);
//           }
//         }
//         // navigate to cart page only after successful add
//         navigate('/cart');
//         return;
//       }

//       // If server responded but not success, surface message
//       const serverMsg = resp?.data?.message || resp?.data || `Unexpected response (status ${resp?.status})`;
//       console.error('Add to cart unexpected response:', resp);
//       alert(typeof serverMsg === 'string' ? serverMsg : JSON.stringify(serverMsg));
//     } catch (err) {
//       // Prefer the server-provided error details when available
//       const serverData = err?.response?.data;
//       const serverMsg =
//         (serverData && (serverData.message || serverData.error)) ||
//         serverData ||
//         err?.message ||
//         'Network or server error';

//       console.error('Add to cart failed:', serverData || err);
//       // Show exact server message if available (this will show "vcdID and positive quantity are required" when that's the server reply)
//       alert(typeof serverMsg === 'string' ? serverMsg : JSON.stringify(serverMsg));
//     }
//   };

//   const poster = Array.isArray(movie.image) ? movie.image[0] : movie.image || '';

//   return (
//     <div
//       role="button"
//       tabIndex={0}
//       onClick={handleCardClick}
//       onKeyDown={handleKeyPress}
//       className="bg-gray-800 bg-opacity-40 rounded-lg overflow-hidden shadow-lg group transform hover:-translate-y-2 transition-transform duration-300 flex flex-col cursor-pointer"
//       aria-label={`Open details for ${movie.title}`}
//     >
//       <div className="relative">
//         <img src={poster} alt={movie.title} className="w-full h-72 object-cover" />

//         <div
//           className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center p-4"
//           onClick={(e) => e.stopPropagation()}
//         >
//           <button
//             onClick={handleAddToCart}
//             className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transform scale-0 group-hover:scale-100 transition-transform duration-300"
//             type="button"
//             aria-label={`Add ${movie.title} to cart`}
//           >
//             Add to Cart
//           </button>
//         </div>
//       </div>

//       <div className="p-4 flex flex-col flex-grow">
//         <h3 className="text-lg font-semibold truncate">{movie.title}</h3>
//         <div className="flex justify-between items-center mt-2">
//           <p className="text-xl font-bold text-purple-400">₹{Number(movie.price || 0).toFixed(2)}</p>
//           <StarRating rating={movie.rating} />
//         </div>
//       </div>
//     </div>
//   );
// }

// export default MovieCard;