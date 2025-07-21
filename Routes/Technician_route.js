import express from 'express';
import {
  acceptTechnicianInvitation,
  getAllTechnicians,
  getTechnicianById,
  getTechnicianProfile,
  updateTechnician,
  deleteTechnician,
  inviteTechnician
} from '../Controllers/Technician_Con.js';
import { authenticateTechnician, authorizeRoles, protect } from '../Middleware/authen.js';

const technicianRoute = express.Router();


// create technicians
technicianRoute.post('/invite', inviteTechnician);

// Admin: Get all technicians
technicianRoute.get('/', protect, authorizeRoles('admin'), getAllTechnicians);

// Admin: Get technician by ID
technicianRoute.get('/:id', protect, authorizeRoles('admin'), getTechnicianById);

// Admin: Update technician by ID
technicianRoute.put('/:id', protect, authorizeRoles('admin'), updateTechnician);

// Admin: Delete technician by ID
technicianRoute.delete('/:id', protect, authorizeRoles('admin'), deleteTechnician);

// Technician: Accept invitation and set password (public or token-protected)
technicianRoute.post('/accept-invitation/:token', acceptTechnicianInvitation);

// Technician: View own profile
technicianRoute.get('/profile/me', authenticateTechnician, getTechnicianProfile);

// Technician: Update own profile
technicianRoute.put('/profile/me', authenticateTechnician, updateTechnician);


export default technicianRoute;
