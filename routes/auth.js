import express from 'express';
import { 
  register, 
  login, 
  getProfile, 
  updateProfile,
  changePassword 
} from '../controllers/authController.js';
import { verifyToken } from '../middleware/auth.js';
import { 
  validateRegister, 
  validateLogin, 
  validateResult 
} from '../middleware/validate.js';

const router = express.Router();

router.post('/register', validateRegister, validateResult, register);
router.post('/login', validateLogin, validateResult, login);
router.get('/profile', verifyToken, getProfile);
router.put('/profile', verifyToken, updateProfile);
router.put('/change-password', verifyToken, changePassword);

export default router;