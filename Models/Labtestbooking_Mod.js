import mongoose from 'mongoose';

const labTestBookingSchema = new mongoose.Schema(
  {
    bookedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true, // the user who made the booking
    },
    patientDetails: {
      fullName: {
        type: String,
        required: true,
      },
      dateOfBirth: String,
      gender: {
        type: String,
        enum: ['male', 'female', 'other'],
      },
      contact: String,
      email: {
        type: String,
        required: true,
      },
    },
    testType: {
      type: String,
      required: true,
      enum: ['Full Blood Count', 'Blood Sugar', 'Blood Film for Malaria Parasites', 'Sickle Cell', 'COVID-19', 'HB Electrophoresis (Genotype)', 'Erythrocyte Sedimentation Rate (ESR)', 
        'Blood Grouping', 'Typhidot', 'H. Pylori', 'VDRL for Syphillis', 'Hepatitis B', 'Hepatitis C', 'Retro Screen for HIV', 'Urine R/E', 'Stool R/E', 'Liver Function Test (LFT)',
        'Kidney Function Test (KFT)', 'BUE & Cr', 'PCR for Tuberculosis (Gene Xpert)', 'Hormonal/Fertility Tests'
      ],
    },
    
    scheduledDate: {
      type: Date,
      required: true,
    },
    scheduledTime: {
      type: String, // e.g., '10:30', '15:00'
      required: true,
    },
    priority: {
      type: String,
      enum: ['high', 'low', 'normal'],
      default: 'normal',
    },
    technician: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Technician',
    },
    status: {
      type: String,
      enum: ['pending', 'assigned', 'in-progress', 'completed', 'cancelled'],
      default: 'pending',
    },
    result: String,
    notes: String,
  },
  { timestamps: true }
);

export const LabTestBooking = mongoose.model('LabTestBooking', labTestBookingSchema);
