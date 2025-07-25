import express from "express";
import { startLabTask, getAllAppointmentsAndTasks } from "../Controllers/Labtask_Con.js";

import { authenticateTechnician, authorizeRoles, protect } from "../Middleware/authen.js";

const labtaskroute = express.Router();

// Start a task (technician updates appointment status to "in-progress")
labtaskroute.put('/appointment/start/:id', authenticateTechnician, startLabTask);
labtaskroute.get('/appointments-tasks', protect, authorizeRoles('admin'), getAllAppointmentsAndTasks)


export default labtaskroute;