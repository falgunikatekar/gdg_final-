const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { patientAuth } = require('../middleware/auth');
const Patient = require('../models/Patient');
const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/documents';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image and PDF files are allowed'));
    }
  }
});

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

// Upload document
router.post('/documents/upload', patientAuth, upload.single('file'), async (req, res) => {
  try {
    const { title, type, date, description } = req.body;
    const patientId = req.user._id;

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const patient = await Patient.findById(patientId);
    if (!patient) return res.status(404).json({ message: 'Patient not found' });

    const newDoc = {
      title,
      type: type || 'other',
      date: date ? new Date(date) : new Date(),
      description,
      filename: req.file.filename,
      path: req.file.path
    };

    patient.documents.push(newDoc);
    await patient.save();

    res.status(201).json({ message: 'Document uploaded successfully', document: patient.documents[patient.documents.length - 1] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete document
router.delete('/documents/:documentId', patientAuth, async (req, res) => {
  try {
    const patientId = req.user._id;
    const { documentId } = req.params;

    const patient = await Patient.findById(patientId);
    if (!patient) return res.status(404).json({ message: 'Patient not found' });

    const docIndex = patient.documents.findIndex(d => d._id.toString() === documentId);
    if (docIndex === -1) return res.status(404).json({ message: 'Document not found' });

    const doc = patient.documents[docIndex];
    if (fs.existsSync(doc.path)) {
      fs.unlinkSync(doc.path);
    }

    patient.documents.splice(docIndex, 1);
    await patient.save();

    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
