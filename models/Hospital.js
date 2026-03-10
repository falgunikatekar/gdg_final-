const mongoose = require('mongoose');

const hospitalSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  totalBeds: {
    type: Number,
    default: 100
  },
  availableBeds: {
    type: Number,
    default: 100
  },
  totalRooms: {
    type: Number,
    default: 50
  },
  availableRooms: {
    type: Number,
    default: 50
  },
  departments: [{
    name: String,
    headDoctor: String,
    beds: Number,
    availableBeds: Number
  }],
  equipment: [{
    name: String,
    type: String,
    total: Number,
    available: Number,
    status: {
      type: String,
      enum: ['working', 'maintenance', 'out_of_order'],
      default: 'working'
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Hospital', hospitalSchema);
