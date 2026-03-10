const mongoose = require('mongoose');

const equipmentSchema = new mongoose.Schema({
  hospitalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true
  },
  total: {
    type: Number,
    required: true,
    min: 1
  },
  available: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['working', 'maintenance', 'out_of_order'],
    default: 'working'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Equipment', equipmentSchema);
