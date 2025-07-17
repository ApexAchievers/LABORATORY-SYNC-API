import { Technician } from '../Models/Technician_Mod.js';
import crypto from 'crypto';
import { sendTechnicianInvitationEmail } from '../Configs/Email_service.js';

// CREATE / INVITE Technician
export const inviteTechnician = async (req, res) => {
  try {
    const { email, name } = req.body;

    let technician = await Technician.findOne({ email });

    if (technician && technician.isActivated) {
      return res.status(400).json({ message: 'Technician already invited and activated.' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expires = Date.now() + 24 * 60 * 60 * 1000;

    if (!technician) {
      technician = new Technician({ email, name });
    }

    technician.invitationToken = token;
    technician.invitationExpires = new Date(expires);
    technician.isActivated = false;

    await technician.save();

    const link = `${process.env.CLIENT_URL}/technician/setup/${token}`;
    await sendTechnicianInvitationEmail(email, link);

    return res.status(200).json({ message: 'Invitation sent successfully.' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to invite technician.', error });
  }
};

// Accept invitation & complete registration
export const acceptTechnicianInvitation = async (req, res) => {
  try {
    const { token, password, name } = req.body;

    const technician = await Technician.findOne({
      invitationToken: token,
      invitationExpires: { $gt: Date.now() }
    });

    if (!technician) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    technician.password = password;
    technician.name = name || technician.name;
    technician.invitationToken = undefined;
    technician.invitationExpires = undefined;
    technician.isActivated = true;

    await technician.save();

    return res.status(200).json({ message: 'Technician registration completed.' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to accept invitation', error });
  }
};


// GET all technicians
export const getAllTechnicians = async (req, res) => {
  try {
    const technicians = await Technician.find().select('-password -invitationToken');
    res.status(200).json(technicians);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch technicians', error: err });
  }
};

// GET single technician
export const getTechnicianById = async (req, res) => {
  try {
    const technician = await Technician.findById(req.params.id).select('-password -invitationToken');
    if (!technician) {
      return res.status(404).json({ message: 'Technician not found' });
    }
    res.status(200).json(technician);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching technician', error: err });
  }
};

// UPDATE technician info
export const updateTechnician = async (req, res) => {
  try {
    const { name, email } = req.body;
    const technician = await Technician.findByIdAndUpdate(
      req.params.id,
      { name, email },
      { new: true, runValidators: true }
    ).select('-password');
    if (!technician) {
      return res.status(404).json({ message: 'Technician not found' });
    }
    res.status(200).json({ message: 'Technician updated', technician });
  } catch (err) {
    res.status(500).json({ message: 'Update failed', error: err });
  }
};

// Get logged-in technician's profile
export const getTechnicianProfile = async (req, res) => {
  try {
    const technician = await Technician.findById(req.user.id).select('-password');
    if (!technician) {
      return res.status(404).json({ message: 'Technician not found' });
    }

    res.status(200).json({ user: technician });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};


// DELETE technician
export const deleteTechnician = async (req, res) => {
  try {
    const technician = await Technician.findByIdAndDelete(req.params.id);
    if (!technician) {
      return res.status(404).json({ message: 'Technician not found' });
    }
    res.status(200).json({ message: 'Technician deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Delete failed', error: err });
  }
};
