import express from 'express';
import {
  bookLabTest,
  getLabTestBookingById,
  startLabTest,
  completeLabTest,
  getTodayTestsForTechnician,
  getAllLabTests,
  getUserLabTests,
  getTechnicianLabTests,
  getLabTestsByDate,
  getAvailableSlots,
  
} from '../Controllers/LabtestBooking_Con.js';

import { protect, authorizeRoles } from '../Middleware/authen.js';

const router = express.Router();

// Book a lab test (User only)
router.post('/book', protect, authorizeRoles('user'), bookLabTest);


// Get a test booking by ID (Any authenticated user)
router.get('/:id', protect, getLabTestBookingById);

// Start a test (Technician only)
router.patch('/:id/start', protect, authorizeRoles('technician'), startLabTest);

// Complete a test (Technician only)
router.patch('/:id/complete', protect, authorizeRoles('technician'), completeLabTest);

// Get today’s tests for logged-in technician
router.get('/today/shift', protect, authorizeRoles('technician'), getTodayTestsForTechnician);

// Admin: Get all lab tests
router.get('/', protect, authorizeRoles('admin'), getAllLabTests);

// User: Get all their own bookings
router.get('/user/:userId', protect, getUserLabTests);

// Technician: Get all assigned tests
router.get('/technician/:technicianId', protect, authorizeRoles('technician'), getTechnicianLabTests);

// Get all tests on a specific date
router.get('/date/:date', protect, getLabTestsByDate);

// Get available time slots for a specific date
router.get('/available-slots/:date', protect, getAvailableSlots);

export default router;
