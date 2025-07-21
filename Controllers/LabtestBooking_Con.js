import { LabTestBooking } from '../Models/Labtestbooking_Mod.js';
import { Technician } from '../Models/Technician_Mod.js';
import {
  sendLabBookingConfirmationEmail,
  sendTechnicianAssignmentEmail,
  notifyResultByEmail
} from '../Configs/Email_service.js'

// @desc    Create a lab test booking
// @route   POST /api/bookings
// @access  Private
export const createLabBooking = async (req, res) => {
  try {
    const { patientDetails, testType, scheduledDate, scheduledTime } = req.body;

    if (!patientDetails || !testType || !scheduledDate || !patientDetails.email) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const booking = new LabTestBooking({
      bookedBy: req.user._id,
      patientDetails,
      testType,
      scheduledDate,
      scheduledTime,
    });

    // Find technicians NOT assigned to an active job (only one at a time)
    const assignedTechnicianIds = await LabTestBooking.distinct('technician', {
      status: { $in: ['assigned', 'in progress'] },
    });

    const availableTechnician = await Technician.findOne({
      role: 'technician',
      isVerified: true,
      _id: { $nin: assignedTechnicianIds },
    });

    if (availableTechnician) {
      booking.technician = availableTechnician._id;
      booking.status = 'assigned';
    }

    await booking.save();

    await sendLabBookingConfirmationEmail({
      name: patientDetails.fullName,
      email: patientDetails.email,
      testName: testType,
      date: scheduledDate,
    });

    if (availableTechnician) {
      await sendTechnicianAssignmentEmail({
        name: availableTechnician.fullName,
        email: availableTechnician.email,
        testName: testType,
        patientName: patientDetails.fullName,
        date: scheduledDate,
      });
    }

    res.status(201).json({
      message: 'Your booking was received successfully.',
      technicianAssigned: !!availableTechnician,
      booking,
    });

  } catch (err) {
    console.error('Error in createLabBooking:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const assignTechnicianToBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { technicianId } = req.body;

    if (!technicianId) {
      return res.status(400).json({ message: 'Technician ID is required' });
    }

    // Find booking
    const booking = await LabTestBooking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if the technician exists and is available
    const technician = await Technician.findOne({
      _id: technicianId,
      isAvailable: true,
    });

    if (!technician) {
      return res.status(400).json({ message: 'Technician not found or unavailable' });
    }

    // Assign the technician
    booking.technician = technicianId;
    booking.status = 'assigned';
    await booking.save();

    // Send technician assignment email
    await sendTechnicianAssignmentEmail({
      name: technician.fullName,
      email: technician.email,
      testName: booking.testType,
      patientName: booking.patientDetails.fullName,
      date: booking.scheduledDate,
    });

    res.status(200).json({ message: 'Technician assigned successfully', booking });

  } catch (err) {
    console.error('Error in assignTechnicianToBooking:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get logged-in user's bookings
// @route   GET /api/bookings
// @access  Private
export const getMyBookings = async (req, res) => {
  try {
    const bookings = await LabTestBooking.find({ bookedBy: req.user._id }).sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get booking by ID
// @route   GET /api/bookings/:id
// @access  Private
export const getBookingById = async (req, res) => {
  try {
    const booking = await LabTestBooking.findById(req.params.id).populate('technician');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (!booking.bookedBy.equals(req.user._id)) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    res.json(booking);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Cancel booking
// @route   DELETE /api/bookings/:id
// @access  Private
export const cancelBooking = async (req, res) => {
  try {
    const booking = await LabTestBooking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (!booking.bookedBy.equals(req.user._id)) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    booking.status = 'cancelled';
    await booking.save();

    res.json({ message: 'Booking cancelled' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Technician gets assigned bookings
// @route   GET /api/technician/bookings
// @access  Private (Technician)
export const getAssignedBookings = async (req, res) => {
  try {
    const bookings = await LabTestBooking.find({ technician: req.user._id }).sort({ scheduledDate: -1 });
    res.json(bookings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update test result and complete booking
// @route   PUT /api/technician/bookings/:id/result
// @access  Private (Technician)
export const updateTestResult = async (req, res) => {
  try {
    const { result } = req.body;
    const booking = await LabTestBooking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (!booking.technician || !booking.technician.equals(req.user._id)) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    booking.result = result;
    booking.status = 'completed';
    booking.completedAt = new Date();

    await booking.save();

    await notifyResultByEmail({
      name: booking.patientDetails.fullName,
      email: booking.patientDetails.email,
      result: booking.result,
      testName: booking.testType,
    });

    res.json({ message: 'Result submitted successfully', booking });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all bookings (Admin only)
// @route   GET /api/bookings/admin/all
// @access  Private/Admin
export const getAllBookings = async (req, res) => {
  try {
    const bookings = await LabTestBooking.find()
      .populate('bookedBy', 'fullName email')
      .populate('technician', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json(bookings);
  } catch (error) {
    console.error('Error fetching all bookings:', error);
    res.status(500).json({ message: 'Server Error: Unable to fetch bookings' });
  }
};

export const updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const { LabTestBooking } = await import('../Models/Labtestbooking_Mod.js');
    const booking = await LabTestBooking.findById(req.params.id);

    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    booking.status = status;
    await booking.save();

    res.json({ message: `Booking marked as ${status}`, booking });
  } catch (err) {
    console.error('Error updating booking status:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

