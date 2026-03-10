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
    
    // Check if we're in mock mode
    if (global.mockMode) {
      // Return mock dashboard data
      res.json({
        hospital: {
          name: hospital.name,
          totalBeds: hospital.totalBeds,
          availableBeds: hospital.availableBeds,
          totalRooms: hospital.totalRooms,
          availableRooms: hospital.availableRooms,
          departments: hospital.departments || [],
          equipment: global.mockEquipment || []
        },
        statistics: {
          totalPatients: 25,
          admittedPatients: 15,
          emergencyPatients: 3,
          totalDoctors: 10,
          availableDoctors: 8
        },
        recentPatients: [
          { name: 'John Doe', age: 45, contact: '9876543210', status: 'admitted', currentIssue: 'Chest pain', createdAt: new Date() },
          { name: 'Jane Smith', age: 32, contact: '9876543211', status: 'discharged', currentIssue: 'Fever', createdAt: new Date() }
        ]
      });
      return;
    }
    
    // Normal database operations
    const Patient = require('../models/Patient');
    const Doctor = require('../models/Doctor');
    
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
    console.error('Dashboard error:', error);
    res.status(500).json({ message: 'Failed to load dashboard data' });
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
    
    console.log('Adding equipment request:', { name, type, total });
    console.log('Hospital ID:', hospital._id);
    console.log('Current equipment type:', typeof hospital.equipment);
    console.log('Current equipment value:', hospital.equipment);
    
    // Validate input
    if (!name || !type || !total || total <= 0) {
      return res.status(400).json({ 
        message: 'Please provide valid equipment details (name, type, and total quantity > 0)' 
      });
    }
    
    // Force recreate the hospital document to ensure proper schema
    const Hospital = require('../models/Hospital');
    const freshHospital = await Hospital.findById(hospital._id);
    
    // Ensure equipment is properly initialized as an array
    if (!Array.isArray(freshHospital.equipment)) {
      freshHospital.equipment = [];
    }
    
    const newEquipment = {
      name: String(name),
      type: String(type),
      total: parseInt(total),
      available: parseInt(total),
      status: 'working'
    };
    
    console.log('New equipment object:', newEquipment);
    
    freshHospital.equipment.push(newEquipment);
    
    // Update other fields to preserve them
    freshHospital.username = hospital.username;
    freshHospital.password = hospital.password;
    freshHospital.name = hospital.name;
    freshHospital.email = hospital.email;
    freshHospital.phone = hospital.phone;
    freshHospital.address = hospital.address;
    freshHospital.totalBeds = hospital.totalBeds;
    freshHospital.availableBeds = hospital.availableBeds;
    freshHospital.totalRooms = hospital.totalRooms;
    freshHospital.availableRooms = hospital.availableRooms;
    freshHospital.departments = hospital.departments || [];
    
    await freshHospital.save();
    
    console.log('Equipment saved successfully');
    console.log('Updated hospital equipment:', freshHospital.equipment);
    
    // Emit real-time update
    try {
      req.app.get('io').to(freshHospital._id.toString()).emit('equipment-added', {
        equipment: freshHospital.equipment[freshHospital.equipment.length - 1]
      });
    } catch (socketError) {
      console.log('Socket emit failed, but equipment was added:', socketError.message);
    }
    
    res.status(201).json({ 
      message: 'Equipment added successfully',
      equipment: freshHospital.equipment[freshHospital.equipment.length - 1]
    });
  } catch (error) {
    console.error('Error adding equipment:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    
    // Try to provide more specific error information
    let errorMessage = 'Failed to add equipment';
    if (error.name === 'ValidationError') {
      errorMessage = `Validation error: ${error.message}`;
    } else if (error.name === 'CastError') {
      errorMessage = `Data type error: ${error.message}`;
    } else {
      errorMessage = `Server error: ${error.message}`;
    }
    
    res.status(500).json({ 
      message: errorMessage
    });
  }
});

// Get all patients
router.get('/patients', hospitalAuth, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
    // Check if we're in mock mode
    if (global.mockMode) {
      let mockPatients = global.mockPatients || [
        {
          _id: 'pat_1',
          name: 'John Doe',
          age: 45,
          contact: '9876543210',
          status: 'admitted',
          currentIssue: 'Heart condition',
          assignedDoctor: 'Dr. Rajesh Sharma',
          assignedRoom: '201',
          assignedBed: 'A',
          createdAt: new Date('2024-01-15')
        },
        {
          _id: 'pat_2',
          name: 'Jane Smith',
          age: 32,
          contact: '9876543211',
          status: 'admitted',
          currentIssue: 'Post-surgery recovery',
          assignedDoctor: 'Dr. Priya Nair',
          assignedRoom: '202',
          assignedBed: 'B',
          createdAt: new Date('2024-02-01')
        },
        {
          _id: 'pat_3',
          name: 'Bob Johnson',
          age: 28,
          contact: '9876543212',
          status: 'discharged',
          currentIssue: 'Emergency care',
          assignedDoctor: 'Dr. Amit Patel',
          assignedRoom: null,
          assignedBed: null,
          createdAt: new Date('2024-03-01')
        }
      ];
      
      // Initialize global mock patients if not exists
      if (!global.mockPatients) {
        global.mockPatients = mockPatients;
      } else {
        mockPatients = global.mockPatients;
      }
      
      // Apply status filter
      let filteredPatients = mockPatients;
      if (status) {
        filteredPatients = mockPatients.filter(patient => patient.status === status);
      }
      
      // Apply pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedPatients = filteredPatients.slice(startIndex, endIndex);
      
      return res.json({
        patients: paginatedPatients,
        totalPages: Math.ceil(filteredPatients.length / limit),
        currentPage: parseInt(page),
        total: filteredPatients.length
      });
    }
    
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

// Emergency routes
router.use('/emergency', require('./hospital-emergency'));

module.exports = router;
