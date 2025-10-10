// src/components/MovieDetails.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import StarRating from '../components/StarRating';

export default function MovieDetails() {
  // be tolerant: read vcdID or id
  const params = useParams();
  const paramId = (params.vcdID || params.id || '').trim();
  const navigate = useNavigate();

  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [adding, setAdding] = useState(false);

  const token = localStorage.getItem('token'); // JWT token
  const email = (localStorage.getItem('userEmail') || '').trim();

  // Helper: convert Mongo Decimal128-like objects to numbers for known numeric fields
  const maybeDecimalToNumber = (v) => {
    if (v && typeof v === 'object' && Object.prototype.hasOwnProperty.call(v, '$numberDecimal')) {
      const n = Number(v.$numberDecimal);
      return Number.isFinite(n) ? n : v;
    }
    return v;
  };

  const normalizeMovie = (raw) => {
    if (!raw || typeof raw !== 'object') return raw;

    // shallow copy so we don't mutate the original
    const m = { ...raw };

    // numeric fields that commonly come back as Decimal128
    ['cost', 'price', 'rating', 'quantity', 'runtimeMinutes'].forEach((k) => {
      if (k in m && m[k] !== undefined && m[k] !== null) {
        m[k] = maybeDecimalToNumber(m[k]);
        // if still a string that looks numeric, attempt parse
        if (typeof m[k] === 'string' && m[k].trim() !== '') {
          const parsed = Number(m[k]);
          if (Number.isFinite(parsed)) m[k] = parsed;
        }
      }
    });

    // some DBs use nested fields (e.g. vcd.cost), try a few common alternatives
    if (!m.cost && m.price) m.cost = m.price;
    if (!m.price && m.cost) m.price = m.cost;

    return m;
  };

  useEffect(() => {
    if (!paramId) {
      setErr('No movie specified.');
      setLoading(false);
      return;
    }

    const fetchMovie = async () => {
      setLoading(true);
      setErr('');
      try {
        const res = await axios.get(
          `http://localhost:5000/api/vcds/by-id/${encodeURIComponent(paramId)}`,
          {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            timeout: 10000,
          }
        );
        const normalized = normalizeMovie(res.data);
        setMovie(normalized);
      } catch (error) {
        console.error('Failed to fetch movie:', error?.response?.data || error?.message);
        // If server returned an object error message, prefer that
        const serverMsg = error?.response?.data?.message || error?.response?.data || error?.message;
        setErr(typeof serverMsg === 'string' ? serverMsg : 'Failed to load movie details.');
      } finally {
        setLoading(false);
      }
    };

    fetchMovie();
  }, [paramId, token]);

  const handleAddToCart = async () => {
    if (!movie) return;
    if (!email || !token) {
      alert('Please login to add to cart.');
      return;
    }

    setAdding(true);
    try {
      // your cart route expects token and uses req.user; don't need to send email
      await axios.post(
        'http://localhost:5000/api/cart/add',
        {
          vcdID: movie.vcdID,
          quantity: 1,
        },
        {
          headers: token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : {},
          timeout: 10000,
        }
      );
      alert('Added to cart');
      navigate('/cart');
    } catch (err) {
      console.error('Add to cart failed:', err?.response?.data || err?.message);
      const serverMsg = err?.response?.data?.message || err?.response?.data || err?.message;
      alert(typeof serverMsg === 'string' ? serverMsg : 'Failed to add to cart.');
    } finally {
      setAdding(false);
    }
  };

  const handleBuyNow = () => navigate('/cart');

  if (loading) return <div className="text-center py-24">Loading movie...</div>;
  if (err) return <div className="text-center py-24 text-red-500">{err}</div>;
  if (!movie) return <div className="text-center py-24">Movie not found.</div>;

  // normalize images
  const images = Array.isArray(movie.vcdImage) ? movie.vcdImage : movie.vcdImage ? [movie.vcdImage] : [];
  const hero = images[0] || '';

  // Defensive formatting for numbers when rendering (ensures React gets primitives)
  const displayPrice = (movie.cost ?? movie.price) != null ? Number(movie.cost ?? movie.price) : null;
  const displayRating = movie.rating != null ? Number(movie.rating) : null;
  const displayQuantity = movie.quantity != null ? Number(movie.quantity) : null;

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      {/* Hero Section */}
      <div
        className="relative bg-cover bg-center"
        style={{
          backgroundImage: hero
            ? `linear-gradient(rgba(10,10,10,0.6), rgba(10,10,10,0.6)), url('${hero}')`
            : undefined,
          backgroundColor: hero ? undefined : '#111',
        }}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-28">
          <div className="grid md:grid-cols-3 gap-8 items-center">
            {/* Poster */}
            <div className="col-span-1">
              <img
                src={hero}
                alt={movie.vcdName}
                className="w-full h-auto rounded-lg shadow-xl object-cover"
              />
            </div>

            {/* Info */}
            <div className="col-span-2">
              <h1 className="text-4xl font-extrabold mb-4">
                {movie.vcdName}{' '}
                <span className="text-lg font-medium text-gray-300 ml-2">
                  ({movie.year || '—'})
                </span>
              </h1>
              <div className="flex items-center space-x-4 mb-4">
                <StarRating rating={displayRating} />
                <div className="text-sm text-gray-300">
                  {movie.genre?.primary || ''} • {movie.language || ''} •{' '}
                  {movie.runtimeMinutes ? `${movie.runtimeMinutes}m` : '—'}
                </div>
                <div className="text-sm text-gray-400">
                  Director: {movie.director || '—'}
                </div>
              </div>

              <p className="text-gray-200 mb-6 max-w-3xl">
                {movie.summary || 'No description available.'}
              </p>

              <div className="flex flex-wrap gap-3 mb-6">
                {(movie.genre?.tags || []).map((tag) => (
                  <span key={tag} className="text-sm bg-gray-800 bg-opacity-50 px-3 py-1 rounded-full">
                    {tag}
                  </span>
                ))}
              </div>

              <div className="flex items-center space-x-4">
                <button
                  onClick={handleAddToCart}
                  disabled={adding || (displayQuantity <= 0)}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg disabled:opacity-60"
                >
                  {adding ? 'Adding…' : displayQuantity > 0 ? 'Add to Cart' : 'Out of Stock'}
                </button>

                <button
                  onClick={handleBuyNow}
                  className="bg-transparent border border-gray-600 text-white font-semibold py-3 px-6 rounded-lg"
                >
                  Buy Now — ₹{displayPrice != null ? displayPrice.toFixed(2) : '0.00'}
                </button>
              </div>

              <div className="mt-6 text-sm text-gray-400">
                <div>Available: {displayQuantity ?? '—'}</div>
                <div>Category: {movie.category}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Gallery + Cast */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h2 className="text-2xl font-bold mb-4">Gallery</h2>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {images.length ? (
            images.map((img, i) => (
              <img
                key={String(i)}
                src={img}
                alt={`${movie.vcdName}-img-${i}`}
                className="w-48 h-28 object-cover rounded-md shadow-md flex-shrink-0"
              />
            ))
          ) : (
            <div className="text-gray-400">No images</div>
          )}
        </div>

        <div className="mt-8 grid md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-xl font-semibold mb-2">Cast</h3>
            <div className="text-gray-200">
              <div>
                <strong>Leads:</strong> {(movie.cast?.leads || []).join(', ') || '—'}
              </div>
              <div className="mt-2">
                <strong>Featured:</strong> {(movie.cast?.featured || []).join(', ') || '—'}
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-2">Details</h3>
            <table className="text-sm text-gray-200">
              <tbody>
                <tr>
                  <td className="pr-4 font-medium">Year</td>
                  <td>{movie.year || '—'}</td>
                </tr>
                <tr>
                  <td className="pr-4 font-medium">Runtime</td>
                  <td>{movie.runtimeMinutes ? `${movie.runtimeMinutes} minutes` : '—'}</td>
                </tr>
                <tr>
                  <td className="pr-4 font-medium">Director</td>
                  <td>{movie.director || '—'}</td>
                </tr>
                <tr>
                  <td className="pr-4 font-medium">Language</td>
                  <td>{movie.language || '—'}</td>
                </tr>
                <tr>
                  <td className="pr-4 font-medium">Rating</td>
                  <td>{displayRating ?? '—'}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}












