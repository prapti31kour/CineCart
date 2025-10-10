// routes/auth.js
import express from 'express';
import bcrypt from 'bcrypt';
import User from '../models/User.js';
import { generateToken } from '../middleware/authMiddleware.js';
import admin from '../config/admin.js';  // your hardcoded admin config

const router = express.Router();
const norm = (s) => (s || '').trim().toLowerCase();

router.post('/signup', async (req, res) => {
  try {
    const { firstName, lastName, phoneNumber, email, password, role } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'email and password required' });

    const em = norm(email);
    const existing = await User.findOne({ email: em });
    if (existing) return res.status(400).json({ message: 'Email already registered' });

    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ firstName, lastName, phoneNumber, email: em, password: hash, role });

    const token = generateToken({ id: user._id, email: user.email, role: user.role });
    const safeUser = user.toObject(); delete safeUser.password;

    return res.status(201).json({ message: 'User created', user: safeUser, token });
  } catch (err) {
    console.error('Signup error:', err);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

// router.post('/login', async (req, res) => {
//   try {
//     const { email, password } = req.body;
//     const em = norm(email);
//     const user = await User.findOne({ email: em });
//     if (!user) return res.status(400).json({ message: 'User not found' });

//     const match = await bcrypt.compare(password, user.password);
//     if (!match) return res.status(400).json({ message: 'Incorrect password' });

//     const token = generateToken({ id: user._id, email: user.email, role: user.role });
//     const safeUser = user.toObject(); delete safeUser.password;

//     return res.json({ message: 'Login successful', user: safeUser, token });
//   } catch (err) {
//     console.error('Login error:', err);
//     return res.status(500).json({ message: 'Internal Server Error' });
//   }
// });


router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const em = norm(email);

    // ✅ Handle hardcoded admin login
    if (em === norm(admin.email) && password === admin.password) {
      const token = generateToken({ id: 'admin', email: admin.email, role: 'admin' });
      return res.json({
        message: 'Admin login successful',
        user: { email: admin.email, role: 'admin' },
        token
      });
    }

    const user = await User.findOne({ email: em });
    if (!user) return res.status(400).json({ message: 'User not found' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: 'Incorrect password' });

    const token = generateToken({ id: user._id, email: user.email, role: user.role });
    const safeUser = user.toObject(); delete safeUser.password;

    return res.json({ message: 'Login successful', user: safeUser, token });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

export default router;


