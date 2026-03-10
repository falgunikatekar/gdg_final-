import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  User, 
  Calendar, 
  FileText, 
  Upload, 
  Heart, 
  Activity,
  LogOut,
  Settings,
  Bell,
  Clock,
  CheckCircle,
  AlertCircle,
  Download,
  Eye,
  AlertTriangle
} from 'lucide-react';
import PatientOverview from '../components/patient/PatientOverview';
import PatientAppointments from '../components/patient/PatientAppointments';
import PatientReports from '../components/patient/PatientReports';
import MedicalHistory from '../components/patient/MedicalHistory';
import PatientEmergency from '../components/patient/PatientEmergency';

const PatientDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [notifications, setNotifications] = useState([]);

  const menuItems = [
    { id: 'overview', label: 'Overview', icon: Activity, path: '/patient' },
    { id: 'appointments', label: 'Appointments', icon: Calendar, path: '/patient/appointments' },
    { id: 'reports', label: 'Medical Reports', icon: FileText, path: '/patient/reports' },
    { id: 'history', label: 'Medical History', icon: Heart, path: '/patient/history' },
    { id: 'emergency', label: 'Emergency', icon: AlertTriangle, path: '/patient/emergency' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <User className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Welcome, {user.name}</h1>
                <p className="text-sm text-gray-500">Patient Portal</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button className="relative p-2 text-gray-600 hover:text-gray-900">
                <Bell className="h-5 w-5" />
                {notifications.length > 0 && (
                  <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
                )}
              </button>
              
              <button className="p-2 text-gray-600 hover:text-gray-900">
                <Settings className="h-5 w-5" />
              </button>
              
              <button
                onClick={handleLogout}
                className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white shadow-sm h-screen sticky top-0">
          <nav className="p-4 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              
              return (
                <Link
                  key={item.id}
                  to={item.path}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'bg-green-50 text-green-700 border-r-2 border-green-700'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className="h-5 w-5 mr-3" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <Routes>
            <Route path="/" element={<PatientOverview />} />
            <Route path="/appointments" element={<PatientAppointments />} />
            <Route path="/reports" element={<PatientReports />} />
            <Route path="/history" element={<MedicalHistory />} />
            <Route path="/emergency" element={<PatientEmergency />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default PatientDashboard;
