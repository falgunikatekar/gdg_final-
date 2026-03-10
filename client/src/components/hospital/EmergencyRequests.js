import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { io } from 'socket.io-client';
import {
  AlertTriangle,
  Phone,
  MapPin,
  Clock,
  Users,
  CheckCircle,
  XCircle,
  Activity,
  Truck,
  Navigation,
  Filter,
  Search,
  Eye,
  MessageSquare,
  Star,
  AlertCircle
} from 'lucide-react';

const EmergencyRequests = () => {
  const [requests, setRequests] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [acceptingRequest, setAcceptingRequest] = useState(null);

  useEffect(() => {
    fetchEmergencyRequests();
    fetchStats();
    
    // Set up real-time notifications
    const socket = io('http://localhost:5001');
    
    socket.on('new-emergency-request', (data) => {
      toast.error(`🚨 ${data.message}`, {
        duration: 5000,
        icon: '🚨'
      });
      fetchEmergencyRequests();
      fetchStats();
    });

    socket.on('emergency-request-updated', (data) => {
      toast(`Emergency request ${data.status}`, {
        icon: data.status === 'accepted' ? '✅' : '🔄'
      });
      fetchEmergencyRequests();
      fetchStats();
    });

    return () => {
      socket.off('new-emergency-request');
      socket.off('emergency-request-updated');
      socket.disconnect();
    };
  }, []);

  const fetchEmergencyRequests = async () => {
    try {
      const response = await axios.get('/api/hospital/emergency');
      setRequests(response.data.requests);
    } catch (error) {
      console.error('Failed to fetch emergency requests:', error);
      toast.error('Failed to load emergency requests');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/hospital/emergency/stats/overview');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const acceptEmergencyRequest = async (requestId) => {
    setAcceptingRequest(requestId);
    try {
      await axios.put(`/api/hospital/emergency/${requestId}/accept`, {
        estimatedArrival: '15 mins',
        notes: 'Ambulance dispatched immediately'
      });
      toast.success('Emergency request accepted');
      fetchEmergencyRequests();
      fetchStats();
    } catch (error) {
      toast.error('Failed to accept request');
    } finally {
      setAcceptingRequest(null);
    }
  };

  const updateRequestStatus = async (requestId, status) => {
    try {
      await axios.put(`/api/hospital/emergency/${requestId}/status`, {
        status,
        notes: `Status updated to ${status}`
      });
      toast.success(`Request status updated to ${status}`);
      fetchEmergencyRequests();
      fetchStats();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-red-100 text-red-800';
      case 'accepted': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <AlertCircle className="h-4 w-4" />;
      case 'accepted': return <CheckCircle className="h-4 w-4" />;
      case 'in_progress': return <Activity className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const filteredRequests = requests.filter(request => {
    const matchesSearch = !searchTerm || 
      request.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const viewRequestDetails = async (requestId) => {
    try {
      const response = await axios.get(`/api/hospital/emergency/${requestId}`);
      setSelectedRequest(response.data);
      setShowDetailsModal(true);
    } catch (error) {
      toast.error('Failed to fetch request details');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Emergency Requests</h1>
          <p className="text-gray-600">Manage and respond to emergency requests</p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600">Pending</p>
              <p className="text-2xl font-bold text-red-900">{stats.pendingRequests || 0}</p>
            </div>
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600">Accepted</p>
              <p className="text-2xl font-bold text-blue-900">{stats.acceptedRequests || 0}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-600">In Progress</p>
              <p className="text-2xl font-bold text-yellow-900">{stats.inProgressRequests || 0}</p>
            </div>
            <Activity className="h-8 w-8 text-yellow-500" />
          </div>
        </div>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600">Completed</p>
              <p className="text-2xl font-bold text-green-900">{stats.completedRequests || 0}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search requests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10"
              />
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-field"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="accepted">Accepted</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        {/* Emergency Requests List */}
        <div className="space-y-4">
          {filteredRequests.map((request) => (
            <div key={request._id} className={`border rounded-lg p-6 hover:shadow-md transition-shadow ${getSeverityColor(request.severity)}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <AlertTriangle className="h-5 w-5 mr-2" />
                    <h3 className="text-lg font-semibold capitalize">
                      {request.type.replace('_', ' ')}
                    </h3>
                    <span className={`ml-3 px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(request.severity)}`}>
                      {request.severity.toUpperCase()}
                    </span>
                    <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(request.status)}`}>
                      {getStatusIcon(request.status)}
                      <span className="ml-1">{request.status.replace('_', ' ')}</span>
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center text-sm">
                      <Users className="h-4 w-4 mr-2" />
                      {request.patientName}
                    </div>
                    <div className="flex items-center text-sm">
                      <MapPin className="h-4 w-4 mr-2" />
                      {request.location} ({request.distance})
                    </div>
                    <div className="flex items-center text-sm">
                      <Phone className="h-4 w-4 mr-2" />
                      {request.contactNumber}
                    </div>
                  </div>

                  <p className="text-sm mb-3">{request.description}</p>
                  
                  {request.symptoms && request.symptoms.length > 0 && (
                    <div className="mb-3">
                      <p className="text-sm font-medium mb-1">Symptoms:</p>
                      <div className="flex flex-wrap gap-1">
                        {request.symptoms.map((symptom, index) => (
                          <span key={index} className="px-2 py-1 bg-white bg-opacity-60 text-xs rounded">
                            {symptom}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center text-sm text-gray-600 space-x-4">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      {new Date(request.createdAt).toLocaleString()}
                    </div>
                    {request.estimatedArrival && (
                      <div className="flex items-center">
                        <Truck className="h-4 w-4 mr-1" />
                        ETA: {request.estimatedArrival}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex space-x-2 ml-4">
                  <button
                    onClick={() => viewRequestDetails(request._id)}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    <Eye className="h-5 w-5" />
                  </button>
                  
                  {request.status === 'pending' && (
                    <button
                      onClick={() => acceptEmergencyRequest(request._id)}
                      disabled={acceptingRequest === request._id}
                      className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 disabled:opacity-50"
                    >
                      {acceptingRequest === request._id ? 'Accepting...' : 'Accept'}
                    </button>
                  )}
                  
                  {request.status === 'accepted' && (
                    <button
                      onClick={() => updateRequestStatus(request._id, 'in_progress')}
                      className="bg-yellow-600 text-white px-3 py-1 rounded text-sm hover:bg-yellow-700"
                    >
                      Start
                    </button>
                  )}
                  
                  {request.status === 'in_progress' && (
                    <button
                      onClick={() => updateRequestStatus(request._id, 'completed')}
                      className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                    >
                      Complete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {filteredRequests.length === 0 && (
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No emergency requests found</p>
            </div>
          )}
        </div>
      </div>

      {/* Request Details Modal */}
      {showDetailsModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Emergency Request Details</h2>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Patient Name</p>
                  <p className="font-medium">{selectedRequest.patientName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Emergency Type</p>
                  <p className="font-medium capitalize">{selectedRequest.type.replace('_', ' ')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Severity</p>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(selectedRequest.severity)}`}>
                    {selectedRequest.severity.toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedRequest.status)}`}>
                    {selectedRequest.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-gray-500 mb-2">Description</p>
                <p className="text-gray-900">{selectedRequest.description}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Location</p>
                  <p className="font-medium">{selectedRequest.location}</p>
                  <p className="text-sm text-gray-600">Distance: {selectedRequest.distance}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Contact</p>
                  <p className="font-medium">{selectedRequest.contactNumber}</p>
                </div>
              </div>
              
              {selectedRequest.symptoms && selectedRequest.symptoms.length > 0 && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">Symptoms</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedRequest.symptoms.map((symptom, index) => (
                      <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                        {symptom}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Requested At</p>
                  <p className="font-medium">{new Date(selectedRequest.createdAt).toLocaleString()}</p>
                </div>
                {selectedRequest.estimatedArrival && (
                  <div>
                    <p className="text-sm text-gray-500">Estimated Arrival</p>
                    <p className="font-medium">{selectedRequest.estimatedArrival}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmergencyRequests;
