import express from 'express';
import {
  register,
  login,
  verifyOTP,
  resendOTP,
  forgotPassword,
  resetPassword,
  getUserProfile,
  updateUserProfile,
  deleteUserAccount,
  updateUserRole,
  getAllUsers
} from '../Controllers/User_Con.js';
import { registerSchema, loginSchema, verifyOtpSchema,forgotPasswordSchema,resetPasswordSchema } from '../Validator/Validate.js';
import { validateRequest } from '../Middleware/ValidateRequest.js';

import { protect, authorizeRoles } from '../Middleware/authen.js';

const userRoute = express.Router();

// Public routes
userRoute.post('/register', validateRequest(registerSchema), register);
userRoute.post('/login', validateRequest(loginSchema), login);
userRoute.post('/verify-otp', validateRequest(verifyOtpSchema), verifyOTP);
userRoute.post('/resend-otp', validateRequest(forgotPasswordSchema), resendOTP);
userRoute.post('/forgot-password', validateRequest(forgotPasswordSchema), forgotPassword);
userRoute.post('/reset-password/:token', validateRequest(resetPasswordSchema), resetPassword);


// Protected
userRoute.get('/profile', protect, getUserProfile);
userRoute.put('/profile', protect, updateUserProfile);
userRoute.delete('/profile', protect, deleteUserAccount);

// Admin only
userRoute.put('/update-role', protect, authorizeRoles('admin'), updateUserRole);
userRoute.get('/get-all-users', protect, authorizeRoles('admin'), getAllUsers);
export default userRoute;
