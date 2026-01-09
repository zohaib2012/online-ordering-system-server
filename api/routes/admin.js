import express from 'express';
import upload, { test, test1 } from '../middleware/upload.js';
import {
  getDashboardStats,
  addMenuItem,
  updateMenuItem,
  deleteMenuItem,
  getAllMenuItems,
  addCategory,
  updateCategory,
  getAllCategories,
  getAllOrders,
  updateOrderStatus,
  getOrderDetails,
  getSalesReport,
  getAllUsers
} from '../controllers/adminController.js';
import { validateMenuItem, validateResult } from '../middleware/validate.js';

const router = express.Router();

// Dashboard
router.get('/dashboard', getDashboardStats);

// Menu Management
router.post('/menu-items', upload.single('image'), validateMenuItem, validateResult, addMenuItem);
router.put('/menu-items/:id', upload.single('image'), updateMenuItem);
router.delete('/menu-items/:id', deleteMenuItem);
router.get('/menu-items', getAllMenuItems);

// Category Management
router.post('/categories', upload.single('image'), addCategory);
router.put('/categories/:id', upload.single('image'), updateCategory);
router.get('/categories', getAllCategories);

// Order Management
router.get('/orders', getAllOrders);
router.put('/orders/:id/status', updateOrderStatus);
router.get('/orders/:id', getOrderDetails);

// Reports
router.get('/reports/sales', getSalesReport);

// User Management
router.get('/users', getAllUsers);

export default router;