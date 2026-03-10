const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  age: {
    type: Number,
    required: true
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    required: true
  },
  contact: {
    type: String,
    required: true
  },
  email: {
    type: String
  },
  address: {
    type: String,
    required: true
  },
  emergencyContact: {
    name: String,
    phone: String,
    relation: String
  },
  medicalHistory: {
    bloodGroup: String,
    allergies: [String],
    chronicDiseases: [String],
    previousSurgeries: [String],
    currentMedications: [String]
  },
  currentIssue: {
    type: String,
    required: true
  },
  ongoingTreatments: [String],
  admissionDate: Date,
  dischargeDate: Date,
  assignedDoctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor'
  },
  assignedRoom: String,
  assignedBed: String,
  status: {
    type: String,
    enum: ['outpatient', 'admitted', 'discharged', 'emergency'],
    default: 'outpatient'
  },
  reports: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Report'
  }],
  appointments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Patient', patientSchema);
