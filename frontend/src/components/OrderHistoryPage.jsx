import React, { useEffect, useState } from 'react';
import axios from 'axios';
import api from '../api'; // make sure path is correct


export default function OrderHistoryPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState('');

  const email = (localStorage.getItem('userEmail') || '').trim();
  const token = localStorage.getItem('token') || ''; // JWT from login

  useEffect(() => {
    const loadOrders = async () => {
      if (!email) {
        setErrMsg('No user email found. Please log in.');
        return;
      }
      setLoading(true);
      setErrMsg('');
      try {
        const res = await axios.get('http://localhost:5000/api/orders', {
          params: { email },
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = Array.isArray(res.data.orders) ? res.data.orders : (res.data || []);

        let normalized = data
          .map(o => ({ ...o, placedAt: o.placedAt ? new Date(o.placedAt) : new Date(0) }))
          .sort((a, b) => b.placedAt - a.placedAt);

        const idsToFetchSet = new Set();
        normalized.forEach(order => {
          if (Array.isArray(order.items)) {
            order.items.forEach(it => {
              const id = String(it.vcdID || it.id || '').trim();
              if (id && !it.vcdImage && !it.image && !it.thumbnail) idsToFetchSet.add(id);
            });
          }
        });

        const idsToFetch = Array.from(idsToFetchSet);
        const imagesMap = {};
        if (idsToFetch.length) {
          // const promises = idsToFetch.map(id =>
          //   axios.get(`http://localhost:5000/api/vcds/images/${encodeURIComponent(id)}`)
          //     .then(r => ({ id, images: Array.isArray(r.data.images) ? r.data.images : [] }))
          //     .catch(() => ({ id, images: [] }))
          // );
          const promises = idsToFetch.map(id =>
            api.get(`/api/vcds/images/${encodeURIComponent(id)}`)
              .then(r => ({ id, images: Array.isArray(r.data.images) ? r.data.images : [] }))
              .catch(() => ({ id, images: [] }))
          );

          const results = await Promise.all(promises);
          results.forEach(r => { if (r.images.length) imagesMap[r.id] = r.images[0]; });
        }

        normalized = normalized.map(order => {
          if (!Array.isArray(order.items)) return order;
          const patchedItems = order.items.map(it => {
            const id = String(it.vcdID || it.id || '').trim();
            const existing = it.vcdImage || it.image || it.thumbnail;
            const fetched = id && imagesMap[id] ? imagesMap[id] : '';
            return { ...it, vcdImage: existing || fetched || '' };
          });
          return { ...order, items: patchedItems };
        });

        setOrders(normalized);
      } catch (err) {
        console.error('Fetch orders failed:', err?.response?.data || err.message);
        setErrMsg(err?.response?.data?.message || 'Failed to load orders.');
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, [email, token]);

  const formatDate = (d) => {
    try {
      return d.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
    } catch {
      return String(d);
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-bold text-center mb-8 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
        Your Order History
      </h1>

      {loading && <p className="text-center text-gray-400">Loading orders…</p>}
      {!loading && errMsg && <p className="text-center text-red-400">{errMsg}</p>}

      {!loading && orders.length === 0 && !errMsg ? (
        <div className="text-center py-20 bg-gray-800 bg-opacity-40 rounded-lg">
          <p className="text-xl text-gray-400 mb-4">No orders yet.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map(order => (
            <div key={order._id} className="bg-gray-800 bg-opacity-40 p-6 rounded-lg shadow-lg">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold">Order — {order._id}</h2>
                  <p className="text-sm text-gray-400">Placed at: {formatDate(order.placedAt)}</p>
                </div>
                <div className="text-right">
                  {typeof order.total !== 'undefined' && (
                    <p className="font-bold text-lg">₹{Number(order.total || 0).toFixed(2)}</p>
                  )}
                  <p className="text-sm text-gray-400">Status: {order.status || 'unknown'}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Array.isArray(order.items) && order.items.length ? (
                  order.items.map((it, idx) => (
                    <div key={idx} className="flex items-center bg-gray-900 bg-opacity-30 p-3 rounded">
                      <img
                        src={it.vcdImage || ''}
                        alt={it.title || it.vcdName || ''}
                        onError={(e) => { e.currentTarget.src = ''; }}
                        className="w-20 h-28 object-cover rounded mr-4"
                      />
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <h3 className="font-semibold">{it.title || it.vcdName || 'Untitled'}</h3>
                          <span className="text-sm text-gray-400">Qty: {Number(it.quantity || 1)}</span>
                        </div>
                        <p className="text-sm text-gray-400">ID: {String(it.vcdID || it.id || '').slice(0, 24)}</p>
                        <p className="mt-2 font-semibold">₹{Number(it.price || it.cost || 0).toFixed(2)}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-400">No items recorded for this order.</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}















// import React, { useEffect, useState } from 'react';
// import axios from 'axios';

// export default function OrderHistoryPage() {
//   const [orders, setOrders] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [errMsg, setErrMsg] = useState('');

//   // email can come from localStorage or be changed as needed
//   const email = (localStorage.getItem('userEmail') || '').trim();

//   useEffect(() => {
//     const loadOrders = async () => {
//       if (!email) {
//         setErrMsg('No user email found. Please log in.');
//         return;
//       }
//       setLoading(true);
//       setErrMsg('');
//       try {
//         const res = await axios.get('http://localhost:5000/api/orders', { params: { email } });
//         const data = Array.isArray(res.data.orders) ? res.data.orders : (res.data || []);

//         // ensure placedAt is Date and sort latest-first
//         let normalized = data
//           .map(o => ({ ...o, placedAt: o.placedAt ? new Date(o.placedAt) : new Date(0) }))
//           .sort((a, b) => b.placedAt - a.placedAt);

//         // Collect unique vcdIDs that we need images for (prefer items missing vcdImage)
//         const idsToFetchSet = new Set();
//         normalized.forEach(order => {
//           if (Array.isArray(order.items)) {
//             order.items.forEach(it => {
//               const id = String(it.vcdID || it.id || '').trim();
//               if (id && !it.vcdImage && !it.image && !it.thumbnail) {
//                 idsToFetchSet.add(id);
//               }
//             });
//           }
//         });
//         const idsToFetch = Array.from(idsToFetchSet);

//         // Fetch images for each vcdID in parallel (safe: continue on failures)
//         const imagesMap = {}; // vcdID -> first image url (or undefined)
//         if (idsToFetch.length) {
//           const promises = idsToFetch.map(id =>
//             axios.get(`http://localhost:5000/api/vcds/images/${encodeURIComponent(id)}`)
//               .then(r => ({ id, images: Array.isArray(r.data.images) ? r.data.images : [] }))
//               .catch(err => {
//                 console.error(`Failed to fetch images for ${id}:`, err?.response?.data || err.message);
//                 return { id, images: [] };
//               })
//           );

//           const results = await Promise.all(promises);
//           results.forEach(r => {
//             if (r.images && r.images.length) imagesMap[r.id] = r.images[0];
//           });
//         }

//         // Patch normalized orders items with fetched images (if available)
//         normalized = normalized.map(order => {
//           if (!Array.isArray(order.items)) return order;
//           const patchedItems = order.items.map(it => {
//             const id = String(it.vcdID || it.id || '').trim();
//             // priority: existing vcdImage > existing image/thumbnail > fetched image > empty string
//             const existing = it.vcdImage || it.image || it.thumbnail;
//             const fetched = id && imagesMap[id] ? imagesMap[id] : '';
//             return { ...it, vcdImage: existing || fetched || '' };
//           });
//           return { ...order, items: patchedItems };
//         });

//         setOrders(normalized);
//       } catch (err) {
//         console.error('Fetch orders failed:', err?.response?.data || err.message);
//         setErrMsg(err?.response?.data?.message || 'Failed to load orders.');
//       } finally {
//         setLoading(false);
//       }
//     };

//     loadOrders();
//   }, [email]);

//   const formatDate = (d) => {
//     try {
//       return d.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
//     } catch {
//       return String(d);
//     }
//   };

//   return (
//     <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
//       <h1 className="text-4xl font-bold text-center mb-8 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
//         Your Order History
//       </h1>

//       {loading && <p className="text-center text-gray-400">Loading orders…</p>}
//       {!loading && errMsg && <p className="text-center text-red-400">{errMsg}</p>}

//       {!loading && orders.length === 0 && !errMsg ? (
//         <div className="text-center py-20 bg-gray-800 bg-opacity-40 rounded-lg">
//           <p className="text-xl text-gray-400 mb-4">No orders yet.</p>
//         </div>
//       ) : (
//         <div className="space-y-6">
//           {orders.map(order => (
//             <div key={order._id} className="bg-gray-800 bg-opacity-40 p-6 rounded-lg shadow-lg">
//               <div className="flex items-start justify-between mb-4">
//                 <div>
//                   <h2 className="text-lg font-semibold">Order — {order._id}</h2>
//                   <p className="text-sm text-gray-400">Placed at: {formatDate(order.placedAt)}</p>
//                 </div>
//                 <div className="text-right">
//                   {typeof order.total !== 'undefined' && (
//                     <p className="font-bold text-lg">₹{Number(order.total || 0).toFixed(2)}</p>
//                   )}
//                   <p className="text-sm text-gray-400">Status: {order.status || 'unknown'}</p>
//                 </div>
//               </div>

//               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                 {Array.isArray(order.items) && order.items.length ? (
//                   order.items.map((it, idx) => (
//                     <div key={idx} className="flex items-center bg-gray-900 bg-opacity-30 p-3 rounded">
//                       <img
//                         src={it.vcdImage || ''}
//                         alt={it.title || it.vcdName || ''}
//                         onError={(e) => { e.currentTarget.src = ''; }}
//                         className="w-20 h-28 object-cover rounded mr-4"
//                       />
//                       <div className="flex-1">
//                         <div className="flex justify-between items-start">
//                           <h3 className="font-semibold">{it.title || it.vcdName || 'Untitled'}</h3>
//                           <span className="text-sm text-gray-400">Qty: {Number(it.quantity || 1)}</span>
//                         </div>
//                         <p className="text-sm text-gray-400">ID: {String(it.vcdID || it.id || '').slice(0, 24)}</p>
//                         <p className="mt-2 font-semibold">₹{Number(it.price || it.cost || 0).toFixed(2)}</p>
//                       </div>
//                     </div>
//                   ))
//                 ) : (
//                   <p className="text-gray-400">No items recorded for this order.</p>
//                 )}
//               </div>
//             </div>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// }





