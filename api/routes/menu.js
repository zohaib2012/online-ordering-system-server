import express from 'express';
import {
  getCategories,
  getMenuItems,
  getTopSelling,
  getMenuItem,
  getMenuByCategory
} from '../controllers/menuController.js';

const router = express.Router();

router.get('/categories', getCategories);
router.get('/items', getMenuItems);
router.get('/top-selling', getTopSelling);
router.get('/items/:id', getMenuItem);
router.get('/category/:categoryId', getMenuByCategory);

export default router;