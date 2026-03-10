const jwt = require('jsonwebtoken');
const Hospital = require('../models/Hospital');
const Patient = require('../models/Patient');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if it's a hospital or patient token
    if (decoded.type === 'hospital') {
      const hospital = await Hospital.findById(decoded.id);
      if (!hospital) {
        return res.status(401).json({ message: 'Token is not valid' });
      }
      req.user = hospital;
      req.userType = 'hospital';
    } else if (decoded.type === 'patient') {
      const patient = await Patient.findById(decoded.id);
      if (!patient) {
        return res.status(401).json({ message: 'Token is not valid' });
      }
      req.user = patient;
      req.userType = 'patient';
    } else {
      return res.status(401).json({ message: 'Invalid token type' });
    }

    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

const hospitalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.type !== 'hospital') {
      return res.status(401).json({ message: 'Hospital access required' });
    }

    const hospital = await Hospital.findById(decoded.id);
    if (!hospital) {
      return res.status(401).json({ message: 'Token is not valid' });
    }

    req.user = hospital;
    req.userType = 'hospital';
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

const patientAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.type !== 'patient') {
      return res.status(401).json({ message: 'Patient access required' });
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
