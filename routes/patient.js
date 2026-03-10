const express = require('express');
const { patientAuth } = require('../middleware/auth');
const Patient = require('../models/Patient');
const router = express.Router();

// Get patient profile
router.get('/profile', patientAuth, async (req, res) => {
  try {
    const patient = await Patient.findById(req.user._id)
      .select('-password');
    res.json(patient);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update patient profile
router.put('/profile', patientAuth, async (req, res) => {
  try {
    const updates = req.body;
    const patient = await Patient.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true }
    ).select('-password');
    
    res.json({ message: 'Profile updated successfully', patient });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
