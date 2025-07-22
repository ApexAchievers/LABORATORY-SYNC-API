import mongoose from 'mongoose';

const technicianSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true
    },
    password: {
      type: String
    },
    invitationToken: {
      type: String
    },
    invitationTokenExpires: {
      type: Date
    },
    isActivated: {
      type: Boolean,
      default: false
    },
    isAvailable: {
      type: Boolean,
      default: true
    },
    role: {
      type: String,
      enum: ['technician'],
      default: 'technician'
    },
    specialties: {
      enum: ['Full Blood Count', 'Blood Sugar', 'Blood Film for Malaria Parasites', 'Sickle Cell', 'COVID-19', 'HB Electrophoresis (Genotype)', 'Erythrocyte Sedimentation Rate (ESR)', 
        'Blood Grouping', 'Typhidot', 'H. Pylori', 'VDRL for Syphillis', 'Hepatitis B', 'Hepatitis C', 'Retro Screen for HIV', 'Urine R/E', 'Stool R/E', 'Liver Function Test (LFT)',
        'Kidney Function Test (KFT)', 'BUE & Cr', 'PCR for Tuberculosis (Gene Xpert)', 'Hormonal/Fertility Tests'
      ],
      default: []
    }
  },
  { timestamps: true }
);

export const Technician = mongoose.model('Technician', technicianSchema);
