const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const Hospital = require('../models/Hospital');
const Patient = require('../models/Patient');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Login route with user type selection
router.post('/login', [
  body('userType').isIn(['hospital', 'patient']).withMessage('Invalid user type'),
  body('username').optional().notEmpty().withMessage('Username is required for hospital'),
  body('password').custom((value, { req }) => {
    if (req.body.userType === 'hospital' && !value) {
      throw new Error('Password is required');
    }
    return true;
  }),
  body('patientData').optional().isObject().withMessage('Patient data is required for patient registration')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userType, username, password, patientData } = req.body;

    if (userType === 'hospital') {
      // Hospital login
      const hospital = await Hospital.findOne({ username });
      if (!hospital) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }

      const isMatch = await bcrypt.compare(password, hospital.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }

      const token = jwt.sign(
        { id: hospital._id, type: 'hospital' },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        token,
        user: {
          id: hospital._id,
          name: hospital.name,
          username: hospital.username,
          type: 'hospital'
        }
      });
    } else if (userType === 'patient') {
      // Patient registration/login
      if (!patientData) {
        return res.status(400).json({ message: 'Patient data is required for patient access' });
      }

      // Check if patient already exists by contact
      let patient = await Patient.findOne({ contact: patientData.contact });

      if (!patient) {
        // Create new patient
        patient = new Patient(patientData);
        await patient.save();
      } else {
        // Update existing patient data
        Object.assign(patient, patientData);
        await patient.save();
      }

      const token = jwt.sign(
        { id: patient._id, type: 'patient' },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        token,
        user: {
          id: patient._id,
          name: patient.name,
          contact: patient.contact,
          type: 'patient'
        }
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user._id,
        name: req.user.name,
        type: req.userType,
        ...(req.userType === 'hospital' ? { username: req.user.username } : { contact: req.user.contact })
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Register hospital (for initial setup)
router.post('/register-hospital', [
  body('username').isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('name').notEmpty().withMessage('Hospital name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('phone').notEmpty().withMessage('Phone number is required'),
  body('address').notEmpty().withMessage('Address is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, password, name, email, phone, address } = req.body;

    // Check if hospital already exists
    let hospital = await Hospital.findOne({ $or: [{ username }, { email }] });
    if (hospital) {
      return res.status(400).json({ message: 'Hospital already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new hospital
    hospital = new Hospital({
      username,
      password: hashedPassword,
      name,
      email,
      phone,
      address
    });

    await hospital.save();

    const token = jwt.sign(
      { id: hospital._id, type: 'hospital' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      token,
      user: {
        id: hospital._id,
        name: hospital.name,
        username: hospital.username,
        type: 'hospital'
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
