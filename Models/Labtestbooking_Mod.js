import mongoose from 'mongoose';

const labTestBookingSchema = new mongoose.Schema(
  {
    bookedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    patientDetails: {
      fullName: {
        type: String,
        required: true,
      },
      age: {
        type: Number, 
        required: true,
      },
      gender: {
        type: String,
        enum: ['male', 'female', 'other'],
      },
      patientId: {
        type: String, 
        required: true,
        unique: true,
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
      enum: [
        'Full Blood Count', 'Blood Sugar', 'Blood Film for Malaria Parasites', 'Sickle Cell', 'COVID-19',
        'HB Electrophoresis (Genotype)', 'Erythrocyte Sedimentation Rate (ESR)', 'Blood Grouping',
        'Typhidot', 'H. Pylori', 'VDRL for Syphillis', 'Hepatitis B', 'Hepatitis C',
        'Retro Screen for HIV', 'Urine R/E', 'Stool R/E', 'Liver Function Test (LFT)',
        'Kidney Function Test (KFT)', 'BUE & Cr', 'PCR for Tuberculosis (Gene Xpert)', 'Hormonal/Fertility Tests'
      ],
    },

    testDetails: {
      description: {
        type: String,
        required: true,
        default: 'Test to check for infection', 
      },
      instructions: {
        type: String,
        required: true,
        default: 'Handle blood samples with care',
      },
      requiredEquipment: {
        type: [String], 
        default: [],
      },
    },

    taskInfo: {
      requestedBy: {
        type: String,
        required: false,
        default: 'Laboratory Department',
      },
      requestedDate: {
        type: Date,
        required: false,
      },
      estimatedDuration: {
        type: String,
        required: true,
        default: '15 minutes',
      },
    },

    scheduledDate: {
      type: Date,
      required: false,
    },
    scheduledTime: {
      type: String,
      required: false,
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
