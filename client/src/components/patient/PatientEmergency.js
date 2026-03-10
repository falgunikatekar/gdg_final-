import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  Phone,
  MapPin,
  Clock,
  AlertTriangle,
  Truck,
  Users,
  Heart,
  Activity,
  CheckCircle,
  XCircle,
  Send,
  AlertCircle,
  Building,
  User,
  Calendar,
  MessageSquare
} from 'lucide-react';

const PatientEmergency = () => {
  const [emergencyContacts, setEmergencyContacts] = useState([]);
  const [nearbyHospitals, setNearbyHospitals] = useState([]);
  const [emergencyRequests, setEmergencyRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [requestingHelp, setRequestingHelp] = useState(false);

  const [emergencyRequest, setEmergencyRequest] = useState({
    type: 'medical',
    severity: 'medium',
    description: '',
    location: '',
    contactNumber: '',
    symptoms: [],
    additionalInfo: ''
  });

  const [newContact, setNewContact] = useState({
    name: '',
    relationship: '',
    phone: '',
    email: '',
    isPrimary: false
  });

  const emergencyTypes = [
    { value: 'medical', label: 'Medical Emergency', icon: Heart, color: 'red' },
    { value: 'accident', label: 'Accident', icon: AlertTriangle, color: 'orange' },
    { value: 'cardiac', label: 'Cardiac Emergency', icon: Activity, color: 'red' },
    { value: 'respiratory', label: 'Breathing Difficulty', icon: AlertCircle, color: 'blue' },
    { value: 'injury', label: 'Injury/Trauma', icon: AlertTriangle, color: 'purple' },
    { value: 'other', label: 'Other Emergency', icon: MessageSquare, color: 'gray' }
  ];

  const severityLevels = [
    { value: 'low', label: 'Low Priority', color: 'green' },
    { value: 'medium', label: 'Medium Priority', color: 'yellow' },
    { value: 'high', label: 'High Priority', color: 'orange' },
    { value: 'critical', label: 'Critical', color: 'red' }
  ];

  const commonSymptoms = [
    'Chest Pain', 'Difficulty Breathing', 'Severe Bleeding', 'Loss of Consciousness',
    'Severe Pain', 'Head Injury', 'Burns', 'Fractures', 'Allergic Reaction', 'Stroke Symptoms'
  ];

  useEffect(() => {
    fetchEmergencyData();
  }, []);

  const fetchEmergencyData = async () => {
    try {
      const [contactsRes, hospitalsRes, requestsRes] = await Promise.all([
        axios.get('/api/patient/emergency-contacts'),
        axios.get('/api/patient/nearby-hospitals'),
        axios.get('/api/patient/emergency-requests')
      ]);

      setEmergencyContacts(contactsRes.data.contacts);
      setNearbyHospitals(hospitalsRes.data.hospitals);
      setEmergencyRequests(requestsRes.data.requests);
    } catch (error) {
      console.error('Failed to load emergency data:', error);
    } finally {
      setLoading(false);
    }
  };

  const requestEmergencyHelp = async () => {
    if (!emergencyRequest.description || !emergencyRequest.location || !emergencyRequest.contactNumber) {
      toast.error('Please fill all required fields');
      return;
    }

    setRequestingHelp(true);
    try {
      const response = await axios.post('/api/patient/emergency-request', emergencyRequest);
      toast.success('Emergency help requested successfully');
      setShowEmergencyModal(false);
      setEmergencyRequest({
        type: 'medical',
        severity: 'medium',
        description: '',
        location: '',
        contactNumber: '',
        symptoms: [],
        additionalInfo: ''
      });
      fetchEmergencyData();
    } catch (error) {
      toast.error('Failed to request emergency help');
    } finally {
      setRequestingHelp(false);
    }
  };

  const addEmergencyContact = async () => {
    if (!newContact.name || !newContact.phone || !newContact.relationship) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      const response = await axios.post('/api/patient/emergency-contacts', newContact);
      toast.success('Emergency contact added successfully');
      setShowContactModal(false);
      setNewContact({
        name: '',
        relationship: '',
        phone: '',
        email: '',
        isPrimary: false
      });
      fetchEmergencyData();
    } catch (error) {
      toast.error('Failed to add emergency contact');
    }
  };

  const deleteEmergencyContact = async (contactId) => {
    try {
      await axios.delete(`/api/patient/emergency-contacts/${contactId}`);
      toast.success('Emergency contact deleted successfully');
      fetchEmergencyData();
    } catch (error) {
      toast.error('Failed to delete emergency contact');
    }
  };

  const handleSymptomToggle = (symptom) => {
    setEmergencyRequest(prev => ({
      ...prev,
      symptoms: prev.symptoms.includes(symptom)
        ? prev.symptoms.filter(s => s !== symptom)
        : [...prev.symptoms, symptom]
    }));
  };

  const getSeverityColor = (severity) => {
    const level = severityLevels.find(l => l.value === severity);
    return level ? level.color : 'gray';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'accepted': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-orange-100 text-orange-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const callEmergency = (phoneNumber) => {
    window.location.href = `tel:${phoneNumber}`;
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setEmergencyRequest(prev => ({
            ...prev,
            location: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
          }));
        },
        (error) => {
          toast.error('Unable to get your location');
        }
      );
    } else {
      toast.error('Geolocation is not supported by your browser');
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
          <h1 className="text-2xl font-bold text-gray-900">Emergency Services</h1>
          <p className="text-gray-600">Quick access to emergency help and contacts</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowContactModal(true)}
            className="btn btn-secondary flex items-center"
          >
            <Users className="h-4 w-4 mr-2" />
            Add Contact
          </button>
          <button
            onClick={() => setShowEmergencyModal(true)}
            className="btn btn-danger flex items-center"
          >
            <Truck className="h-4 w-4 mr-2" />
            Request Help
          </button>
        </div>
      </div>

      {/* Emergency Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <Phone className="h-8 w-8 text-red-600 mr-3" />
            <h3 className="text-lg font-semibold text-red-900">Emergency Hotline</h3>
          </div>
          <button
            onClick={() => callEmergency('911')}
            className="w-full bg-red-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-red-700 transition-colors"
          >
            Call 911
          </button>
          <p className="text-sm text-red-700 mt-2">For immediate medical emergencies</p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <Building className="h-8 w-8 text-blue-600 mr-3" />
            <h3 className="text-lg font-semibold text-blue-900">Nearest Hospital</h3>
          </div>
          {nearbyHospitals.length > 0 && (
            <div>
              <p className="font-medium text-blue-900">{nearbyHospitals[0].name}</p>
              <p className="text-sm text-blue-700">{nearbyHospitals[0].distance} away</p>
              <button
                onClick={() => callEmergency(nearbyHospitals[0].phone)}
                className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Call Hospital
              </button>
            </div>
          )}
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <Users className="h-8 w-8 text-green-600 mr-3" />
            <h3 className="text-lg font-semibold text-green-900">Emergency Contacts</h3>
          </div>
          {emergencyContacts.length > 0 && (
            <div>
              <p className="font-medium text-green-900">{emergencyContacts[0].name}</p>
              <p className="text-sm text-green-700">{emergencyContacts[0].relationship}</p>
              <button
                onClick={() => callEmergency(emergencyContacts[0].phone)}
                className="mt-2 text-green-600 hover:text-green-800 text-sm font-medium"
              >
                Call Contact
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Specialized Helplines */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Specialized Helplines for Safety and Support</h2>
          <p className="text-sm text-gray-600 mt-1">24/7 emergency helplines for specific situations</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Women's Helpline */}
            <div className="bg-pink-50 border border-pink-200 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <div className="bg-pink-100 rounded-full p-2 mr-3">
                  <Users className="h-5 w-5 text-pink-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-pink-900">Women's Helpline</h4>
                  <p className="text-sm text-pink-700">1091</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-3">For women facing harassment or danger</p>
              <button
                onClick={() => callEmergency('1091')}
                className="w-full bg-pink-600 text-white py-2 px-4 rounded font-medium hover:bg-pink-700 transition-colors"
              >
                Call 1091
              </button>
            </div>

            {/* Child Helpline */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <div className="bg-purple-100 rounded-full p-2 mr-3">
                  <Heart className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-purple-900">Child Helpline</h4>
                  <p className="text-sm text-purple-700">1098</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-3">To report child abuse or support children in distress</p>
              <button
                onClick={() => callEmergency('1098')}
                className="w-full bg-purple-600 text-white py-2 px-4 rounded font-medium hover:bg-purple-700 transition-colors"
              >
                Call 1098
              </button>
            </div>

            {/* Disaster Management */}
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <div className="bg-orange-100 rounded-full p-2 mr-3">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-orange-900">Disaster Management</h4>
                  <p className="text-sm text-orange-700">1078</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-3">For floods, earthquakes, or other calamities</p>
              <button
                onClick={() => callEmergency('1078')}
                className="w-full bg-orange-600 text-white py-2 px-4 rounded font-medium hover:bg-orange-700 transition-colors"
              >
                Call 1078
              </button>
            </div>

            {/* Railway Helpline */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <div className="bg-blue-100 rounded-full p-2 mr-3">
                  <Phone className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-blue-900">Railway Helpline</h4>
                  <p className="text-sm text-blue-700">139</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-3">For assistance during train journeys</p>
              <button
                onClick={() => callEmergency('139')}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded font-medium hover:bg-blue-700 transition-colors"
              >
                Call 139
              </button>
            </div>

            {/* Cyber Crime */}
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <div className="bg-indigo-100 rounded-full p-2 mr-3">
                  <AlertCircle className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-indigo-900">Cyber Crime</h4>
                  <p className="text-sm text-indigo-700">1930</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-3">To report online fraud, scams, or digital threats</p>
              <button
                onClick={() => callEmergency('1930')}
                className="w-full bg-indigo-600 text-white py-2 px-4 rounded font-medium hover:bg-indigo-700 transition-colors"
              >
                Call 1930
              </button>
            </div>

            {/* Ambulance Services */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <div className="bg-red-100 rounded-full p-2 mr-3">
                  <Truck className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-red-900">Ambulance Services</h4>
                  <p className="text-sm text-red-700">102 / 108</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-3">102 for free ambulance (pregnant women & children), 108 for medical emergencies</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => callEmergency('102')}
                  className="bg-red-600 text-white py-2 px-3 rounded text-sm font-medium hover:bg-red-700 transition-colors"
                >
                  Call 102
                </button>
                <button
                  onClick={() => callEmergency('108')}
                  className="bg-red-600 text-white py-2 px-3 rounded text-sm font-medium hover:bg-red-700 transition-colors"
                >
                  Call 108
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Emergency Requests */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">My Emergency Requests</h2>
        </div>
        <div className="p-6">
          {emergencyRequests.length > 0 ? (
            <div className="space-y-4">
              {emergencyRequests.map((request) => (
                <div key={request._id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <div className={`w-3 h-3 rounded-full bg-${getSeverityColor(request.severity)}-500 mr-2`}></div>
                        <h3 className="font-medium text-gray-900">
                          {request.type.replace('_', ' ').toUpperCase()}
                        </h3>
                        <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(request.status)}`}>
                          {request.status.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-gray-600 mb-2">{request.description}</p>
                      <div className="flex items-center text-sm text-gray-500 space-x-4">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {new Date(request.createdAt).toLocaleDateString()}
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {new Date(request.createdAt).toLocaleTimeString()}
                        </div>
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1" />
                          {request.location}
                        </div>
                      </div>
                      {request.symptoms && request.symptoms.length > 0 && (
                        <div className="mt-2">
                          <p className="text-sm font-medium text-gray-700">Symptoms:</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {request.symptoms.map((symptom, index) => (
                              <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                                {symptom}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex space-x-2 ml-4">
                      {request.status === 'pending' && (
                        <button
                          onClick={() => callEmergency(request.contactNumber)}
                          className="text-green-600 hover:text-green-900"
                        >
                          <Phone className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No emergency requests found</p>
            </div>
          )}
        </div>
      </div>

      {/* Emergency Contacts */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Emergency Contacts</h2>
        </div>
        <div className="p-6">
          {emergencyContacts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {emergencyContacts.map((contact) => (
                <div key={contact._id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <User className="h-5 w-5 text-gray-400 mr-2" />
                        <h3 className="font-medium text-gray-900">{contact.name}</h3>
                        {contact.isPrimary && (
                          <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">Primary</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-1">{contact.relationship}</p>
                      <p className="text-sm text-gray-600 mb-1">{contact.phone}</p>
                      {contact.email && (
                        <p className="text-sm text-gray-600">{contact.email}</p>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => callEmergency(contact.phone)}
                        className="text-green-600 hover:text-green-900"
                      >
                        <Phone className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => deleteEmergencyContact(contact._id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <XCircle className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No emergency contacts found</p>
              <button
                onClick={() => setShowContactModal(true)}
                className="mt-4 btn btn-primary"
              >
                Add Emergency Contact
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Emergency Request Modal */}
      {showEmergencyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Request Emergency Help</h2>
                <button
                  onClick={() => setShowEmergencyModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Emergency Type *
                  </label>
                  <select
                    value={emergencyRequest.type}
                    onChange={(e) => setEmergencyRequest({...emergencyRequest, type: e.target.value})}
                    className="input-field"
                  >
                    {emergencyTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Severity Level *
                  </label>
                  <select
                    value={emergencyRequest.severity}
                    onChange={(e) => setEmergencyRequest({...emergencyRequest, severity: e.target.value})}
                    className="input-field"
                  >
                    {severityLevels.map(level => (
                      <option key={level.value} value={level.value}>
                        {level.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  value={emergencyRequest.description}
                  onChange={(e) => setEmergencyRequest({...emergencyRequest, description: e.target.value})}
                  rows={4}
                  placeholder="Describe your emergency situation..."
                  className="input-field"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Number *
                  </label>
                  <input
                    type="tel"
                    value={emergencyRequest.contactNumber}
                    onChange={(e) => setEmergencyRequest({...emergencyRequest, contactNumber: e.target.value})}
                    placeholder="Your phone number"
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location *
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={emergencyRequest.location}
                      onChange={(e) => setEmergencyRequest({...emergencyRequest, location: e.target.value})}
                      placeholder="Your current location"
                      className="input-field flex-1"
                    />
                    <button
                      type="button"
                      onClick={getCurrentLocation}
                      className="px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                    >
                      <MapPin className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Symptoms
                </label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-3">
                  {commonSymptoms.map(symptom => (
                    <button
                      key={symptom}
                      type="button"
                      onClick={() => handleSymptomToggle(symptom)}
                      className={`px-3 py-2 text-xs rounded-full border transition-colors ${
                        emergencyRequest.symptoms.includes(symptom)
                          ? 'bg-red-500 text-white border-red-500'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {symptom}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Information
                </label>
                <textarea
                  value={emergencyRequest.additionalInfo}
                  onChange={(e) => setEmergencyRequest({...emergencyRequest, additionalInfo: e.target.value})}
                  rows={3}
                  placeholder="Any additional information that might help..."
                  className="input-field"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={requestEmergencyHelp}
                  disabled={requestingHelp}
                  className="btn btn-danger flex-1 disabled:opacity-50"
                >
                  {requestingHelp ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Requesting...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <Send className="h-4 w-4 mr-2" />
                      Request Emergency Help
                    </div>
                  )}
                </button>
                <button
                  onClick={() => setShowEmergencyModal(false)}
                  className="btn btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Contact Modal */}
      {showContactModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Add Emergency Contact</h2>
                <button
                  onClick={() => setShowContactModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  value={newContact.name}
                  onChange={(e) => setNewContact({...newContact, name: e.target.value})}
                  placeholder="Contact person name"
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Relationship *
                </label>
                <input
                  type="text"
                  value={newContact.relationship}
                  onChange={(e) => setNewContact({...newContact, relationship: e.target.value})}
                  placeholder="e.g., Spouse, Parent, Friend"
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={newContact.phone}
                  onChange={(e) => setNewContact({...newContact, phone: e.target.value})}
                  placeholder="Phone number"
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={newContact.email}
                  onChange={(e) => setNewContact({...newContact, email: e.target.value})}
                  placeholder="Email address (optional)"
                  className="input-field"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isPrimary"
                  checked={newContact.isPrimary}
                  onChange={(e) => setNewContact({...newContact, isPrimary: e.target.checked})}
                  className="mr-2"
                />
                <label htmlFor="isPrimary" className="text-sm text-gray-700">
                  Set as primary emergency contact
                </label>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={addEmergencyContact}
                  className="btn btn-primary flex-1"
                >
                  Add Contact
                </button>
                <button
                  onClick={() => setShowContactModal(false)}
                  className="btn btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientEmergency;
