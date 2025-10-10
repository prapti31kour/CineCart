// backend/routes/orders.js
import express from 'express';
import User from '../models/User.js';
import OrderHistory from '../models/OrderHistory.js';
import { verifyTokenMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * POST /api/orders/create
 * - Protected: requires valid JWT (verifyTokenMiddleware)
 * - Uses req.user.email if present; falls back to req.body.email (for backward compatibility)
 */
router.post('/create', verifyTokenMiddleware, async (req, res) => {
  try {
    const requesterEmail = req.user?.email;
    const { email: bodyEmail, items, paymentMethod, address, clearCart = true } = req.body;
    const email = (requesterEmail || bodyEmail || '').trim().toLowerCase();

    if (!email || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'email and non-empty items array required' });
    }

    const user = await User.findOne({ email }).select('_id cart').lean();
    if (!user) return res.status(404).json({ message: 'User not found' });

    // compute total
    const total = items.reduce((s, it) => s + (Number(it.price || 0) * Number(it.quantity || 0)), 0);

    const order = await OrderHistory.create({
      user: user._id,
      email,
      items: items.map(i => ({
        vcdID: String(i.vcdID ?? '').trim(),
        title: i.title ?? '',
        price: Number(i.price || 0),
        quantity: Number(i.quantity || 1)
      })),
      total,
      paymentMethod: paymentMethod || 'unknown',
      address: address || '',
      status: 'placed',
      placedAt: new Date()
    });

    // optionally clear user's cart (only if same user)
    if (clearCart) {
      await User.findOneAndUpdate({ email }, { $set: { cart: [] } });
    }

    return res.status(201).json({ message: 'Order placed', orderId: order._id, order });
  } catch (err) {
    console.error('create order error:', err);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

/**
 * GET /api/orders?email=...
 * - Protected: requires JWT (verifyTokenMiddleware)
 * - Uses req.user.email if present; falls back to query param
 */
router.get('/', verifyTokenMiddleware, async (req, res) => {
  try {
    const requesterEmail = req.user?.email;
    const queryEmail = (req.query.email || '').trim().toLowerCase();
    const email = (requesterEmail || queryEmail).trim();

    if (!email) return res.status(400).json({ message: 'Email is required' });

    const orders = await OrderHistory.find({ email })
      .sort({ placedAt: -1 })
      .lean();

    return res.json({ count: orders.length, orders });
  } catch (err) {
    console.error('fetch orders error:', err);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

export default router;



















// import express from 'express';
// import User from '../models/User.js';
// import OrderHistory from '../models/OrderHistory.js';

// const router = express.Router();

// // Create order from provided items (or you can fetch from user's cart)
// router.post('/create', async (req, res) => {
//   try {
//     const { email, items, paymentMethod, address, clearCart = true } = req.body;
//     if (!email || !Array.isArray(items) || items.length === 0) {
//       return res.status(400).json({ message: 'email and non-empty items array required' });
//     }

//     const user = await User.findOne({ email }).select('_id cart').lean();
//     if (!user) return res.status(404).json({ message: 'User not found' });

//     // compute total
//     const total = items.reduce((s, it) => s + (Number(it.price || 0) * Number(it.quantity || 0)), 0);

//     const order = await OrderHistory.create({
//       user: user._id,
//       email,
//       items: items.map(i => ({
//         vcdID: String(i.vcdID),
//         title: i.title || '',
//         price: Number(i.price || 0),
//         quantity: Number(i.quantity || 1)
//       })),
//       total,
//       paymentMethod: paymentMethod || 'unknown',
//       address: address || '',
//       status: 'placed',
//       placedAt: new Date()
//     });

//     // optionally clear user's cart
//     if (clearCart) {
//       await User.findOneAndUpdate({ email }, { $set: { cart: [] } });
//     }

//     return res.status(201).json({ message: 'Order placed', orderId: order._id, order });
//   } catch (err) {
//     console.error('create order error:', err);
//     return res.status(500).json({ message: 'Internal Server Error' });
//   }
// });

// // Get order history for a user
// router.get('/', async (req, res) => {
//   try {
//     const email = (req.query.email || '').trim().toLowerCase();
//     if (!email) return res.status(400).json({ message: 'Email is required' });

//     const orders = await OrderHistory.find({ email })
//       .sort({ placedAt: -1 })
//       .lean();

//     return res.json({ count: orders.length, orders });
//   } catch (err) {
//     console.error('fetch orders error:', err);
//     return res.status(500).json({ message: 'Internal Server Error' });
//   }
// });

// export default router;