// import React, { useEffect, useState } from 'react';
// import axios from 'axios';
// import { useParams, useNavigate } from 'react-router-dom';
// import StarRating from '../components/StarRating';

// export default function MovieDetails() {
//   const { vcdID } = useParams();
//   const navigate = useNavigate();

//   const [movie, setMovie] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [err, setErr] = useState('');
//   const [adding, setAdding] = useState(false);

//   const token = localStorage.getItem('token'); // ✅ Get JWT token
//   const email = (localStorage.getItem('userEmail') || '').trim();

//   useEffect(() => {
//     if (!vcdID) {
//       setErr('No movie specified.');
//       setLoading(false);
//       return;
//     }

//     const fetchMovie = async () => {
//       setLoading(true);
//       setErr('');
//       try {
//         const res = await axios.get(
//           `http://localhost:5000/api/vcds/by-id/${encodeURIComponent(vcdID)}`,
//           {
//             headers: token ? { Authorization: `Bearer ${token}` } : {},
//           }
//         );
//         setMovie(res.data);
//       } catch (error) {
//         console.error('Failed to fetch movie:', error?.response?.data || error?.message);
//         setErr(error?.response?.data?.message || 'Failed to load movie details.');
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchMovie();
//   }, [vcdID, token]);

//   const handleAddToCart = async () => {
//     if (!movie) return;
//     if (!email) {
//       alert('Please login to add to cart.');
//       return;
//     }

