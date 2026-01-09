// import express from 'express';
// import mongoose from 'mongoose';
// import cors from 'cors';
// import helmet from 'helmet';
// import morgan from 'morgan';
// import http from 'http';
// import { Server } from 'socket.io';
// import dotenv from 'dotenv';

// import authRoutes from './api/routes/auth.js';
// import menuRoutes from './api/routes/menu.js';
// import orderRoutes from './api/routes/orders.js';
// import adminRoutes from './api/routes/admin.js';
// import dealRoutes from './api/routes/deals.js';
// import { verifyToken, verifyAdmin } from './api/middleware/auth.js';

// dotenv.config();

// const app = express();
// app.use(express.json());
// const server = http.createServer(app);
// const io = new Server(server, {
//   cors: {
//     origin: process.env.FRONTEND_URL || "http://localhost:3000",
//     credentials: true
//   }
// });

// // Middleware
// app.use(helmet());
// app.use(cors({
//   origin: process.env.FRONTEND_URL || "http://localhost:3000",
//   credentials: true
// }));
// app.use(morgan('dev'));

// app.use(express.urlencoded({ extended: true }));

// // Socket.io connection
// io.on('connection', (socket) => {
//   console.log('New client connected');
  
//   socket.on('joinAdminRoom', () => {
//     socket.join('admin-room');
//   });
  
//   socket.on('disconnect', () => {
//     console.log('Client disconnected');
//   });
// });

// // Make io accessible to routes
// app.set('io', io);

// // Routes
// app.use('/api/auth', authRoutes);
// app.use('/api/menu', menuRoutes);
// app.use('/api/orders', verifyToken, orderRoutes);
// app.use('/api/deals', dealRoutes);
// app.use('/api/admin', verifyToken, verifyAdmin, adminRoutes);

// // Health check
// app.get('/api/health', (req, res) => {
//   res.json({ status: 'OK', timestamp: new Date().toISOString() });
// });

// // MongoDB Connection
// const connectDB = async () => {
//   try {
//     await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/food_ordering', {
//       useNewUrlParser: true,
//       useUnifiedTopology: true,
//     });
//     console.log('MongoDB connected successfully');
//   } catch (error) {
//     console.error('MongoDB connection error:', error);
//     process.exit(1);
//   }
// };

// // Error handling middleware
// app.use((err, req, res, next) => {
//   console.error(err.stack);
//   res.status(err.status || 500).json({
//     message: err.message || 'Something went wrong!',
//     ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
//   });
// });

// const PORT = process.env.PORT || 5000;

// const startServer = async () => {
//   await connectDB();
//   server.listen(PORT, () => {
//     console.log(`Server running on port ${PORT}`);
//     console.log(`Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
//   });
// };

// startServer();

// export { app, io };
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

import authRoutes from './api/routes/auth.js';
import menuRoutes from './api/routes/menu.js';
import orderRoutes from './api/routes/orders.js';
import adminRoutes from './api/routes/admin.js';
import dealRoutes from './api/routes/deals.js';
import { verifyToken, verifyAdmin } from './api/middleware/auth.js';

dotenv.config();

const app = express();

/* =======================
   MIDDLEWARE
======================= */
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

/* =======================
   ROOT ROUTE (IMPORTANT)
======================= */
app.get('/', (req, res) => {
  res.status(200).send('🚀 Online Ordering Backend is Live on Vercel');
});

/* =======================
   API ROUTES
======================= */
app.use('/api/auth', authRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/orders', verifyToken, orderRoutes);
app.use('/api/deals', dealRoutes);
app.use('/api/admin', verifyToken, verifyAdmin, adminRoutes);

/* =======================
   HEALTH CHECK
======================= */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    environment: process.env.NODE_ENV || 'production',
    timestamp: new Date().toISOString()
  });
});

/* =======================
   ERROR HANDLER
======================= */
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

/* =======================
   DATABASE CONNECTION
======================= */
let isConnected = false;

const connectDB = async () => {
  if (isConnected) return;

  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    isConnected = true;
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB Error:', error);
    throw error;
  }
};

// Vercel serverless handler
export default async function handler(req, res) {
  await connectDB();
  return app(req, res);
}
