# Hospital Resource Tracking System

A comprehensive real-time hospital resource management system designed to improve emergency resource allocation and patient care.

## Features

### Hospital Interface
- **Resource Management**: Real-time tracking of beds, rooms, and medical equipment
- **Inventory Management**: Medicine stock tracking with expiry date monitoring and notifications
- **Appointment System**: Doctor availability checking and appointment scheduling
- **Report Generation**: AI-powered analysis of patient test images with downloadable PDF reports
- **Patient Management**: Complete patient information and admission status tracking

### Patient Interface
- **Appointment Booking**: Easy appointment scheduling with real-time availability
- **Medical Reports**: View and download medical test reports and images
- **Medical History**: Complete medical record management with document uploads
- **Personal Dashboard**: Overview of appointments, reports, and health information

## Technology Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **Socket.io** for real-time updates
- **JWT** for authentication
- **Multer** for file uploads
- **PDFKit** for PDF generation
- **bcryptjs** for password hashing

### Frontend
- **React** with React Router
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **Axios** for API calls
- **React Hook Form** for form management
- **React Hot Toast** for notifications
- **Socket.io Client** for real-time updates

## Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB
- npm or yarn

### Backend Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd hospital-resource-tracker
```

2. Install backend dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file in the root directory:
```env
MONGODB_URI=mongodb+srv://falgunikatekar2006_db_user:edfTGDK2gaDnBfc7@cluster0.vabrltp.mongodb.net/?appName=Cluster0
JWT_SECRET=your_jwt_secret_key_here_change_in_production
PORT=5000
NODE_ENV=development
```

4. Start the backend server:
```bash
npm run dev
```

### Frontend Setup

1. Navigate to the client directory:
```bash
cd client
```

2. Install frontend dependencies:
```bash
npm install
```

3. Start the frontend development server:
```bash
npm start
```

## Usage

### Hospital Login
1. Visit the application URL
2. Click on "Hospital Staff"
3. Enter your username and password
4. Access the comprehensive hospital dashboard

### Patient Access
1. Visit the application URL
2. Click on "Patient"
3. Fill in your medical details and contact information
4. Access your personal patient portal

## Key Features

### Real-Time Updates
- Live bed and room availability tracking
- Instant notifications for medicine expiry and low stock
- Real-time appointment status updates
- Live report generation notifications

### Medicine Inventory Management
- Automatic expiry date tracking
- Low stock alerts with configurable thresholds
- Batch number and supplier tracking
- Comprehensive reporting and analytics

### Report Generation
- Upload multiple medical test images
- AI-powered analysis and summary generation
- Automatic PDF report creation
- Download and share functionality

### Appointment System
- Real-time doctor availability checking
- Time slot management
- Automated reminders and notifications
- Comprehensive appointment history

## Database Schema

### Hospital
- Basic hospital information
- Resource counts (beds, rooms, equipment)
- Department management

### Patient
- Personal and medical information
- Medical history and allergies
- Current medications and treatments
- Emergency contact details

### Doctor
- Professional information and specialization
- Schedule and availability
- Patient assignments

### Medicine
- Complete medicine information
- Stock and expiry tracking
- Supplier and batch details

### Appointment
- Patient-doctor matching
- Status tracking
- Prescription and payment details

### Report
- Medical test results
- Image attachments
- AI-generated summaries

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register-hospital` - Hospital registration
- `GET /api/auth/me` - Get current user

### Hospital Management
- `GET /api/hospital/dashboard` - Dashboard data
- `PUT /api/hospital/beds` - Update bed availability
- `PUT /api/hospital/rooms` - Update room availability
- `GET /api/hospital/patients` - Get patients list

### Inventory
- `GET /api/inventory` - Get medicines
- `POST /api/inventory` - Add medicine
- `PUT /api/inventory/:id/stock` - Update stock
- `GET /api/inventory/expiring-soon` - Get expiring medicines

### Appointments
- `GET /api/appointments` - Get appointments
- `POST /api/appointments` - Book appointment
- `GET /api/appointments/doctors/available` - Get available doctors
- `PUT /api/appointments/:id/status` - Update appointment status

### Reports
- `POST /api/reports/upload` - Upload medical report
- `POST /api/reports/:id/generate-summary` - Generate AI summary
- `GET /api/reports/:id/download` - Download PDF report

## Real-Time Events

### Hospital Events
- `beds-updated` - Bed availability changes
- `rooms-updated` - Room availability changes
- `equipment-updated` - Equipment status changes
- `medicine-stock-updated` - Medicine stock changes
- `appointment-booked` - New appointment booked
- `report-uploaded` - New report uploaded

### Patient Events
- `appointment-confirmed` - Appointment confirmation
- `appointment-reminder` - Appointment reminders
- `report-ready` - Report ready for download

## Security Features

- JWT-based authentication
- Password hashing with bcryptjs
- Input validation and sanitization
- Rate limiting on API endpoints
- CORS configuration
- File upload security

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please contact the development team.

## Future Enhancements

- Mobile application development
- Advanced AI diagnostics integration
- Telemedicine features
- Multi-hospital support
- Advanced analytics and reporting
- Integration with medical devices
- Prescription management system
- Billing and insurance integration
