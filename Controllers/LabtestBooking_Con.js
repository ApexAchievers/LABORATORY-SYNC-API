import { LabTestBooking } from '../Models/Labtestbooking_Mod.js';
import { Technician } from '../Models/Technician_Mod.js';
import { User } from '../Models/User_Mod.js';

// Utility: get all booked slots for a day
const getTakenTimes = async (date) => {
  const bookedSlots = await LabTestBooking.find({ scheduledDate: new Date(date) }).select('scheduledTime');
  return bookedSlots.map(slot => slot.scheduledTime);
};

// Utility: generate 15-minute interval slots between 8AM–5PM
const generateAvailableSlots = (takenTimes) => {
  const slots = [];
  let startTime = 8 * 60;
  let endTime = 17 * 60;

  for (let time = startTime; time < endTime; time += 15) {
    const hours = String(Math.floor(time / 60)).padStart(2, '0');
    const minutes = String(time % 60).padStart(2, '0');
    const slot = `${hours}:${minutes}`;
    if (!takenTimes.includes(slot)) {
      slots.push(slot);
    }
  }

  return slots;
};

// Valid test types
const validTestTypes = [
  'Full Blood Count', 'Blood Sugar', 'Blood Film for Malaria Parasites', 'Sickle Cell', 'COVID-19',
  'HB Electrophoresis (Genotype)', 'Erythrocyte Sedimentation Rate (ESR)', 'Blood Grouping',
  'Typhidot', 'H. Pylori', 'VDRL for Syphillis', 'Hepatitis B', 'Hepatitis C',
  'Retro Screen for HIV', 'Urine R/E', 'Stool R/E', 'Liver Function Test (LFT)',
  'Kidney Function Test (KFT)', 'BUE & Cr', 'PCR for Tuberculosis (Gene Xpert)', 'Hormonal/Fertility Tests'
];

// ✅ Book & Schedule Lab Test
export const bookLabTest = async (req, res) => {
  try {
    const {
      patientDetails,
      testType, // now an array
      priority,
      notes,
      scheduledDate,
      scheduledTime
    } = req.body;

    const bookedBy = req.user?.id;
    if (!bookedBy) {
      return res.status(401).json({ message: 'Unauthorized user' });
    }

    // ✅ Ensure testType is an array with valid entries
    if (!Array.isArray(testType) || testType.length === 0) {
      return res.status(400).json({ message: 'Please select at least one test type.' });
    }

    const invalidTests = testType.filter(test => !validTestTypes.includes(test));
    if (invalidTests.length > 0) {
      return res.status(400).json({ message: `Invalid test types: ${invalidTests.join(', ')}` });
    }

    // ✅ Check if this 15-minute slot is already booked
    const existing = await LabTestBooking.findOne({
      scheduledDate,
      scheduledTime,
    });

    if (existing) {
      return res.status(400).json({ message: 'Time slot already booked. Please select another.' });
    }

    // ✅ Save new booking
    const newBooking = new LabTestBooking({
      bookedBy,
      patientDetails,
      testType,
      priority,
      notes,
      scheduledDate,
      scheduledTime,
    });

    const savedBooking = await newBooking.save();
    res.status(201).json({
      message: 'Booking successful',
      booking: {
        id: savedBooking._id,
        patientDetails: savedBooking.patientDetails,
        testType: savedBooking.testType,
        priority: savedBooking.priority,
        scheduledDate: savedBooking.scheduledDate,
        scheduledTime: savedBooking.scheduledTime
      }
    });
  } catch (error) {
    console.error('Booking error:', error);
    res.status(500).json({ message: 'Failed to book lab test.' });
  }
};

// ✅ Get Lab Test Booking by ID
export const getLabTestBookingById = async (req, res) => {
  try {
    const booking = await LabTestBooking.findById(req.params.id)
      .populate('bookedBy', 'name email')
      .populate('technician', 'name email');

    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    res.status(200).json(booking);
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({ message: 'Failed to retrieve booking.' });
  }
};

// ✅ Start Lab Test
export const startLabTest = async (req, res) => {
  try {
    const { id } = req.params;
    const technicianId = req.user.id;

    const booking = await LabTestBooking.findById(id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    if (booking.status !== 'pending') {
      return res.status(400).json({ message: 'Test already started or completed' });
    }

    booking.status = 'in-progress';
    booking.technician = technicianId;
    await booking.save();

    res.status(200).json({ message: 'Test started', booking });
  } catch (error) {
    console.error('Start test error:', error);
    res.status(500).json({ message: 'Failed to start test.' });
  }
};

// ✅ Complete Lab Test
export const completeLabTest = async (req, res) => {
  try {
    const { id } = req.params;
    const { result, notes } = req.body;

    const booking = await LabTestBooking.findById(id);
    if (!booking || booking.status !== 'in-progress') {
      return res.status(400).json({ message: 'Test not in progress or not found' });
    }

    booking.status = 'completed';
    booking.result = result;
    booking.notes = notes;
    await booking.save();

    res.status(200).json({ message: 'Test completed', booking });
  } catch (error) {
    console.error('Complete test error:', error);
    res.status(500).json({ message: 'Failed to complete test.' });
  }
};

// ✅ Get All Bookings (sorted)
export const getAllLabTests = async (req, res) => {
  try {
    const bookings = await LabTestBooking.find()
      .sort({ scheduledDate: 1, scheduledTime: 1 });
    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve lab test bookings.' });
  }
};

// ✅ Get Lab Tests for Logged-in User
export const getUserLabTests = async (req, res) => {
  try {
    const userId = req.user._id;

    const bookings = await LabTestBooking.find({ bookedBy: userId }).lean();

    const formatted = bookings.map(b => ({
      patientDetails: b.patientDetails,
      testType: b.testType,
      scheduledDate: b.scheduledDate,
      scheduledTime: b.scheduledTime,
      priority: b.priority,
      status: b.status,
      notes: b.notes
    }));

    res.status(200).json(formatted);
  } catch (error) {
    console.error('Error fetching user lab tests:', error);
    res.status(500).json({ message: 'Failed to fetch lab tests.' });
  }
};


// ✅ Get Lab Tests for a Technician
export const getTechnicianLabTests = async (req, res) => {
  try {
    const { technicianId } = req.params;
    const bookings = await LabTestBooking.find({ technician: technicianId });
    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve technician tasks.' });
  }
};

// ✅ Get Lab Tests for a Given Date
export const getLabTestsByDate = async (req, res) => {
  try {
    const dateOnly = new Date(req.params.date);
    const bookings = await LabTestBooking.find({ scheduledDate: dateOnly }).sort({ scheduledTime: 1 });
    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve bookings by date.' });
  }
};

// ✅ Get Available Time Slots for a Day
export const getAvailableSlots = async (req, res) => {
  try {
    const { date } = req.params;
    const takenTimes = await getTakenTimes(date);
    const slots = generateAvailableSlots(takenTimes);

    res.status(200).json({ date, availableSlots: slots });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch available slots.' });
  }
};

// ✅ Get Today's Lab Tests for a Shift
export const getTodayTestsForTechnician = async (req, res) => {
  try {
    const { startHour, endHour } = req.query;
    const today = new Date().toISOString().split('T')[0];
    const dateOnly = new Date(today);

    const tests = await LabTestBooking.find({
      scheduledDate: dateOnly,
      scheduledTime: { $gte: startHour, $lt: endHour },
      status: 'pending',
    }).sort({ scheduledTime: 1 });

    res.status(200).json(tests);
  } catch (error) {
    console.error('Shift fetch error:', error);
    res.status(500).json({ message: 'Failed to fetch shift tasks.' });
  }
};
