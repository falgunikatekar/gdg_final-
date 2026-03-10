import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  FileText,
  Upload,
  Download,
  Eye,
  Trash2,
  Plus,
  Search,
  Filter,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  X,
  Loader,
  Image as ImageIcon
} from 'lucide-react';

const ReportManagement = () => {
  const [reports, setReports] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState({});

  const [newReport, setNewReport] = useState({
    patientId: '',
    type: 'blood_test',
    title: '',
    description: '',
    testDate: new Date().toISOString().split('T')[0],
    images: []
  });

  const reportTypes = [
    { value: 'blood_test', label: 'Blood Test' },
    { value: 'x_ray', label: 'X-Ray' },
    { value: 'mri', label: 'MRI' },
    { value: 'ct_scan', label: 'CT Scan' },
    { value: 'ultrasound', label: 'Ultrasound' },
    { value: 'ecg', label: 'ECG' },
    { value: 'general_checkup', label: 'General Checkup' },
    { value: 'pathology', label: 'Pathology' }
  ];

  useEffect(() => {
    fetchReports();
    fetchPatients();
  }, [statusFilter, typeFilter]);

  const fetchReports = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (typeFilter) params.append('type', typeFilter);
      
      const response = await axios.get(`/api/reports?${params}`);
      setReports(response.data.reports);
    } catch (error) {
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const fetchPatients = async () => {
    try {
      const response = await axios.get('/api/hospital/patients');
      setPatients(response.data.patients);
    } catch (error) {
      console.error('Failed to load patients:', error);
    }
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 5) {
      toast.error('Maximum 5 images allowed');
      return;
    }
    setNewReport({ ...newReport, images: files });
  };

  const uploadReport = async () => {
    if (!newReport.patientId || !newReport.title || newReport.images.length === 0) {
      toast.error('Please fill all required fields and upload at least one image');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('patientId', newReport.patientId);
      formData.append('type', newReport.type);
      formData.append('title', newReport.title);
      formData.append('description', newReport.description);
      formData.append('testDate', newReport.testDate);
      
      newReport.images.forEach(image => {
        formData.append('images', image);
      });

      const response = await axios.post('/api/reports/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast.success('Report uploaded successfully');
      setShowUploadModal(false);
      setNewReport({
        patientId: '',
        type: 'blood_test',
        title: '',
        description: '',
        testDate: new Date().toISOString().split('T')[0],
        images: []
      });
      fetchReports();
    } catch (error) {
      toast.error('Failed to upload report');
    } finally {
      setUploading(false);
    }
  };

  const generateSummary = async (reportId) => {
    setGenerating({ ...generating, [reportId]: true });
    try {
      await axios.post(`/api/reports/${reportId}/generate-summary`);
      toast.success('Report summary generated successfully');
      fetchReports();
    } catch (error) {
      toast.error('Failed to generate summary');
    } finally {
      setGenerating({ ...generating, [reportId]: false });
    }
  };

  const downloadReport = async (reportId) => {
    try {
      const response = await axios.get(`/api/reports/${reportId}/download`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `medical-report-${reportId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('Report downloaded successfully');
    } catch (error) {
      toast.error('Failed to download report');
    }
  };

  const deleteReport = async (reportId) => {
    if (window.confirm('Are you sure you want to delete this report?')) {
      try {
        await axios.delete(`/api/reports/${reportId}`);
        toast.success('Report deleted successfully');
        fetchReports();
      } catch (error) {
        toast.error('Failed to delete report');
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'reviewed': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'processing': return <Loader className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'reviewed': return <Eye className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const filteredReports = reports.filter(report => {
    const matchesSearch = !searchTerm || 
      report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.type.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Report Management</h1>
        <p className="text-gray-600">Generate and manage patient medical reports</p>
      </div>

      {/* Header Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search reports..."
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
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="reviewed">Reviewed</option>
            </select>
            
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="input-field"
            >
              <option value="">All Types</option>
              {reportTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setShowUploadModal(true)}
            className="btn btn-primary"
          >
            <Plus className="h-4 w-4 mr-2" />
            Upload Report
          </button>
        </div>

        {/* Reports Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Report Info
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Patient
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Test Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Images
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredReports.map((report) => (
                <tr key={report._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm">
                      <div className="font-medium text-gray-900">{report.title}</div>
                      <div className="text-gray-500 capitalize">{report.type.replace('_', ' ')}</div>
                      {report.description && (
                        <div className="text-gray-400 text-xs truncate max-w-xs">
                          {report.description}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm">
                      <div className="font-medium text-gray-900">{report.patient.name}</div>
                      <div className="text-gray-500">Age: {report.patient.age}</div>
                      <div className="text-gray-500">{report.patient.contact}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(report.testDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(report.status)}`}>
                      {getStatusIcon(report.status)}
                      <span className="ml-1">{report.status}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center">
                      <ImageIcon className="h-4 w-4 mr-1" />
                      {report.images.length}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => {
                        setSelectedReport(report);
                        setShowDetailsModal(true);
                      }}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    
                    {report.status === 'processing' && (
                      <button
                        onClick={() => generateSummary(report._id)}
                        disabled={generating[report._id]}
                        className="text-green-600 hover:text-green-900 disabled:opacity-50"
                      >
                        {generating[report._id] ? (
                          <Loader className="h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle className="h-4 w-4" />
                        )}
                      </button>
                    )}
                    
                    {report.status === 'completed' && report.pdfReport && (
                      <button
                        onClick={() => downloadReport(report._id)}
                        className="text-purple-600 hover:text-purple-900"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                    )}
                    
                    <button
                      onClick={() => deleteReport(report._id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredReports.length === 0 && (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No reports found</p>
            </div>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Upload Medical Report</h2>
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
                  Patient *
                </label>
                <select
                  value={newReport.patientId}
                  onChange={(e) => setNewReport({...newReport, patientId: e.target.value})}
                  className="input-field"
                >
                  <option value="">Select Patient</option>
                  {patients.map(patient => (
                    <option key={patient._id} value={patient._id}>
                      {patient.name} - {patient.age} years
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Report Type *
                </label>
                <select
                  value={newReport.type}
                  onChange={(e) => setNewReport({...newReport, type: e.target.value})}
                  className="input-field"
                >
                  {reportTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Report Title *
                </label>
                <input
                  type="text"
                  value={newReport.title}
                  onChange={(e) => setNewReport({...newReport, title: e.target.value})}
                  className="input-field"
                  placeholder="Enter report title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Test Date *
                </label>
                <input
                  type="date"
                  value={newReport.testDate}
                  onChange={(e) => setNewReport({...newReport, testDate: e.target.value})}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={newReport.description}
                  onChange={(e) => setNewReport({...newReport, description: e.target.value})}
                  className="input-field"
                  rows="3"
                  placeholder="Enter report description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Images * (Max 5 images)
                </label>
                <input
                  type="file"
                  multiple
                  accept="image/*,.pdf,.doc,.docx"
                  onChange={handleImageUpload}
                  className="input-field"
                />
                {newReport.images.length > 0 && (
                  <div className="mt-2 text-sm text-gray-600">
                    {newReport.images.length} file(s) selected
                  </div>
                )}
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={uploadReport}
                  disabled={uploading}
                  className="btn btn-primary disabled:opacity-50"
                >
                  {uploading ? (
                    <div className="flex items-center">
                      <Loader className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Report
                    </div>
                  )}
                </button>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Report Details Modal */}
      {showDetailsModal && selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Report Details</h2>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Report Information</h3>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">Title:</span> {selectedReport.title}
                    </p>
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">Type:</span> {selectedReport.type.replace('_', ' ')}
                    </p>
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">Test Date:</span> {new Date(selectedReport.testDate).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">Status:</span>
                      <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedReport.status)}`}>
                        {selectedReport.status}
                      </span>
                    </p>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Patient Information</h3>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">Name:</span> {selectedReport.patient.name}
                    </p>
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">Age:</span> {selectedReport.patient.age}
                    </p>
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">Contact:</span> {selectedReport.patient.contact}
                    </p>
                  </div>
                </div>
              </div>

              {selectedReport.description && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Description</h3>
                  <p className="text-sm text-gray-900">{selectedReport.description}</p>
                </div>
              )}

              {selectedReport.images && selectedReport.images.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Uploaded Images</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {selectedReport.images.map((image, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-2">
                        <div className="aspect-square bg-gray-100 rounded flex items-center justify-center">
                          {image.mimetype.startsWith('image/') ? (
                            <img
                              src={`/uploads/reports/${image.filename}`}
                              alt={image.originalName}
                              className="max-w-full max-h-full object-contain"
                            />
                          ) : (
                            <FileText className="h-8 w-8 text-gray-400" />
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1 truncate">{image.originalName}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedReport.results && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Test Results</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div className="flex items-center">
                      <span className="font-medium">Result Status:</span>
                      <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${
                        selectedReport.results.normal ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {selectedReport.results.normal ? 'Normal' : 'Abnormal'}
                      </span>
                    </div>
                    
                    <div>
                      <span className="font-medium">Summary:</span>
                      <p className="text-sm text-gray-700 mt-1">{selectedReport.results.summary}</p>
                    </div>
                    
                    <div>
                      <span className="font-medium">Details:</span>
                      <p className="text-sm text-gray-700 mt-1">{selectedReport.results.details}</p>
                    </div>
                    
                    <div>
                      <span className="font-medium">Recommendations:</span>
                      <p className="text-sm text-gray-700 mt-1">{selectedReport.results.recommendations}</p>
                    </div>

                    {selectedReport.results.parameters && selectedReport.results.parameters.length > 0 && (
                      <div>
                        <span className="font-medium">Parameters:</span>
                        <div className="mt-2 space-y-1">
                          {selectedReport.results.parameters.map((param, index) => (
                            <div key={index} className="flex justify-between text-sm">
                              <span>{param.name}: {param.value} {param.unit}</span>
                              <span className={`px-2 py-1 text-xs rounded ${
                                param.status === 'normal' ? 'bg-green-100 text-green-800' :
                                param.status === 'high' ? 'bg-red-100 text-red-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {param.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportManagement;
