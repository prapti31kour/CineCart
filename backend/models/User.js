import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  phoneNumber: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  cart: [
    {
      vcdID: { type: String, required: true },
      quantity: { type: Number, required: true, min: 1 }
    }
  ]
});


const User = mongoose.model('User', userSchema, 'users');
export default User;
