import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  Heart,
  Activity,
  FileText,
  Plus,
  Upload,
  X,
  Calendar,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

const MedicalHistory = () => {
  const [medicalHistory, setMedicalHistory] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newDocument, setNewDocument] = useState({
    title: '',
    type: 'other',
    date: new Date().toISOString().split('T')[0],
    description: '',
    file: null
  });

  const documentTypes = [
    { value: 'prescription', label: 'Prescription' },
    { value: 'lab_result', label: 'Lab Result' },
    { value: 'imaging', label: 'Medical Imaging' },
    { value: 'discharge_summary', label: 'Discharge Summary' },
    { value: 'vaccination', label: 'Vaccination Record' },
    { value: 'other', label: 'Other Document' }
  ];

  useEffect(() => {
    fetchMedicalHistory();
    fetchDocuments();
  }, []);

  const fetchMedicalHistory = async () => {
    try {
      const response = await axios.get('/api/patient/profile');
      const data = response.data;
      setMedicalHistory({
        ...(data.medicalHistory || {
          allergies: [],
          chronicDiseases: [],
          previousSurgeries: [],
          currentMedications: [],
          vaccinations: []
        }),
        emergencyContact: data.emergencyContact || { name: 'N/A', phone: 'N/A', relation: 'N/A' }
      });
      setDocuments(data.documents || []);
    } catch (error) {
      toast.error('Failed to load medical history');
    } finally {
      setLoading(false);
    }
  };

  const fetchDocuments = async () => {
    // Managed alongside fetchMedicalHistory
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }

      // Check file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Only PDF and image files are allowed');
        return;
      }

      setNewDocument({ ...newDocument, file });
    }
  };

  const uploadDocument = async () => {
    if (!newDocument.title || !newDocument.file) {
      toast.error('Please fill all required fields');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('title', newDocument.title);
      formData.append('type', newDocument.type);
      formData.append('date', newDocument.date);
      formData.append('description', newDocument.description);
      formData.append('file', newDocument.file);

      await axios.post('/api/patient/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast.success('Document uploaded successfully');
      setShowUploadModal(false);
      setNewDocument({
        title: '',
        type: 'other',
        date: new Date().toISOString().split('T')[0],
        description: '',
        file: null
      });
      fetchMedicalHistory();
    } catch (error) {
      toast.error('Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const deleteDocument = async (documentId) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      try {
        await axios.delete(`/api/patient/documents/${documentId}`);
        setDocuments(documents.filter(doc => doc._id !== documentId));
        toast.success('Document deleted successfully');
      } catch (error) {
        toast.error('Failed to delete document');
      }
    }
  };

  const getDocumentTypeColor = (type) => {
    switch (type) {
      case 'prescription': return 'bg-blue-100 text-blue-800';
      case 'lab_result': return 'bg-green-100 text-green-800';
      case 'imaging': return 'bg-purple-100 text-purple-800';
      case 'discharge_summary': return 'bg-yellow-100 text-yellow-800';
      case 'vaccination': return 'bg-red-100 text-red-800';
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Medical History</h1>
          <p className="text-gray-600">Your complete medical record and documents</p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="btn btn-primary"
        >
          <Upload className="h-4 w-4 mr-2" />
          Upload Document
        </button>
      </div>

      {/* Medical Information */}
      {medicalHistory && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Medical Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <Heart className="h-6 w-6 text-red-600 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">Medical Information</h2>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Blood Group</h3>
                <span className="inline-block px-3 py-1 bg-red-100 text-red-800 text-sm rounded-full">
                  {medicalHistory.bloodGroup}
                </span>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Allergies</h3>
                <div className="flex flex-wrap gap-2">
                  {medicalHistory.allergies.map((allergy, index) => (
                    <span key={index} className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                      {allergy}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Chronic Diseases</h3>
                <div className="flex flex-wrap gap-2">
                  {medicalHistory.chronicDiseases.map((disease, index) => (
                    <span key={index} className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                      {disease}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Current Medications</h3>
                <ul className="space-y-1">
                  {medicalHistory.currentMedications.map((medication, index) => (
                    <li key={index} className="text-sm text-gray-700 flex items-center">
                      <Activity className="h-3 w-3 mr-2 text-green-600" />
                      {medication}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Emergency Contact & Other Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <AlertCircle className="h-6 w-6 text-yellow-600 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">Emergency Information</h2>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Emergency Contact</h3>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-sm font-medium text-gray-900">{medicalHistory.emergencyContact.name}</p>
                  <p className="text-sm text-gray-600">{medicalHistory.emergencyContact.relation}</p>
                  <p className="text-sm text-gray-600">{medicalHistory.emergencyContact.phone}</p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Previous Surgeries</h3>
                <ul className="space-y-1">
                  {medicalHistory.previousSurgeries.map((surgery, index) => (
                    <li key={index} className="text-sm text-gray-700 flex items-center">
                      <CheckCircle className="h-3 w-3 mr-2 text-blue-600" />
                      {surgery}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Last Checkup</h3>
                <div className="flex items-center text-sm text-gray-700">
                  <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                  {medicalHistory.lastCheckup ? new Date(medicalHistory.lastCheckup).toLocaleDateString() : 'No record'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Vaccination Records */}
      {medicalHistory?.vaccinations && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-4">
            <Activity className="h-6 w-6 text-green-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Vaccination Records</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vaccine Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date Administered
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {medicalHistory.vaccinations.map((vaccine, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {vaccine.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(vaccine.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                        Completed
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Medical Documents */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <FileText className="h-6 w-6 text-blue-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Medical Documents</h2>
          </div>
          <button
            onClick={() => setShowUploadModal(true)}
            className="btn btn-secondary"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Document
          </button>
        </div>

        {documents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents.map((document) => (
              <div key={document._id || document.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 text-blue-600 mr-2" />
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">{document.title}</h3>
                      <p className="text-xs text-gray-500">{document.filename}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getDocumentTypeColor(document.type)}`}>
                    {document.type ? document.type.replace('_', ' ') : 'other'}
                  </span>
                </div>

                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                  {document.description}
                </p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center text-xs text-gray-500">
                    <Calendar className="h-3 w-3 mr-1" />
                    {new Date(document.date).toLocaleDateString()}
                  </div>
                  <div className="flex space-x-2">
                    <button className="text-blue-600 hover:text-blue-800 text-sm">
                      View
                    </button>
                    <button
                      onClick={() => deleteDocument(document._id || document.id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No medical documents uploaded</p>
            <button
              onClick={() => setShowUploadModal(true)}
              className="mt-4 btn btn-primary"
            >
              Upload Your First Document
            </button>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Upload Medical Document</h2>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Document Title *
                </label>
                <input
                  type="text"
                  value={newDocument.title}
                  onChange={(e) => setNewDocument({ ...newDocument, title: e.target.value })}
                  className="input-field"
                  placeholder="Enter document title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Document Type *
                </label>
                <select
                  value={newDocument.type}
                  onChange={(e) => setNewDocument({ ...newDocument, type: e.target.value })}
                  className="input-field"
                >
                  {documentTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date *
                </label>
                <input
                  type="date"
                  value={newDocument.date}
                  onChange={(e) => setNewDocument({ ...newDocument, date: e.target.value })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={newDocument.description}
                  onChange={(e) => setNewDocument({ ...newDocument, description: e.target.value })}
                  className="input-field"
                  rows="3"
                  placeholder="Enter document description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload File * (PDF, JPG, PNG - Max 10MB)
                </label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.gif"
                  onChange={handleFileUpload}
                  className="input-field"
                />
                {newDocument.file && (
                  <p className="mt-2 text-sm text-gray-600">
                    Selected: {newDocument.file.name}
                  </p>
                )}
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={uploadDocument}
                  disabled={uploading}
                  className="btn btn-primary flex-1 disabled:opacity-50"
                >
                  {uploading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Uploading...
                    </div>
                  ) : (
                    'Upload Document'
                  )}
                </button>
                <button
                  onClick={() => setShowUploadModal(false)}
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

export default MedicalHistory;