//     setAdding(true);
//     try {
//       await axios.post(
//         'http://localhost:5000/api/auth/cart/add',
//         {
//           email,
//           vcdID: movie.vcdID,
//           quantity: 1,
//         },
//         {
//           headers: token ? { Authorization: `Bearer ${token}` } : {},
//         }
//       );
//       alert('Added to cart');
//       navigate('/cart');
//     } catch (err) {
//       console.error('Add to cart failed:', err?.response?.data || err?.message);
//       alert('Failed to add to cart.');
//     } finally {
//       setAdding(false);
//     }
//   };

//   const handleBuyNow = () => navigate('/cart');

//   if (loading) return <div className="text-center py-24">Loading movie...</div>;
//   if (err) return <div className="text-center py-24 text-red-500">{err}</div>;
//   if (!movie) return <div className="text-center py-24">Movie not found.</div>;

//   const images = Array.isArray(movie.vcdImage)
//     ? movie.vcdImage
//     : movie.vcdImage
//     ? [movie.vcdImage]
//     : [];
//   const hero = images[0] || '';

//   return (
//     <div className="min-h-screen bg-gray-900 text-gray-100">
//       {/* Hero Section */}
//       <div
//         className="relative bg-cover bg-center"
//         style={{
//           backgroundImage: hero
//             ? `linear-gradient(rgba(10,10,10,0.6), rgba(10,10,10,0.6)), url('${hero}')`
//             : undefined,
//           backgroundColor: hero ? undefined : '#111',
//         }}
//       >
//         <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-28">
//           <div className="grid md:grid-cols-3 gap-8 items-center">
//             {/* Poster */}
//             <div className="col-span-1">
//               <img
//                 src={hero}
//                 alt={movie.vcdName}
//                 className="w-full h-auto rounded-lg shadow-xl object-cover"
//               />
//             </div>

