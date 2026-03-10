const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// Socket.io setup
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate Limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});

app.use('/api/', limiter);

// MongoDB Connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
    console.log("MongoDB connected successfully via Atlas");
  } catch (err) {
    console.log("\n⚠️ Could not connect to Atlas (IP likely not whitelisted).\nFalling back to local in-memory database so you can test the app...\n");
    const { MongoMemoryServer } = require('mongodb-memory-server');
    const mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
    console.log("✅ MongoDB connected successfully via local In-Memory Server!");

    // Create a default hospital user for demo purposes if it doesn't exist
    const Hospital = require('./models/Hospital');
    const bcrypt = require('bcryptjs');
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
        address: '123 Demo St'
      });
      console.log('----------------------------------------------------');
      console.log('🏥 Created Demo Hospital Account for you:');
      console.log('   Username: admin');
      console.log('   Password: admin123');
      console.log('----------------------------------------------------');
    }
  }
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