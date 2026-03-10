const jwt = require('jsonwebtoken');
const Hospital = require('../models/Hospital');
const Patient = require('../models/Patient');

// Debug: Check JWT secret
console.log('Auth Middleware - JWT Secret loaded:', process.env.JWT_SECRET ? 'Yes' : 'No');
console.log('Auth Middleware - JWT Secret value:', process.env.JWT_SECRET);

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    console.log('Auth middleware - Token received:', token ? 'Yes' : 'No');

    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_jwt_secret_123456');
    console.log('Auth middleware - Token decoded:', decoded);

    // Check if it's a hospital or patient token
    if (decoded.type === 'hospital') {
      // Check if we're in mock mode
      if (global.mockMode) {
        console.log('Auth middleware - Mock mode detected');
        // Use mock hospital data
        if (decoded.id === 'mock_hospital_id') {
          req.user = global.mockHospital;
          req.userType = 'hospital';
          console.log('Auth middleware - Mock authentication successful');
          next();
          return;
        } else {
          console.log('Auth middleware - Mock authentication failed - invalid ID');
          return res.status(401).json({ message: 'Token is not valid' });
        }
      }

      // Normal database lookup
      const hospital = await Hospital.findById(decoded.id);
      if (!hospital) {
        return res.status(401).json({ message: 'Token is not valid' });
      }
      req.user = hospital;
      req.userType = 'hospital';
    } else if (decoded.type === 'patient') {
      // Check if we're in mock mode
      if (global.mockMode) {
        const patient = global.mockPatients.find(p => p._id === decoded.id);
        if (!patient) {
          return res.status(401).json({ message: 'Token is not valid' });
        }
        req.user = patient;
        req.userType = 'patient';
      } else {
        // Normal database lookup
        const patient = await Patient.findById(decoded.id);
        if (!patient) {
          return res.status(401).json({ message: 'Token is not valid' });
        }
        req.user = patient;
        req.userType = 'patient';
      }
    } else {
      return res.status(401).json({ message: 'Invalid token type' });
    }

    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ message: 'Token is not valid' });
  }
};

const hospitalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_jwt_secret_123456');

    if (decoded.type !== 'hospital') {
      return res.status(401).json({ message: 'Hospital access required' });
    }

    // Check if we're in mock mode
    if (global.mockMode) {
      // Use mock hospital data
      if (decoded.id === 'mock_hospital_id') {
        req.user = global.mockHospital;
        req.userType = 'hospital';
        next();
        return;
      } else {
        return res.status(401).json({ message: 'Token is not valid' });
      }
    }

    const hospital = await Hospital.findById(decoded.id);
    if (!hospital) {
      return res.status(401).json({ message: 'Token is not valid' });
    }

    req.user = hospital;
    req.userType = 'hospital';
    next();
  } catch (error) {
    console.error('Hospital auth error:', error);
    res.status(401).json({ message: 'Token is not valid' });
  }
};

const patientAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_jwt_secret_123456');

    if (decoded.type !== 'patient') {
      return res.status(401).json({ message: 'Patient access required' });
    }

    if (global.mockMode) {
      const patient = global.mockPatients.find(p => p._id === decoded.id);
      if (!patient) {
        return res.status(401).json({ message: 'Token is not valid' });
      }
      req.user = patient;
      req.userType = 'patient';
      next();
      return;
    }

    const patient = await Patient.findById(decoded.id);
    if (!patient) {
      return res.status(401).json({ message: 'Token is not valid' });
    }

    req.user = patient;
    req.userType = 'patient';
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

module.exports = { auth, hospitalAuth, patientAuth };
