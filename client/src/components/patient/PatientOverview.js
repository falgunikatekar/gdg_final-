import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  Calendar,
  FileText,
  Heart,
  Activity,
  Clock,
  CheckCircle,
  AlertCircle,
  User,
  Phone,
  Mail,
  MapPin,
  TrendingUp
} from 'lucide-react';

const PatientOverview = () => {
  const [patientData, setPatientData] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPatientData();
    fetchAppointments();
    fetchReports();
  }, []);

  const fetchPatientData = async () => {
    try {
      const response = await axios.get('/api/patient/profile');
      setPatientData({
        name: response.data.name,
        age: response.data.age,
        gender: response.data.gender,
        contact: response.data.contact,
        email: response.data.email,
        address: response.data.address,
        bloodGroup: response.data.medicalHistory?.bloodGroup || 'N/A',
        status: response.data.status
      });
    } catch (error) {
      console.error('Failed to fetch patient data:', error);
    }
  };

  const fetchAppointments = async () => {
    try {
      const response = await axios.get('/api/appointments/patient?limit=5');
      setAppointments(response.data.appointments);
    } catch (error) {
      console.error('Failed to fetch appointments:', error);
    }
  };

  const fetchReports = async () => {
    try {
      const response = await axios.get('/api/reports/patient?limit=5');
      setReports(response.data.reports);
    } catch (error) {
      console.error('Failed to fetch reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-purple-100 text-purple-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getReportStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Patient Overview</h1>
        <p className="text-gray-600">Your medical information at a glance</p>
      </div>

      {/* Patient Info Card */}
      {patientData && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Personal Information</h2>
            <button className="btn btn-secondary">
              Edit Profile
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex items-center">
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <User className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-500">Name</p>
                <p className="text-sm font-medium text-gray-900">{patientData.name}</p>
              </div>
            </div>

            <div className="flex items-center">
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Activity className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-500">Age & Gender</p>
                <p className="text-sm font-medium text-gray-900">{patientData.age} years, {patientData.gender}</p>
              </div>
            </div>

            <div className="flex items-center">
              <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                <Heart className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-500">Blood Group</p>
                <p className="text-sm font-medium text-gray-900">{patientData.bloodGroup}</p>
              </div>
            </div>

            <div className="flex items-center">
              <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-500">Status</p>
                <span className={`status-badge ${getStatusColor(patientData.status)}`}>
                  {patientData.status}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center text-sm text-gray-600">
              <Phone className="h-4 w-4 mr-2" />
              {patientData.contact}
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <Mail className="h-4 w-4 mr-2" />
              {patientData.email}
            </div>
            <div className="flex items-center text-sm text-gray-600 md:col-span-2">
              <MapPin className="h-4 w-4 mr-2" />
              {patientData.address}
            </div>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Calendar className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <p className="text-sm text-gray-500">Upcoming Appointments</p>
              <p className="text-2xl font-bold text-gray-900">
                {appointments.filter(apt => ['scheduled', 'confirmed'].includes(apt.status)).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <FileText className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <p className="text-sm text-gray-500">Medical Reports</p>
              <p className="text-2xl font-bold text-gray-900">{reports.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-purple-600 mr-3" />
            <div>
              <p className="text-sm text-gray-500">Completed Visits</p>
              <p className="text-2xl font-bold text-gray-900">
                {appointments.filter(apt => apt.status === 'completed').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Appointments */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Recent Appointments</h2>
              <Link to="/patient/appointments" className="text-blue-600 hover:text-blue-800 text-sm">
                View All
              </Link>
            </div>
          </div>
          <div className="p-6">
            {appointments.length > 0 ? (
              <div className="space-y-4">
                {appointments.slice(0, 3).map((appointment) => (
                  <div key={appointment._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <Calendar className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">
                          Dr. {appointment.doctor?.name || 'Unknown'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(appointment.date).toLocaleDateString()} at {appointment.time}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`status-badge ${getStatusColor(appointment.status)}`}>
                        {appointment.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No appointments scheduled</p>
            )}
          </div>
        </div>

        {/* Recent Reports */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Recent Reports</h2>
              <Link to="/patient/reports" className="text-blue-600 hover:text-blue-800 text-sm">
                View All
              </Link>
            </div>
          </div>
          <div className="p-6">
            {reports.length > 0 ? (
              <div className="space-y-4">
                {reports.slice(0, 3).map((report) => (
                  <div key={report._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                        <FileText className="h-5 w-5 text-green-600" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">{report.title}</p>
                        <p className="text-sm text-gray-500">
                          {report.type.replace('_', ' ')} • {new Date(report.testDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`status-badge ${getReportStatusColor(report.status)}`}>
                        {report.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No medical reports available</p>
            )}
          </div>
        </div>
      </div>

      {/* Health Tips */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6 border border-green-200">
        <div className="flex items-center mb-4">
          <Heart className="h-6 w-6 text-green-600 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900">Health Tips</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2">Stay Hydrated</h3>
            <p className="text-sm text-gray-600">Drink at least 8 glasses of water daily to maintain good health.</p>
          </div>
          <div className="bg-white rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2">Regular Exercise</h3>
            <p className="text-sm text-gray-600">Aim for 30 minutes of moderate exercise most days of the week.</p>
          </div>
          <div className="bg-white rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2">Balanced Diet</h3>
            <p className="text-sm text-gray-600">Include fruits, vegetables, and whole grains in your daily meals.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientOverview;
