import { LabTestBooking } from '../Models/Labtestbooking_Mod.js';
import { LabTask } from '../Models/labtask_Mod.js';
import { Technician } from '../Models/Technician_Mod.js';

//Technician start task
export const startLabTask = async (req, res) => {
  try {
    const appointmentId = req.params.id;
    const technicianId = req.user._id; // assuming technician is authenticated


    const { testDetails, taskInfo } = req.body;

    // Step 1: Check if appointment exists
    const appointment = await LabTestBooking.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Step 2: Check appointment status
    if (['in-progress', 'completed'].includes(appointment.status)) {
      return res.status(400).json({ message: 'Appointment already started or completed' });
    }

    // Optional: Check if technician exists
    const technician = await Technician.findById(technicianId);
    if (!technician) {
      return res.status(403).json({ message: 'Unauthorized technician' });
    }

    // Step 3: Create Lab Task
    const newTask = await LabTask.create({
      appointmentId,
      taskInfo: {
        ...taskInfo,
        requestedBy: technician.fullName || 'Technician', // optional
      },
      testDetails,
    });

    // Step 4: Update appointment status
    appointment.status = 'in-progress';
    appointment.startedBy = technicianId; // optional if your schema allows
    await appointment.save();

    res.status(201).json({
      message: 'Lab appointment started successfully',
      task: newTask,
      appointment,
    });
  } catch (err) {
    console.error('Start Appointment Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Admin get all appointments and tasks
export const getAllAppointmentsAndTasks = async (req, res) => {
  try {
    const { status, startDate, endDate } = req.query;

    const appointmentQuery = {};
    if (status) appointmentQuery.status = status;

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (!isNaN(start) && !isNaN(end)) {
        appointmentQuery.createdAt = {
          $gte: start,
          $lte: end,
        };
      } else {
        return res.status(400).json({ message: 'Invalid date format' });
      }
    }

    const [appointments, labTasks] = await Promise.all([
      LabTestBooking.find(appointmentQuery)
        .populate('bookedBy') //  Corrected this line
        .sort({ createdAt: -1 }),

      LabTask.find()
        .populate({
          path: 'appointmentId',
          populate: { path: 'bookedBy' }, // Nested populate
        })
        .sort({ createdAt: -1 }),
    ]);

    res.status(200).json({
      message: 'Fetched all appointments and lab tasks',
      appointments,
      labTasks,
    });
  } catch (err) {
    console.error('Error fetching appointments and lab tasks:', err);
    res.status(500).json({ message: 'Server error fetching appointments and tasks' });
  }
};

//Complete booking by technician
export const updateBookingStatus = async (req, res) => {
  const { id } = req.params; // Booking/task ID from URL
  const { status } = req.body; // Status from request body

  if (!status) {
    return res.status(400).json({ message: "Status is required." });
  }

  try {
    // Find the lab task by ID
    const task = await LabTask.findById(id);

    if (!task) {
      return res.status(404).json({ message: "Booking not found." });
    }

    // Update the status
    task.status = status;

    // Save the changes
    await task.save();

    res.status(200).json({ message: "Booking status updated.", task });
  } catch (error) {
    console.error("Update booking status error:", error);
    res.status(500).json({ message: "Server error." });
  }
};