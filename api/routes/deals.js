import express from 'express';
import upload from '../middleware/upload.js';
import {
  getActiveDeals,
  createDeal,
  updateDeal,
  deleteDeal,
  getAllDeals
} from '../controllers/dealController.js';

const router = express.Router();

// Public routes
router.get('/', getActiveDeals);

// Admin routes (add verifyAdmin middleware in production)
router.post('/create', upload.single('image'), createDeal);
router.put('/:id', upload.single('image'), updateDeal);
router.delete('/:id', deleteDeal);
router.get('/all', getAllDeals);

export default router;