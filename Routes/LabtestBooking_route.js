import express from 'express';
import {
  createLabBooking,
  getMyBookings,
  getBookingById,
  cancelBooking,
  getAssignedBookings,
  updateTestResult,
  updateBookingStatus
} from '../Controllers/LabtestBooking_Con.js'

import { protect, authorizeRoles } from '../Middleware/authen.js';

const bookingRoute = express.Router();

// PATIENT ROUTES
bookingRoute.post('/', protect, authorizeRoles('patient'), createLabBooking);
bookingRoute.get('/', protect, authorizeRoles('patient'), getMyBookings);
bookingRoute.get('/:id', protect, authorizeRoles('patient'), getBookingById);
bookingRoute.delete('/:id', protect, authorizeRoles('patient'), cancelBooking);

// TECHNICIAN ROUTES
bookingRoute.get('/technician/bookings', protect, authorizeRoles('technician'), getAssignedBookings);
bookingRoute.put('/technician/bookings/:id/result', protect, authorizeRoles('technician'), updateTestResult);
bookingRoute.put('/technician/bookings/:id/status', protect, authorizeRoles('technician'), updateBookingStatus);

// ADMIN ROUTE - Get all bookings
bookingRoute.get('/admin/all', protect, authorizeRoles('admin'), async (req, res) => {
  try {
    const { LabTestBooking } = await import('../Models/Labtestbooking_Mod.js');
    const bookings = await LabTestBooking.find().sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    console.error('Admin get all bookings error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default bookingRoute;
