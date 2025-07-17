import mongoose from 'mongoose';

const technicianSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String },
    role: { type: String, default: 'technician' },
    isVerified: { type: Boolean, default: false },
    invitationToken: { type: String },
    invitationTokenExpires: { type: Date },

    specialties: [
      {
        type: String,
        enum: ['Blood Test', 'Urine Test', 'X-Ray', 'MRI', 'COVID-19', 'Other'],
      },
    ],
    isAvailable: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export const Technician = mongoose.model('Technician', technicianSchema);
