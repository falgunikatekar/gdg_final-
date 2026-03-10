const express = require('express');
const { hospitalAuth } = require('../middleware/auth');
const Hospital = require('../models/Hospital');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const router = express.Router();

// Get hospital dashboard data
router.get('/dashboard', hospitalAuth, async (req, res) => {
  try {
    const hospital = req.user;
    
    // Get patient statistics
    const totalPatients = await Patient.countDocuments();
    const admittedPatients = await Patient.countDocuments({ status: 'admitted' });
    const emergencyPatients = await Patient.countDocuments({ status: 'emergency' });
    
    // Get doctor statistics
    const totalDoctors = await Doctor.countDocuments({ hospital: hospital._id });
    const availableDoctors = await Doctor.countDocuments({ 
      hospital: hospital._id, 
      available: true 
    });
    
    // Get recent patients
    const recentPatients = await Patient.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name age contact status currentIssue createdAt');
    
    res.json({
      hospital: {
        name: hospital.name,
        totalBeds: hospital.totalBeds,
        availableBeds: hospital.availableBeds,
        totalRooms: hospital.totalRooms,
        availableRooms: hospital.availableRooms,
        departments: hospital.departments,
        equipment: hospital.equipment
      },
      statistics: {
        totalPatients,
        admittedPatients,
        emergencyPatients,
        totalDoctors,
        availableDoctors
      },
      recentPatients
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update bed availability
router.put('/beds', hospitalAuth, async (req, res) => {
  try {
    const { availableBeds } = req.body;
    const hospital = req.user;
    
    if (availableBeds < 0 || availableBeds > hospital.totalBeds) {
      return res.status(400).json({ message: 'Invalid bed count' });
    }
    
    hospital.availableBeds = availableBeds;
    await hospital.save();
    
    // Emit real-time update
    req.app.get('io').to(hospital._id.toString()).emit('beds-updated', {
      totalBeds: hospital.totalBeds,
      availableBeds: hospital.availableBeds
    });
    
    res.json({ 
      message: 'Bed availability updated',
      totalBeds: hospital.totalBeds,
      availableBeds: hospital.availableBeds
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update room availability
router.put('/rooms', hospitalAuth, async (req, res) => {
  try {
    const { availableRooms } = req.body;
    const hospital = req.user;
    
    if (availableRooms < 0 || availableRooms > hospital.totalRooms) {
      return res.status(400).json({ message: 'Invalid room count' });
    }
    
    hospital.availableRooms = availableRooms;
    await hospital.save();
    
    // Emit real-time update
    req.app.get('io').to(hospital._id.toString()).emit('rooms-updated', {
      totalRooms: hospital.totalRooms,
      availableRooms: hospital.availableRooms
    });
    
    res.json({ 
      message: 'Room availability updated',
      totalRooms: hospital.totalRooms,
      availableRooms: hospital.availableRooms
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update equipment status
router.put('/equipment/:equipmentId', hospitalAuth, async (req, res) => {
  try {
    const { equipmentId } = req.params;
    const { status, available } = req.body;
    const hospital = req.user;
    
    const equipment = hospital.equipment.id(equipmentId);
    if (!equipment) {
      return res.status(404).json({ message: 'Equipment not found' });
    }
    
    if (status) equipment.status = status;
    if (available !== undefined) equipment.available = available;
    
    await hospital.save();
    
    // Emit real-time update
    req.app.get('io').to(hospital._id.toString()).emit('equipment-updated', {
      equipmentId,
      equipment: {
        name: equipment.name,
        type: equipment.type,
        total: equipment.total,
        available: equipment.available,
        status: equipment.status
      }
    });
    
    res.json({ 
      message: 'Equipment updated',
      equipment
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add new equipment
router.post('/equipment', hospitalAuth, async (req, res) => {
  try {
    const { name, type, total } = req.body;
    const hospital = req.user;
    
    hospital.equipment.push({
      name,
      type,
      total,
      available: total,
      status: 'working'
    });
    
    await hospital.save();
    
    // Emit real-time update
    req.app.get('io').to(hospital._id.toString()).emit('equipment-added', {
      equipment: hospital.equipment[hospital.equipment.length - 1]
    });
    
    res.status(201).json({ 
      message: 'Equipment added',
      equipment: hospital.equipment[hospital.equipment.length - 1]
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all patients
router.get('/patients', hospitalAuth, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
    const query = {};
    if (status) query.status = status;
    
    const patients = await Patient.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('name age contact status currentIssue assignedDoctor assignedRoom assignedBed createdAt');
    
    const total = await Patient.countDocuments(query);
    
    res.json({
      patients,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get patient details
router.get('/patients/:patientId', hospitalAuth, async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.patientId)
      .populate('assignedDoctor', 'name specialization department')
      .populate('reports', 'type title testDate status')
      .populate('appointments', 'date time status type');
    
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    
    res.json(patient);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update patient status
router.put('/patients/:patientId/status', hospitalAuth, async (req, res) => {
  try {
    const { status, assignedRoom, assignedBed } = req.body;
    
    const patient = await Patient.findById(req.params.patientId);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    
    if (status) patient.status = status;
    if (assignedRoom) patient.assignedRoom = assignedRoom;
    if (assignedBed) patient.assignedBed = assignedBed;
    
    if (status === 'admitted' && !patient.admissionDate) {
      patient.admissionDate = new Date();
    } else if (status === 'discharged' && !patient.dischargeDate) {
      patient.dischargeDate = new Date();
    }
    
    await patient.save();
    
    // Emit real-time update
    req.app.get('io').to(req.user._id.toString()).emit('patient-status-updated', {
      patientId: patient._id,
      status: patient.status,
      assignedRoom: patient.assignedRoom,
      assignedBed: patient.assignedBed
    });
    
    res.json({ 
      message: 'Patient status updated',
      patient
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
