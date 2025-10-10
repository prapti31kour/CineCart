import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import vcdRoutes from './routes/vcdRoutes.js';
import authRoutes from './routes/auth.js';
import orderRoutes from './routes/orders.js';
import cartRoutes from './routes/cart.js';

dotenv.config();

const app = express();

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));


app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

app.use('/api/vcds', vcdRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/cart', cartRoutes);

app.listen(5000, () => console.log('Server running on port 5000'));











// import express from 'express';
// import mongoose from 'mongoose';
// import cors from 'cors';
// import dotenv from 'dotenv';
// import vcdRoutes from './routes/vcdRoutes.js';
// import authRoutes from './routes/auth.js';
// import orderRoutes from './routes/orders.js';
// import cartRoutes from './routes/cart.js';

// dotenv.config();

// const app = express();
// app.use(cors());
// app.use(express.json());

// mongoose.connect(process.env.MONGO_URI)
//   .then(() => console.log('MongoDB connected'))
//   .catch(err => console.error('MongoDB connection error:', err));

// app.use('/api/vcds', vcdRoutes);
// app.use('/api/auth', authRoutes);
// app.use('/api/orders', orderRoutes);
// app.use('/api/cart', cartRoutes);


// app.listen(5000, () => console.log('Server running on port 5000'));
