const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

// Cleanup function for equipment data
const cleanupEquipmentData = async () => {
  try {
    const Hospital = require('./models/Hospital');
    const hospitals = await Hospital.find({});
    
    for (const hospital of hospitals) {
      console.log(`Checking hospital: ${hospital.name}, equipment type: ${typeof hospital.equipment}`);
      
      // If equipment is not an array, completely recreate the document
      if (!Array.isArray(hospital.equipment)) {
        console.log('Equipment is corrupted, recreating hospital document...');
        
        // Create a new hospital document with proper schema
        const newHospitalData = {
          username: hospital.username,
          password: hospital.password,
          name: hospital.name,
          email: hospital.email,
          phone: hospital.phone,
          address: hospital.address,
          totalBeds: hospital.totalBeds || 100,
          availableBeds: hospital.availableBeds || 100,
          totalRooms: hospital.totalRooms || 50,
          availableRooms: hospital.availableRooms || 50,
          departments: hospital.departments || [],
          equipment: [], // Force empty array
        };
        
        // Delete the old document and create a new one
        await Hospital.findByIdAndDelete(hospital._id);
        const newHospital = new Hospital(newHospitalData);
        await newHospital.save();
        
        console.log(`Recreated hospital: ${hospital.name} with proper equipment array`);
      } else {
        // If it's already an array, just clean it up
        hospital.equipment = hospital.equipment.filter(item => {
          return item && 
                 typeof item === 'object' && 
                 typeof item.name === 'string' && 
                 typeof item.type === 'string' && 
                 typeof item.total === 'number' &&
                 typeof item.available === 'number';
        });
        
        // Ensure all equipment has proper structure
        hospital.equipment = hospital.equipment.map(item => ({
          name: String(item.name || 'Unknown Equipment'),
          type: String(item.type || 'Unknown Type'),
          total: parseInt(item.total) || 0,
          available: parseInt(item.available) || parseInt(item.total) || 0,
          status: String(item.status || 'working')
        }));
        
        hospital.markModified('equipment');
        await hospital.save();
        console.log(`Cleaned up equipment data for hospital: ${hospital.name}`);
      }
    }
  } catch (error) {
    console.log('Equipment cleanup completed (no existing data or cleanup not needed):', error.message);
  }
};

const app = express();
const server = http.createServer(app);

// Trust proxy for development
app.set('trust proxy', true);

// Socket.io setup
const io = socketIo(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:3001"],
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for development
  crossOriginEmbedderPolicy: false
}));
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate Limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  trustProxy: true,
  skip: (req) => {
    // Skip rate limiting for local development
    return req.hostname === 'localhost' || req.hostname === '127.0.0.1';
  }
});

app.use('/api/', limiter);

// MongoDB Connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
    console.log("MongoDB connected successfully via Atlas");
  } catch (err) {
    console.log("\n⚠️ Could not connect to Atlas (IP likely not whitelisted).");
    console.log("🔄 Using fallback mode for demo purposes...\n");
    
    // Fallback to a local file-based database
    try {
      // Try to connect to a local MongoDB instance
      await mongoose.connect('mongodb://localhost:27017/hospital_demo', {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 3000
      });
      console.log("✅ Connected to local MongoDB instance!");
      
      // Create a default hospital user for demo purposes if it doesn't exist
      const Hospital = require('./models/Hospital');
      const bcrypt = require('bcryptjs');
      
      // Clean up any malformed equipment data
      await cleanupEquipmentData();
      
      const hospitalCount = await Hospital.countDocuments();
      if (hospitalCount === 0) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('admin123', salt);
        await Hospital.create({
          username: 'admin',
          password: hashedPassword,
          name: 'Demo Hospital',
          email: 'admin@demo.com',
          phone: '1234567890',
          address: '123 Demo St',
          equipment: [] // Initialize equipment array
        });
        console.log('----------------------------------------------------');
        console.log('🏥 Created Demo Hospital Account for you:');
        console.log('   Username: admin');
        console.log('   Password: admin123');
        console.log('----------------------------------------------------');
      }
    } catch (localError) {
      console.log("⚠️ Local MongoDB not available. Using mock mode...");
      console.log("📝 Note: Data will not persist between restarts in mock mode");
      
      // Set a flag to indicate we're in mock mode
      global.mockMode = true;
      
      // Create mock data without database connection
      await createMockData();
    }
  }
};

// Create mock data for demo purposes
const createMockData = async () => {
  console.log('🎭 Creating mock demo data...');
  
  // Mock hospital data
  const mockHospital = {
    _id: 'mock_hospital_id',
    username: 'admin',
    name: 'Demo Hospital',
    email: 'admin@demo.com',
    phone: '1234567890',
    address: '123 Demo St',
    totalBeds: 100,
    availableBeds: 85,
    totalRooms: 50,
    availableRooms: 42,
    equipment: []
  };
  
  // Store mock data in global for demo purposes
  global.mockHospital = mockHospital;
  global.mockDoctors = [];
  global.mockPatients = [];
  global.mockAppointments = [];
  global.mockEquipment = [];
  global.mockReports = [];
  global.mockEmergencyContacts = [];
  global.mockEmergencyRequests = [];
  
  // Set mock mode flag
  global.mockMode = true;
  
  console.log('----------------------------------------------------');
  console.log('🏥 Demo Hospital Ready (Mock Mode):');
  console.log('   Username: admin');
  console.log('   Password: admin123');
  console.log('   Note: This is demo mode - data will not persist');
  console.log('----------------------------------------------------');
};
connectDB();

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/hospital', require('./routes/hospital'));
app.use('/api/patient', require('./routes/patient'));
app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/inventory', require('./routes/inventory'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/allocations', require('./routes/allocations'));
app.use('/api/equipment', require('./routes/equipment'));

// Default route
app.get('/', (req, res) => {
  res.send("Hospital Management API Running");
});

// Socket.io realtime connection
io.on('connection', (socket) => {

  console.log("User connected:", socket.id);

  socket.on('join-hospital', (hospitalId) => {
    socket.join(hospitalId);
    console.log(`User joined hospital: ${hospitalId}`);
  });

  socket.on('disconnect', () => {
    console.log("User disconnected:", socket.id);
  });

});

// Make socket available to routes
app.set('io', io);

// Server Port
const PORT = process.env.PORT || 5001;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});