// routes/cart.js
import express from 'express';
import User from '../models/User.js';
import { verifyTokenMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();
const norm = (s) => (s || '').trim().toLowerCase();

// All cart routes require a valid JWT
router.use(verifyTokenMiddleware);

// Add to cart
router.post('/add', async (req, res) => {
  try {
    const { vcdID, quantity } = req.body;
    const email = norm(req.user.email);

    if (!vcdID || !quantity || Number(quantity) < 1) {
      return res.status(400).json({ message: 'vcdID and positive quantity are required' });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const idx = user.cart.findIndex(item => String(item.vcdID) === String(vcdID));
    if (idx !== -1) {
      user.cart[idx].quantity += Number(quantity);
    } else {
      user.cart.push({ vcdID: String(vcdID).trim(), quantity: Number(quantity) });
    }

    await user.save();
    return res.json({ message: 'Cart updated', cart: user.cart });
  } catch (err) {
    console.error('Cart add error:', err);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Get cart
router.get('/', async (req, res) => {
  try {
    const email = norm(req.user.email);
    const user = await User.findOne({ email }, { cart: 1, _id: 0 }).lean();
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.json(user.cart || []);
  } catch (err) {
    console.error('Cart fetch error:', err);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Update item quantity
router.put('/update', async (req, res) => {
  try {
    const { itemId, quantity } = req.body;
    const email = norm(req.user.email);
    if (!itemId || quantity === undefined) return res.status(400).json({ message: 'itemId and quantity required' });

    const newQuantity = Number(quantity);
    if (!Number.isFinite(newQuantity) || newQuantity <= 0) return res.status(400).json({ message: 'quantity must be positive' });

    await User.updateOne({ email, 'cart.vcdID': itemId }, { $set: { 'cart.$.quantity': newQuantity } });
    const user = await User.findOne({ email }).select('cart').lean();
    return res.json({ success: true, cart: user ? user.cart : [] });
  } catch (err) {
    console.error('cart/update error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Remove item
router.delete('/remove', async (req, res) => {
  try {
    const { vcdID } = req.body;
    const email = norm(req.user.email);
    if (!vcdID) return res.status(400).json({ message: 'vcdID required' });

    await User.updateOne({ email }, { $pull: { cart: { vcdID: String(vcdID).trim() } } });
    const user = await User.findOne({ email }).select('cart').lean();
    return res.json({ message: 'Item removed if existed', cart: user ? user.cart : [] });
  } catch (err) {
    console.error('Cart remove error:', err);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Empty cart
router.delete('/empty', async (req, res) => {
  try {
    const email = norm(req.user.email);
    const user = await User.findOneAndUpdate({ email }, { $set: { cart: [] } }, { new: true });
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.json({ message: 'Cart emptied', cart: user.cart });
  } catch (err) {
    console.error('Cart empty error:', err);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Cart count
router.get('/count', async (req, res) => {
  try {
    const email = norm(req.user.email);
    const user = await User.findOne({ email }, { cart: 1, _id: 0 }).lean();
    if (!user) return res.status(404).json({ message: 'User not found' });

    const objectCount = Array.isArray(user.cart) ? user.cart.length : 0;
    const totalQuantity = (user.cart || []).reduce((s, it) => s + (Number(it.quantity) || 0), 0);
    return res.json({ email, objectCount, totalQuantity });
  } catch (err) {
    console.error('Cart count error:', err);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

export default router;
