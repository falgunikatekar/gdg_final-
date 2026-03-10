const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const PDFDocument = require('pdfkit');
const { hospitalAuth, patientAuth } = require('../middleware/auth');
const Report = require('../models/Report');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/reports';
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
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image and document files are allowed'));
    }
  }
});

// Upload test images and create report
router.post('/upload', hospitalAuth, upload.array('images', 5), async (req, res) => {
  try {
    const { patientId, type, title, description, testDate } = req.body;
    const hospitalId = req.user._id;

    // Check if we're in mock mode
    if (global.mockMode) {
      // Find the patient in mock patients array
      const mockPatients = global.mockPatients || [];
      const patient = mockPatients.find(p => p._id === patientId) || {
        _id: patientId,
        name: 'Mock Patient',
        age: 30,
        contact: '9876543210'
      };

      // Create mock report
      const mockReport = {
        _id: `report_${Date.now()}`,
        patient: {
          _id: patient._id,
          name: patient.name,
          age: patient.age,
          contact: patient.contact
        },
        doctor: {
          _id: 'doctor_1',
          name: 'Dr. Rajesh Sharma'
        },
        hospital: hospitalId,
        type,
        title,
        description,
        testDate: new Date(testDate),
        images: req.files ? req.files.map(file => ({
          filename: file.filename,
          originalName: file.originalname,
          path: file.path,
          size: file.size,
          mimetype: file.mimetype
        })) : [],
        status: 'completed',
        createdAt: new Date(),
        summary: 'Mock report summary for demonstration purposes.'
      };

      // Initialize mock reports array if not exists
      if (!global.mockReports) {
        global.mockReports = [];
      }
      global.mockReports.push(mockReport);

      return res.status(201).json({
        message: 'Report uploaded successfully (Mock Mode)',
        report: mockReport
      });
    }

    // Validate patient exists
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // Get doctor (assuming first available or assign based on department)
    const doctor = await Doctor.findOne({ hospital: hospitalId, available: true });

    // Create report
    const report = new Report({
      patient: patientId,
      doctor: doctor?._id,
      hospital: hospitalId,
      type,
      title,
      description,
      testDate: new Date(testDate),
      images: req.files.map(file => ({
        filename: file.filename,
        originalName: file.originalname,
        path: file.path,
        size: file.size,
        mimetype: file.mimetype
      })),
      status: 'processing'
    });

    await report.save();

    // Add report to patient's reports array
    patient.reports.push(report._id);
    await patient.save();

    // Emit real-time update
    req.app.get('io').to(hospitalId.toString()).emit('report-uploaded', {
      report: await Report.findById(report._id)
        .populate('patient', 'name')
        .populate('doctor', 'name')
    });

    res.status(201).json({
      message: 'Report uploaded successfully',
      report
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Generate AI-powered report summary (mock implementation)
router.post('/:reportId/generate-summary', hospitalAuth, async (req, res) => {
  try {
    const { reportId } = req.params;
    const report = await Report.findById(reportId).populate('patient', 'name age');

    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    // Mock AI analysis - in real implementation, this would call an AI service
    const mockAnalysis = {
      normal: Math.random() > 0.3,
      summary: `Based on the analysis of ${report.type} for patient ${report.patient.name} (${report.patient.age} years old), the test results show ${Math.random() > 0.3 ? 'normal' : 'some abnormalities'} patterns. ${Math.random() > 0.5 ? 'No immediate concerns detected.' : 'Further evaluation recommended.'}`,
      details: `Detailed analysis of the ${report.type} reveals ${Math.random() > 0.5 ? 'healthy' : 'borderline'} conditions. All major parameters appear within ${Math.random() > 0.4 ? 'normal' : 'acceptable'} ranges. ${Math.random() > 0.6 ? 'Regular monitoring advised.' : 'Immediate medical attention may be required.'}`,
      recommendations: Math.random() > 0.5 ? 
        'Continue with regular check-ups. Maintain current medication schedule. Follow up in 3 months.' :
        'Consult with specialist immediately. Additional tests may be required. Monitor vital signs closely.',
      followUpRequired: Math.random() > 0.6,
      parameters: [
        {
          name: 'Parameter A',
          value: (Math.random() * 100).toFixed(2),
          unit: 'mg/dL',
          normalRange: '70-100',
          status: Math.random() > 0.3 ? 'normal' : 'high'
        },
        {
          name: 'Parameter B',
          value: (Math.random() * 50).toFixed(2),
          unit: 'mmol/L',
          normalRange: '3.5-5.5',
          status: Math.random() > 0.3 ? 'normal' : 'low'
        }
      ]
    };

    report.results = mockAnalysis;
    report.status = 'completed';
    await report.save();

    // Generate PDF
    const pdfPath = await generatePDFReport(report);

    if (pdfPath) {
      report.pdfReport = {
        filename: path.basename(pdfPath),
        path: pdfPath
      };
      await report.save();
    }

    // Emit real-time update
    req.app.get('io').to(report.hospital.toString()).emit('report-generated', {
      reportId: report._id,
      status: report.status
    });

    res.json({
      message: 'Report summary generated successfully',
      report
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Generate PDF report
async function generatePDFReport(report) {
  return new Promise((resolve, reject) => {
    try {
      const reportsDir = 'uploads/pdf-reports';
      if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
      }

      const filename = `report-${report._id}-${Date.now()}.pdf`;
      const filePath = path.join(reportsDir, filename);

      const doc = new PDFDocument();
      const stream = fs.createWriteStream(filePath);

      doc.pipe(stream);

      // Header
      doc.fontSize(20).text('Medical Test Report', { align: 'center' });
      doc.moveDown();

      // Patient Information
      doc.fontSize(14).text('Patient Information:');
      doc.fontSize(12).text(`Name: ${report.patient.name || 'N/A'}`);
      doc.text(`Age: ${report.patient.age || 'N/A'}`);
      doc.text(`Test Date: ${new Date(report.testDate).toLocaleDateString()}`);
      doc.text(`Report Type: ${report.type}`);
      doc.moveDown();

      // Test Results
      if (report.results) {
        doc.fontSize(14).text('Test Results:');
        doc.fontSize(12).text(`Status: ${report.results.normal ? 'Normal' : 'Abnormal'}`);
        doc.moveDown();

        doc.fontSize(14).text('Summary:');
        doc.fontSize(12).text(report.results.summary, { align: 'justify' });
        doc.moveDown();

        if (report.results.parameters && report.results.parameters.length > 0) {
          doc.fontSize(14).text('Parameters:');
          report.results.parameters.forEach(param => {
            doc.fontSize(12).text(`${param.name}: ${param.value} ${param.unit} (Normal: ${param.normalRange}) - ${param.status}`);
          });
          doc.moveDown();
        }

        doc.fontSize(14).text('Recommendations:');
        doc.fontSize(12).text(report.results.recommendations, { align: 'justify' });
      }

      doc.end();

      stream.on('finish', () => {
        resolve(filePath);
      });

      stream.on('error', reject);
    } catch (error) {
      reject(error);
    }
  });
}

// Get all reports for hospital
router.get('/', hospitalAuth, async (req, res) => {
  try {
    const { status, type, patientId, page = 1, limit = 20 } = req.query;
    const hospitalId = req.user._id;

    // Check if we're in mock mode
    if (global.mockMode) {
      let mockReports = global.mockReports || [
        {
          _id: 'report_1',
          patient: { _id: 'pat_1', name: 'John Doe', age: 45, contact: '9876543210' },
          doctor: { _id: 'doctor_1', name: 'Dr. Rajesh Sharma', specialization: 'Cardiology' },
          hospital: hospitalId,
          type: 'blood_test',
          title: 'Complete Blood Count',
          description: 'Routine blood test for annual checkup',
          testDate: new Date('2024-01-15'),
          status: 'completed',
          images: [],
          createdAt: new Date('2024-01-15'),
          summary: 'All blood parameters are within normal range.'
        },
        {
          _id: 'report_2',
          patient: { _id: 'pat_2', name: 'Jane Smith', age: 32, contact: '9876543211' },
          doctor: { _id: 'doctor_2', name: 'Dr. Priya Nair', specialization: 'Pediatrics' },
          hospital: hospitalId,
          type: 'x_ray',
          title: 'Chest X-Ray',
          description: 'X-ray for respiratory infection check',
          testDate: new Date('2024-02-01'),
          status: 'completed',
          images: [],
          createdAt: new Date('2024-02-01'),
          summary: 'Clear lungs, no signs of infection.'
        }
      ];

      // Apply filters
      if (status) {
        mockReports = mockReports.filter(report => report.status === status);
      }
      if (type) {
        mockReports = mockReports.filter(report => report.type === type);
      }
      if (patientId) {
        mockReports = mockReports.filter(report => report.patient._id === patientId);
      }

      // Apply pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedReports = mockReports.slice(startIndex, endIndex);

      return res.json({
        reports: paginatedReports,
        totalPages: Math.ceil(mockReports.length / limit),
        currentPage: parseInt(page),
        total: mockReports.length
      });
    }

    const query = { hospital: hospitalId };
    if (status) query.status = status;
    if (type) query.type = type;
    if (patientId) query.patient = patientId;

    const reports = await Report.find(query)
      .populate('patient', 'name age contact')
      .populate('doctor', 'name specialization')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Report.countDocuments(query);

    res.json({
      reports,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get reports for patient
router.get('/patient', patientAuth, async (req, res) => {
  try {
    const { status, type, page = 1, limit = 20 } = req.query;
    const patientId = req.user._id;

    const query = { patient: patientId };
    if (status) query.status = status;
    if (type) query.type = type;

    const reports = await Report.find(query)
      .populate('doctor', 'name specialization')
      .populate('hospital', 'name address')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Report.countDocuments(query);

    res.json({
      reports,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get specific report
router.get('/:reportId', async (req, res) => {
  try {
    const { reportId } = req.params;

    const report = await Report.findById(reportId)
      .populate('patient', 'name age contact')
      .populate('doctor', 'name specialization department')
      .populate('hospital', 'name address phone');

    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    res.json(report);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Download PDF report
router.get('/:reportId/download', async (req, res) => {
  try {
    const { reportId } = req.params;

    const report = await Report.findById(reportId);
    if (!report || !report.pdfReport) {
      return res.status(404).json({ message: 'PDF report not found' });
    }

    const filePath = report.pdfReport.path;
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'PDF file not found' });
    }

    res.download(filePath, report.pdfReport.filename);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update report status
router.put('/:reportId/status', hospitalAuth, async (req, res) => {
  try {
    const { reportId } = req.params;
    const { status } = req.body;

    const report = await Report.findById(reportId);
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    report.status = status;
    await report.save();

    // Emit real-time update
    req.app.get('io').to(report.hospital.toString()).emit('report-status-updated', {
      reportId: report._id,
      status: report.status
    });

    res.json({ message: 'Report status updated successfully', report });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete report
router.delete('/:reportId', hospitalAuth, async (req, res) => {
  try {
    const { reportId } = req.params;

    const report = await Report.findByIdAndDelete(reportId);
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    // Delete associated files
    report.images.forEach(image => {
      if (fs.existsSync(image.path)) {
        fs.unlinkSync(image.path);
      }
    });

    if (report.pdfReport && fs.existsSync(report.pdfReport.path)) {
      fs.unlinkSync(report.pdfReport.path);
    }

    // Remove report from patient's reports array
    await Patient.findByIdAndUpdate(
      report.patient,
      { $pull: { reports: reportId } }
    );

    // Emit real-time update
    req.app.get('io').to(report.hospital.toString()).emit('report-deleted', {
      reportId
    });

    res.json({ message: 'Report deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
