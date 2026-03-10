const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true
  },
  hospital: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    required: true
  },
  type: {
    type: String,
    enum: ['blood_test', 'x_ray', 'mri', 'ct_scan', 'ultrasound', 'ecg', 'general_checkup', 'pathology'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: String,
  testDate: {
    type: Date,
    required: true
  },
  images: [{
    filename: String,
    originalName: String,
    path: String,
    size: Number,
    mimetype: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  results: {
    normal: Boolean,
    summary: String,
    details: String,
    recommendations: String,
    followUpRequired: {
      type: Boolean,
      default: false
    },
    followUpDate: Date
  },
  parameters: [{
    name: String,
    value: String,
    unit: String,
    normalRange: String,
    status: {
      type: String,
      enum: ['normal', 'high', 'low', 'critical'],
      default: 'normal'
    }
  }],
  pdfReport: {
    filename: String,
    path: String
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'reviewed'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Report', reportSchema);
