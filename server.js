import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import userRoute from './Routes/User_route.js';
import technicianRoute from './Routes/Technician_route.js';
import router from './Routes/LabtestBooking_route.js';
import { seedAdmin } from './Middleware/Admin_seeder.js'; 
import labtaskroute from './Routes/Labtask_route.js';

// Load env vars
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5050;

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.send('Welcome to LabSync API');
});
app.use('/api/auth', userRoute);
app.use('/api/labtest', router);
app.use('/api/technician', technicianRoute);
app.use('/api/Labtask', labtaskroute)

// MongoDB Connection and Server Startup
mongoose.connect(process.env.MONGO_URI, {})
  .then(async () => {
    console.log(' MongoDB connected');
    
    //  Seed admin after successful DB connection
    await seedAdmin();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error(' MongoDB connection error:', err);
  });
