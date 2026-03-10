import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  Bed,
  DoorOpen,
  Users,
  Activity,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  UserPlus
} from 'lucide-react';

const DashboardOverview = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await axios.get('/api/hospital/dashboard');
      setDashboardData(response.data);
    } catch (error) {
      toast.error('Failed to load dashboard data');
      console.error('Dashboard error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">Unable to load dashboard data</p>
      </div>
    );
  }

  const { hospital, statistics, recentPatients } = dashboardData;
  const bedOccupancyRate = ((hospital.totalBeds - hospital.availableBeds) / hospital.totalBeds * 100).toFixed(1);
  const roomOccupancyRate = ((hospital.totalRooms - hospital.availableRooms) / hospital.totalRooms * 100).toFixed(1);

  const statCards = [
    {
      title: 'Total Beds',
      value: hospital.totalBeds,
      available: hospital.availableBeds,
      occupied: hospital.totalBeds - hospital.availableBeds,
      icon: Bed,
      color: 'blue',
      percentage: bedOccupancyRate
    },
    {
      title: 'Total Rooms',
      value: hospital.totalRooms,
      available: hospital.availableRooms,
      occupied: hospital.totalRooms - hospital.availableRooms,
      icon: DoorOpen,
      color: 'green',
      percentage: roomOccupancyRate
    },
    {
      title: 'Total Patients',
      value: statistics.totalPatients,
      admitted: statistics.admittedPatients,
      emergency: statistics.emergencyPatients,
      icon: Users,
      color: 'purple'
    },
    {
      title: 'Available Doctors',
      value: `${statistics.availableDoctors}/${statistics.totalDoctors}`,
      icon: Activity,
      color: 'orange'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="text-gray-600">Real-time hospital resource status</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg bg-${stat.color}-100`}>
                  <Icon className={`h-6 w-6 text-${stat.color}-600`} />
                </div>
                {stat.percentage && (
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Occupancy</p>
                    <p className="text-lg font-semibold text-gray-900">{stat.percentage}%</p>
                  </div>
                )}
              </div>
              
              <h3 className="text-sm font-medium text-gray-500 mb-1">{stat.title}</h3>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              
              <div className="mt-3 space-y-1">
                {stat.available !== undefined && (
                  <div className="flex items-center text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                    <span className="text-gray-600">Available: {stat.available}</span>
                  </div>
                )}
                {stat.occupied !== undefined && (
                  <div className="flex items-center text-sm">
                    <AlertCircle className="h-4 w-4 text-red-500 mr-1" />
                    <span className="text-gray-600">Occupied: {stat.occupied}</span>
                  </div>
                )}
                {stat.admitted !== undefined && (
                  <div className="flex items-center text-sm">
                    <UserPlus className="h-4 w-4 text-blue-500 mr-1" />
                    <span className="text-gray-600">Admitted: {stat.admitted}</span>
                  </div>
                )}
                {stat.emergency !== undefined && (
                  <div className="flex items-center text-sm">
                    <AlertCircle className="h-4 w-4 text-red-500 mr-1" />
                    <span className="text-gray-600">Emergency: {stat.emergency}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Patients */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Patients</h2>
          </div>
          <div className="p-6">
            {recentPatients.length > 0 ? (
              <div className="space-y-4">
                {recentPatients.map((patient) => (
                  <div key={patient._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <Users className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">{patient.name}</p>
                        <p className="text-sm text-gray-500">Age: {patient.age} | {patient.contact}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        patient.status === 'admitted' ? 'bg-blue-100 text-blue-800' :
                        patient.status === 'emergency' ? 'bg-red-100 text-red-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {patient.status}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(patient.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No recent patients</p>
            )}
          </div>
        </div>

        {/* Equipment Status */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Equipment Status</h2>
          </div>
          <div className="p-6">
            {hospital.equipment && hospital.equipment.length > 0 ? (
              <div className="space-y-4">
                {hospital.equipment.slice(0, 5).map((equipment) => (
                  <div key={equipment._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{equipment.name}</p>
                      <p className="text-sm text-gray-500">{equipment.type}</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          equipment.status === 'working' ? 'bg-green-100 text-green-800' :
                          equipment.status === 'maintenance' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {equipment.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {equipment.available}/{equipment.total} available
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No equipment registered</p>
            )}
          </div>
        </div>
      </div>

      {/* Departments */}
      {hospital.departments && hospital.departments.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Department Status</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {hospital.departments.map((dept, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-2">{dept.name}</h3>
                  <p className="text-sm text-gray-500 mb-2">Head: {dept.headDoctor}</p>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Beds: {dept.availableBeds}/{dept.beds}</span>
                    <span className={`font-medium ${
                      dept.availableBeds > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {dept.availableBeds > 0 ? 'Available' : 'Full'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardOverview;
