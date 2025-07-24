// routes/LabTestRoutes.js (or wherever your routes are defined)

import express from 'express';
import {
  bookLabTest,
  scheduleLabTest,
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

// Book a lab test
router.post('/book', protect, authorizeRoles('user'), bookLabTest);

// Schedule a test
router.patch('/:id/schedule', protect, authorizeRoles('admin', 'technician'), scheduleLabTest);

// Schedule a test
router.patch('/:id/schedule', protect, authorizeRoles('admin', 'technician'), scheduleLabTest);

// Get test by ID
router.get('/:id', protect, getLabTestBookingById);

// Start test (Technician only)
router.patch('/:id/start', protect, authorizeRoles('technician'), startLabTest);

// Complete test (Technician only)
router.patch('/:id/complete', protect, authorizeRoles('technician'), completeLabTest);

// Get today’s shift tasks
router.get('/today/shift', protect, authorizeRoles('technician'), getTodayTestsForTechnician);

// Get all lab tests
router.get('/', protect, authorizeRoles('admin'), getAllLabTests);

// Get all lab tests by user
router.get('/user/:userId', protect, getUserLabTests);

// Get all lab tests assigned to technician
router.get('/technician/:technicianId', protect, authorizeRoles('technician'), getTechnicianLabTests);

// Get lab tests for a specific date
router.get('/date/:date', protect, getLabTestsByDate);

// Get available time slots for a date
router.get('/available-slots/:date', protect, getAvailableSlots);

export default router;
