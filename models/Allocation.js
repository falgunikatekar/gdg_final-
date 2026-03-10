const mongoose = require('mongoose');

const allocationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['bed', 'room', 'equipment', 'doctor'],
    required: true
  },
  resourceId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  resourceName: {
    type: String,
    required: true
  },
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  patientName: {
    type: String,
    required: true
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor'
  },
  doctorName: {
    type: String
  },
  allocationDate: {
    type: Date,
    default: Date.now
  },
  expectedDischargeDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['allocated', 'in_use', 'released', 'maintenance'],
    default: 'allocated'
  },
  notes: {
    type: String
  },
  hospital: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for efficient querying
allocationSchema.index({ hospital: 1, type: 1, status: 1 });
allocationSchema.index({ patient: 1 });
allocationSchema.index({ doctor: 1 });
allocationSchema.index({ allocationDate: 1 });

module.exports = mongoose.model('Allocation', allocationSchema);
