import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { Technician } from '../Models/Technician_Mod.js';
import { sendTechnicianInvitationEmail } from '../Configs/Email_service.js';

// CREATE / INVITE Technician
export const inviteTechnician = async (req, res) => {
  try {
    const { email, fullName, specialties } = req.body;

    let technician = await Technician.findOne({ email });

    if (technician && technician.isActivated) {
      return res.status(400).json({ message: 'Technician already invited and activated.' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expires = Date.now() + 24 * 60 * 60 * 1000;

    if (!technician) {
      technician = new Technician({ email, fullName, specialties });
    } else {
      technician.fullName = fullName || technician.fullName;
      if (Array.isArray(specialties)) {
        technician.specialties = specialties;
      }
    }

    technician.invitationToken = token;
    technician.invitationTokenExpires = new Date(expires);
    technician.isActivated = false;

    await technician.save();

    const link = `${process.env.CLIENT_URL}/technician/setup/${token}`;
    await sendTechnicianInvitationEmail(email, link);

    return res.status(200).json({ message: 'Invitation sent successfully.' });
  } catch (error) {
    console.error('Error inviting technician:', error);
    return res.status(500).json({ message: 'Failed to invite technician.', error });
  }
};

// Accept invitation & complete registration
export const acceptTechnicianInvitation = async (req, res) => {
  try {
    const { token, password, fullName, specialties } = req.body;

    const technician = await Technician.findOne({
      invitationToken: token,
      invitationTokenExpires: { $gt: Date.now() }
    });

    if (!technician) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    technician.password = hashedPassword;
    technician.fullName = fullName || technician.fullName;
    if (Array.isArray(specialties)) {
      technician.specialties = specialties;
    }

    technician.invitationToken = undefined;
    technician.invitationTokenExpires = undefined;
    technician.isActivated = true;

    await technician.save();

    return res.status(200).json({ message: 'Technician registration completed.' });
  } catch (error) {
    console.error('Error accepting invitation:', error);
    return res.status(500).json({ message: 'Failed to accept invitation', error });
  }
};

// DELETE a Technician by ID
export const deleteTechnician = async (req, res) => {
  try {
    const { id } = req.params;

    const technician = await Technician.findById(id);
    if (!technician) {
      return res.status(404).json({ message: 'Technician not found.' });
    }

    await technician.deleteOne();

    return res.status(200).json({ message: 'Technician deleted successfully.' });
  } catch (error) {
    console.error('Error deleting technician:', error);
    return res.status(500).json({ message: 'Failed to delete technician.', error });
  }
};

// GET all Technicians
export const getAllTechnicians = async (req, res) => {
  try {
    const technicians = await Technician.find().select('-password').sort({ createdAt: -1 });
    res.status(200).json(technicians);
  } catch (error) {
    console.error('Error fetching technicians:', error);
    res.status(500).json({ message: 'Failed to fetch technicians.', error });
  }
};

// GET Technician by ID
export const getTechnicianById = async (req, res) => {
  try {
    const technician = await Technician.findById(req.params.id).select('-password');
    if (!technician) {
      return res.status(404).json({ message: 'Technician not found' });
    }
    res.status(200).json(technician);
  } catch (error) {
    console.error('Error fetching technician by ID:', error);
    res.status(500).json({ message: 'Failed to fetch technician', error });
  }
};

// GET Technician Profile (for logged-in technician)
export const getTechnicianProfile = async (req, res) => {
  try {
    const technician = await Technician.findById(req.user.id).select('-password');
    if (!technician) {
      return res.status(404).json({ message: 'Technician not found' });
    }
    res.status(200).json(technician);
  } catch (error) {
    console.error('Error fetching technician profile:', error);
    res.status(500).json({ message: 'Failed to fetch profile', error });
  }
};

// UPDATE Technician
export const updateTechnician = async (req, res) => {
  try {
    const { fullName, email, role, isActivated, specialties } = req.body;

    const technician = await Technician.findById(req.params.id);
    if (!technician) {
      return res.status(404).json({ message: 'Technician not found' });
    }

    technician.fullName = fullName || technician.fullName;
    technician.email = email || technician.email;
    if (role) technician.role = role;
    if (typeof isActivated === 'boolean') technician.isActivated = isActivated;
    if (Array.isArray(specialties)) technician.specialties = specialties;

    const updatedTech = await technician.save();

    res.status(200).json({
      message: 'Technician updated successfully',
      technician: {
        _id: updatedTech._id,
        fullName: updatedTech.fullName,
        email: updatedTech.email,
        role: updatedTech.role,
        isActivated: updatedTech.isActivated,
        specialties: updatedTech.specialties,
      },
    });
  } catch (error) {
    console.error('Update technician error:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};
