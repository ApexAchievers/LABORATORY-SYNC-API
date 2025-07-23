import { LabTestBooking } from '../Models/Labtestbooking_Mod.js';
import { Technician } from '../Models/Technician_Mod.js';
import { User } from '../Models/User_Mod.js';

// POST /api/lab-tests/book
export const bookLabTest = async (req, res) => {
  try {
    const {
      bookedBy,
      patientDetails,
      testType,
      testDetails,
      taskInfo,
      priority,
      notes
    } = req.body;

    const newBooking = new LabTestBooking({
      bookedBy,
      patientDetails,
      testType,
      testDetails,
      taskInfo,
      priority,
      notes,
    });

    const savedBooking = await newBooking.save();
    res.status(201).json(savedBooking);
  } catch (error) {
    console.error('Booking error:', error);
    res.status(500).json({ message: 'Failed to book lab test.' });
  }
};

// PATCH /api/lab-tests/:id/schedule
export const scheduleLabTest = async (req, res) => {
  try {
    const { id } = req.params;
    const { scheduledDate, scheduledTime } = req.body;

    const existing = await LabTestBooking.findOne({
      scheduledDate,
      scheduledTime,
    });

    if (existing) {
      return res.status(400).json({ message: 'Time slot already booked.' });
    }

    const booking = await LabTestBooking.findByIdAndUpdate(
      id,
      { scheduledDate, scheduledTime },
      { new: true }
    );

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    res.status(200).json(booking);
  } catch (error) {
    console.error('Scheduling error:', error);
    res.status(500).json({ message: 'Failed to schedule appointment.' });
  }
};

// GET /api/lab-tests/:id
export const getLabTestBookingById = async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await LabTestBooking.findById(id)
      .populate('bookedBy', 'name email')
      .populate('technician', 'name email');

    if (!booking) {
      return res.status(404).json({ message: 'Lab test booking not found.' });
    }

    res.status(200).json(booking);
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({ message: 'Failed to retrieve booking.' });
  }
};

// PATCH /api/lab-tests/:id/start
export const startLabTest = async (req, res) => {
  try {
    const { id } = req.params;
    const technicianId = req.user.id; // Automatically use logged-in technician's ID

    const booking = await LabTestBooking.findById(id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.status !== 'pending') {
      return res.status(400).json({ message: 'Task already started or completed' });
    }

    booking.status = 'in-progress';
    booking.technician = technicianId;
    await booking.save();

    res.status(200).json({ message: 'Test started', booking });
  } catch (error) {
    console.error('Start test error:', error);
    res.status(500).json({ message: 'Failed to start test' });
  }
};

// PATCH /api/lab-tests/:id/complete
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
    res.status(500).json({ message: 'Failed to complete test' });
  }
};

// GET /api/lab-tests/today/shift?startHour=09:00&endHour=17:00
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
    console.error('Shift task fetch error:', error);
    res.status(500).json({ message: 'Failed to get shift tasks.' });
  }
};

// GET /api/lab-tests
export const getAllLabTests = async (req, res) => {
  try {
    const bookings = await LabTestBooking.find().sort({ scheduledDate: 1, scheduledTime: 1 });
    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve lab test bookings.' });
  }
};

// GET /api/lab-tests/user/:userId
export const getUserLabTests = async (req, res) => {
  try {
    const { userId } = req.params;
    const bookings = await LabTestBooking.find({ bookedBy: userId });
    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve user bookings.' });
  }
};

// GET /api/lab-tests/technician/:technicianId
export const getTechnicianLabTests = async (req, res) => {
  try {
    const { technicianId } = req.params;
    const bookings = await LabTestBooking.find({ technician: technicianId });
    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve technician tasks.' });
  }
};

// GET /api/lab-tests/date/:date (YYYY-MM-DD)
export const getLabTestsByDate = async (req, res) => {
  try {
    const { date } = req.params;
    const dateOnly = new Date(date);
    const bookings = await LabTestBooking.find({ scheduledDate: dateOnly }).sort({ scheduledTime: 1 });
    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve bookings by date.' });
  }
};

// GET /api/lab-tests/available-slots/:date
export const getAvailableSlots = async (req, res) => {
  try {
    const { date } = req.params;
    const bookedSlots = await LabTestBooking.find({ scheduledDate: new Date(date) }).select('scheduledTime');

    const takenTimes = bookedSlots.map(slot => slot.scheduledTime);

    const slots = [];
    let startTime = 8 * 60; // 8:00 AM in minutes
    let endTime = 17 * 60; // 5:00 PM in minutes

    for (let time = startTime; time < endTime; time += 15) {
      const hours = String(Math.floor(time / 60)).padStart(2, '0');
      const minutes = String(time % 60).padStart(2, '0');
      const slot = `${hours}:${minutes}`;
      if (!takenTimes.includes(slot)) {
        slots.push(slot);
      }
    }

    res.status(200).json({ date, availableSlots: slots });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch available slots.' });
  }
};
