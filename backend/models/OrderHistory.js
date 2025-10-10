import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  vcdID: { type: String, required: true },
  title: { type: String },
  price: { type: Number, default: 0 },
  quantity: { type: Number, required: true, min: 1 }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  email: { type: String, required: true, index: true },
  items: { type: [orderItemSchema], default: [] },
  total: { type: Number, default: 0 },
  paymentMethod: { type: String, default: 'card' },
  address: { type: String, default: '' },
  status: { type: String, enum: ['placed','processing','shipped','delivered','cancelled'], default: 'placed' },
  placedAt: { type: Date, default: Date.now }
}, { timestamps: true });

const OrderHistory = mongoose.model('OrderHistory', orderSchema, 'orders');
export default OrderHistory;
