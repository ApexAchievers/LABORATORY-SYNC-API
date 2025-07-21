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
      enum: ['Blood Test', 'Urine Test', 'X-Ray', 'MRI', 'COVID-19', 'Other'],
      default: []
    }
  },
  { timestamps: true }
);

export const Technician = mongoose.model('Technician', technicianSchema);
