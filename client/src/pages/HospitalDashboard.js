import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Building, 
  Users, 
  Bed, 
  DoorOpen, 
  Activity, 
  Calendar,
  Package,
  FileText,
  Bell,
  LogOut,
  Settings,
  TrendingUp,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import DashboardOverview from '../components/hospital/DashboardOverview';
import ResourceManagement from '../components/hospital/ResourceManagement';
import PatientManagement from '../components/hospital/PatientManagement';
import InventoryManagement from '../components/hospital/InventoryManagement';
import AppointmentManagement from '../components/hospital/AppointmentManagement';
import ReportManagement from '../components/hospital/ReportManagement';

const HospitalDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [notifications, setNotifications] = useState([]);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: TrendingUp, path: '/hospital' },
    { id: 'resources', label: 'Resources', icon: Activity, path: '/hospital/resources' },
    { id: 'patients', label: 'Patients', icon: Users, path: '/hospital/patients' },
    { id: 'inventory', label: 'Inventory', icon: Package, path: '/hospital/inventory' },
    { id: 'appointments', label: 'Appointments', icon: Calendar, path: '/hospital/appointments' },
    { id: 'reports', label: 'Reports', icon: FileText, path: '/hospital/reports' },
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
              <Building className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">{user.name}</h1>
                <p className="text-sm text-gray-500">Hospital Management System</p>
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
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
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
            <Route path="/" element={<DashboardOverview />} />
            <Route path="/resources" element={<ResourceManagement />} />
            <Route path="/patients" element={<PatientManagement />} />
            <Route path="/inventory" element={<InventoryManagement />} />
            <Route path="/appointments" element={<AppointmentManagement />} />
            <Route path="/reports" element={<ReportManagement />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default HospitalDashboard;
