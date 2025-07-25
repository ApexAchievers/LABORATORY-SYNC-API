
import mongoose from 'mongoose';
import {LabTestBooking} from '../Models/Labtestbooking_Mod.js';
import { sendAppointmentConfirmationEmail } from '../Configs/Email_service.js';

//Patient books an appointment
export const bookAppointment = async (req, res) => {
  try {
    const userId = req.user._id; // assuming you're using middleware to get the user
    const {
      patientDetails,
      testType,
      scheduledDate,
      scheduledTime,
      priority
    } = req.body;

    // Calculate estimated duration
    const baseDuration = 15;
    const extraTests = testType.length > 1 ? (testType.length - 1) * 5 : 0;
    const totalDuration = baseDuration + extraTests;

    const scheduledStart = new Date(`${scheduledDate}T${scheduledTime}:00`);
    const scheduledEnd = new Date(scheduledStart.getTime() + totalDuration * 60000);

    // Check for overlap by other users
    const conflict = await LabTestBooking.findOne({
      scheduledDate: new Date(scheduledDate),
      bookedBy: { $ne: userId },
      scheduledTime: { $exists: true },
    });

    if (conflict) {
      return res.status(409).json({
        message: 'Selected time is already booked by another patient. Choose a different time.',
      });
    }

    // ✅ 3. Save booking
    const newBooking = new LabTestBooking({
      bookedBy: userId,
      patientDetails,
      testType,
      scheduledDate,
      scheduledTime,
      priority,
    });

    await newBooking.save();
    await sendAppointmentConfirmationEmail({
    name: newBooking.patientDetails.fullName,
    email: newBooking.patientDetails.email,
    testName: newBooking.testType.join(', '),
    appointmentDate: `${newBooking.scheduledDate} at ${newBooking.scheduledTime}`,
});


    res.status(201).json({
      message: 'Appointment booked successfully.',
      appointment: newBooking,
      estimatedDuration: `${totalDuration} minutes`
    });

  } catch (error) {
    console.error('Error booking appointment:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Patient Get all appointment booked
export const getMyAppointments = async (req, res) => {
  try {
    const appointments = await LabTestBooking.find({ bookedBy: req.user._id })
      .sort({ scheduledDate: 1, scheduledTime: 1 });

    res.status(200).json(appointments);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch appointments", error });
  }
};

// GET /api/appointments/:id
export const getSingleAppointment = async (req, res) => {
  try {
    const appointment = await LabTestBooking.findOne({
      _id: req.params.id,
      bookedBy: req.user._id,
    });

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    res.status(200).json(appointment);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch appointment", error });
  }
};

//Patient cancels appointment
export const cancelAppointmentByPatient = async (req, res) => {
  try {
    const appointmentId = req.params.id;
    const userId = req.user._id;

    const appointment = await LabTestBooking.findById(appointmentId);

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    // Ensure only the user who booked it can cancel
    if (appointment.bookedBy.toString() !== userId.toString()) {
      return res.status(403).json({ message: "You are not authorized to cancel this appointment" });
    }

    // Optional: check if appointment is already completed or canceled
    if (appointment.status === 'cancelled' || appointment.status === 'completed') {
      return res.status(400).json({ message: `Appointment already ${appointment.status}` });
    }

    // Mark appointment as cancelled
    appointment.status = 'cancelled';
    await appointment.save();

    res.status(200).json({ message: "Appointment cancelled successfully", appointment });
  } catch (error) {
    res.status(500).json({ message: "Failed to cancel appointment", error });
  }
};

//Patient update booked appointment
export const updateAppointmentByPatient = async (req, res) => {
  try {
    const { id } = req.params;
    const { scheduledDate, scheduledTime, testType, priority, notes } = req.body;

    const appointment = await LabTestBooking.findById(id);

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Optional: Check if the user owns this appointment
    if (appointment.bookedBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized to update this appointment' });
    }

    // Check if the new slot is already taken (if date/time is changing)
    if (
      (scheduledDate && scheduledTime) &&
      (appointment.scheduledDate !== scheduledDate || appointment.scheduledTime !== scheduledTime)
    ) {
      const existing = await LabTestBooking.findOne({ scheduledDate, scheduledTime });
      if (existing) {
        return res.status(400).json({ message: 'Selected time slot is already booked' });
      }
    }

    // Update only what is provided
    if (scheduledDate) appointment.scheduledDate = scheduledDate;
    if (scheduledTime) appointment.scheduledTime = scheduledTime;
    if (testType) appointment.testType = testType;
    if (priority) appointment.priority = priority;
    if (notes !== undefined) appointment.notes = notes;

    const updated = await appointment.save();

    res.status(200).json(updated);
  } catch (error) {
    console.error('Error updating appointment:', error);
    res.status(500).json({ message: 'Failed to update appointment' });
  }
};


//Technician to view all booked appointment
export const getAllAppointmentsForTechnician = async (req, res) => {
  try {
    // Check if user is a technician
    if (req.user.role !== 'technician') {
      return res.status(403).json({ message: 'Access denied. Not a technician.' });
    }

    const appointments = await LabTestBooking.find()
      .populate('bookedBy', 'fullName email') // Optional: populate patient info
      .sort({ scheduledDate: 1, scheduledTime: 1 });

    res.status(200).json(appointments);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch all appointments", error });
  }
};

