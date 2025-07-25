import mongoose from 'mongoose';

const labTaskSchema = new mongoose.Schema({
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LabTestBooking', 
    required: true,
  },

  bookedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        
      },

  testDetails: {
    description: {
      type: String,
      required: true,
      default: '',
    },
    instructions: {
      type: String,
      required: true,
      default: 'handle appointment with care',
    },
    requiredEquipment: {
      type: [String],
      default: [],
    },
  },
  taskInfo: {
    requestedBy: {
      type: String,
      default: 'for test',
    },
    requestedDate: {
      type: Date,
      default: Date.now,
    },
    estimatedDuration: {
      type: String,
      required: true,
      default: '15mins per test',
    },
  },
}, {
  timestamps: true, // Optional: adds createdAt and updatedAt
});

export const LabTask = mongoose.model('LabTask', labTaskSchema);


