const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  manufacturer: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  description: String,
  unitPrice: {
    type: Number,
    required: true
  },
  stock: {
    type: Number,
    required: true,
    min: 0
  },
  minStockLevel: {
    type: Number,
    default: 10
  },
  batchNumber: {
    type: String,
    required: true
  },
  manufactureDate: {
    type: Date,
    required: true
  },
  expiryDate: {
    type: Date,
    required: true
  },
  storageConditions: {
    temperature: String,
    humidity: String,
    specialInstructions: String
  },
  supplier: {
    name: String,
    contact: String,
    email: String
  },
  hospital: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    required: true
  },
  status: {
    type: String,
    enum: ['available', 'low_stock', 'expired', 'out_of_stock'],
    default: 'available'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for expiry date tracking
medicineSchema.index({ expiryDate: 1 });
medicineSchema.index({ hospital: 1, status: 1 });

module.exports = mongoose.model('Medicine', medicineSchema);
