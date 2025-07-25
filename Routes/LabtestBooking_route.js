import express from 'express';
import {
  bookAppointment, getMyAppointments, getSingleAppointment, getAllAppointmentsForTechnician, cancelAppointmentByPatient,
  updateAppointmentByPatient
} from '../Controllers/LabtestBooking_Con.js';
import { authenticateTechnician, authorizeRoles, protect } from '../Middleware/authen.js';

const router = express.Router();

// Protected routes
router.post('/book', protect, bookAppointment);
router.get('/appointments', protect, getMyAppointments)
router.get('/appointment/:id', protect, getSingleAppointment)
router.get('/appointments/all', authenticateTechnician, getAllAppointmentsForTechnician)
router.delete('/appointment/:id/cancel', protect, cancelAppointmentByPatient)
router.put('/update-appointments/:id', protect, updateAppointmentByPatient)
export default router;
