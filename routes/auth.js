const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Hospital = require('../models/Hospital');
const Patient = require('../models/Patient');
const { body, validationResult } = require('express-validator');
const { auth } = require('../middleware/auth');

// Debug: Check JWT secret
console.log('JWT Secret loaded:', process.env.JWT_SECRET ? 'Yes' : 'No');
console.log('JWT Secret value:', process.env.JWT_SECRET);

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
  body('patientData').custom((value, { req }) => {
    if (req.body.userType === 'patient' && (!value || typeof value !== 'object')) {
      throw new Error('Patient data is required for patient access');
    }
    return true;
  })
], async (req, res) => {
  try {
    console.log('Login attempt received:', JSON.stringify(req.body, null, 2));

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { userType, username, password, patientData } = req.body;

    if (userType === 'hospital') {
      // Hospital login
      let hospital;

      // Check if we're in mock mode
      if (global.mockMode) {
        console.log('Mock mode detected, checking credentials...');
        // Mock authentication
        if (username === 'admin' && password === 'admin123') {
          hospital = global.mockHospital;
          console.log('Mock authentication successful');
        } else {
          console.log('Mock authentication failed - invalid credentials');
          return res.status(400).json({ message: 'Invalid credentials' });
        }
      } else {
        console.log('Database mode, checking credentials...');
        // Normal database authentication
        hospital = await Hospital.findOne({ username });
        if (!hospital) {
          return res.status(400).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, hospital.password);
        if (!isMatch) {
          return res.status(400).json({ message: 'Invalid credentials' });
        }
      }

      const token = jwt.sign(
        { id: hospital._id, type: 'hospital' },
        process.env.JWT_SECRET || 'fallback_jwt_secret_123456',
        { expiresIn: '24h' }
      );

      console.log('JWT token generated successfully');

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
      console.log('Processing patient login...');
      if (!patientData) {
        console.log('Patient data missing');
        return res.status(400).json({ message: 'Patient data is required for patient access' });
      }

      console.log('Patient data received:', JSON.stringify(patientData, null, 2));

      let patient;

      if (global.mockMode) {
        console.log('Mock mode detected, checking patient ...');
        patient = global.mockPatients.find(p => p.contact === patientData.contact);

        if (!patient) {
          console.log('Creating new patient in mock mode');
          patient = {
            _id: 'mock_patient_id_' + Math.random().toString(36).substr(2, 9),
            ...patientData
          };
          global.mockPatients.push(patient);
          console.log('New patient created and added to mock data');
        } else {
          console.log('Existing patient found, updating data');
          Object.assign(patient, patientData);
        }
      } else {
        // Check if patient already exists by contact
        patient = await Patient.findOne({ contact: patientData.contact });

        if (!patient) {
          // Create new patient
          patient = new Patient(patientData);
          await patient.save();
        } else {
          // Update existing patient data
          Object.assign(patient, patientData);
          await patient.save();
        }
      }

      console.log('Patient processed successfully:', patient.name);

      const token = jwt.sign(
        { id: patient._id, type: 'patient' },
        process.env.JWT_SECRET || 'fallback_jwt_secret_123456',
        { expiresIn: '24h' }
      );

      console.log('JWT token generated for patient');

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
      process.env.JWT_SECRET || 'fallback_jwt_secret_123456',
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
