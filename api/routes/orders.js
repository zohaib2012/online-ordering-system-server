import express from 'express';
import {
  createOrder,
  getUserOrders,
  getOrder,
  cancelOrder
} from '../controllers/orderController.js';
import { validateOrder, validateResult } from '../middleware/validate.js';

const router = express.Router();

router.post('/', validateOrder, validateResult, createOrder);
router.get('/', getUserOrders);
router.get('/:id', getOrder);
router.put('/:id/cancel', cancelOrder);

export default router;