//             {/* Info */}
//             <div className="col-span-2">
//               <h1 className="text-4xl font-extrabold mb-4">
//                 {movie.vcdName}{' '}
//                 <span className="text-lg font-medium text-gray-300 ml-2">
//                   ({movie.year || '—'})
//                 </span>
//               </h1>
//               <div className="flex items-center space-x-4 mb-4">
//                 <StarRating rating={movie.rating} />
//                 <div className="text-sm text-gray-300">
//                   {movie.genre?.primary || ''} • {movie.language || ''} •{' '}
//                   {movie.runtimeMinutes ? `${movie.runtimeMinutes}m` : '—'}
//                 </div>
//                 <div className="text-sm text-gray-400">
//                   Director: {movie.director || '—'}
//                 </div>
//               </div>

//               <p className="text-gray-200 mb-6 max-w-3xl">
//                 {movie.summary || 'No description available.'}
//               </p>

//               <div className="flex flex-wrap gap-3 mb-6">
//                 {(movie.genre?.tags || []).map((tag) => (
//                   <span
//                     key={tag}
//                     className="text-sm bg-gray-800 bg-opacity-50 px-3 py-1 rounded-full"
//                   >
//                     {tag}
//                   </span>
//                 ))}
//               </div>

//               <div className="flex items-center space-x-4">
//                 <button
//                   onClick={handleAddToCart}
//                   disabled={adding || movie.quantity <= 0}
//                   className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg disabled:opacity-60"
//                 >
//                   {adding
//                     ? 'Adding…'
//                     : movie.quantity > 0
//                     ? 'Add to Cart'
//                     : 'Out of Stock'}
//                 </button>

//                 <button
//                   onClick={handleBuyNow}
//                   className="bg-transparent border border-gray-600 text-white font-semibold py-3 px-6 rounded-lg"
//                 >
//                   Buy Now — ₹{Number(movie.cost || movie.price || 0).toFixed(2)}
//                 </button>
//               </div>

//               <div className="mt-6 text-sm text-gray-400">
//                 <div>Available: {movie.quantity}</div>
//                 <div>Category: {movie.category}</div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Gallery + Cast */}
//       <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10">
//         <h2 className="text-2xl font-bold mb-4">Gallery</h2>
//         <div className="flex gap-4 overflow-x-auto pb-2">
//           {images.length ? (
//             images.map((img, i) => (
//               <img
//                 key={String(i)}
//                 src={img}
//                 alt={`${movie.vcdName}-img-${i}`}
//                 className="w-48 h-28 object-cover rounded-md shadow-md flex-shrink-0"
//               />
//             ))
//           ) : (
//             <div className="text-gray-400">No images</div>
//           )}
//         </div>

//         <div className="mt-8 grid md:grid-cols-2 gap-8">
//           <div>
//             <h3 className="text-xl font-semibold mb-2">Cast</h3>
//             <div className="text-gray-200">
//               <div>
//                 <strong>Leads:</strong>{' '}
//                 {(movie.cast?.leads || []).join(', ') || '—'}
//               </div>
//               <div className="mt-2">
//                 <strong>Featured:</strong>{' '}
//                 {(movie.cast?.featured || []).join(', ') || '—'}
//               </div>
//             </div>
//           </div>

//           <div>
//             <h3 className="text-xl font-semibold mb-2">Details</h3>
//             <table className="text-sm text-gray-200">
//               <tbody>
//                 <tr>
//                   <td className="pr-4 font-medium">Year</td>
//                   <td>{movie.year || '—'}</td>
//                 </tr>
//                 <tr>
//                   <td className="pr-4 font-medium">Runtime</td>
//                   <td>
//                     {movie.runtimeMinutes
//                       ? `${movie.runtimeMinutes} minutes`
//                       : '—'}
//                   </td>
//                 </tr>
//                 <tr>
//                   <td className="pr-4 font-medium">Director</td>
//                   <td>{movie.director || '—'}</td>
//                 </tr>
//                 <tr>
//                   <td className="pr-4 font-medium">Language</td>
//                   <td>{movie.language || '—'}</td>
//                 </tr>
//                 <tr>
//                   <td className="pr-4 font-medium">Rating</td>
//                   <td>{movie.rating || '—'}</td>
//                 </tr>
//               </tbody>
//             </table>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }