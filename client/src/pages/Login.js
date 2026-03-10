import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Building, User, Stethoscope, Heart, Mail, Lock, Phone, Calendar, FileText } from 'lucide-react';

const Login = () => {
  const [userType, setUserType] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch
  } = useForm();

  const selectedUserType = watch('userType');

  const onUserTypeSelect = (type) => {
    setUserType(type);
    reset();
  };

  const onSubmit = async (data) => {
    setIsLoading(true);
    
    try {
      const loginData = {
        userType: data.userType,
        ...(data.userType === 'hospital' 
          ? { username: data.username, password: data.password }
          : { 
              patientData: {
                name: data.name,
                age: parseInt(data.age),
                gender: data.gender,
                contact: data.contact,
                email: data.email,
                address: data.address,
                emergencyContact: {
                  name: data.emergencyName,
                  phone: data.emergencyPhone,
                  relation: data.emergencyRelation
                },
                medicalHistory: {
                  bloodGroup: data.bloodGroup,
                  allergies: data.allergies ? data.allergies.split(',').map(a => a.trim()) : [],
                  chronicDiseases: data.chronicDiseases ? data.chronicDiseases.split(',').map(d => d.trim()) : [],
                  previousSurgeries: data.previousSurgeries ? data.previousSurgeries.split(',').map(s => s.trim()) : [],
                  currentMedications: data.currentMedications ? data.currentMedications.split(',').map(m => m.trim()) : []
                },
                currentIssue: data.currentIssue,
                ongoingTreatments: data.ongoingTreatments ? data.ongoingTreatments.split(',').map(t => t.trim()) : []
              }
            })
      };

      const result = await login(loginData);
      
      if (result.success) {
        toast.success(`Welcome, ${result.user.name}!`);
        navigate(`/${result.user.type}`);
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!userType) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="max-w-4xl w-full">
          <div className="text-center mb-12">
            <div className="flex justify-center items-center mb-4">
              <Heart className="h-12 w-12 text-red-500 mr-3" />
              <h1 className="text-4xl font-bold text-gray-900">Clini Connect</h1>
            </div>
            <p className="text-lg text-gray-600">Real-time emergency resource allocation system</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <button
              onClick={() => onUserTypeSelect('hospital')}
              className="group bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="flex flex-col items-center">
                <div className="bg-blue-100 rounded-full p-4 mb-4 group-hover:bg-blue-200 transition-colors">
                  <Building className="h-8 w-8 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Hospital Staff</h2>
                <p className="text-gray-600 text-center mb-4">
                  Access hospital dashboard, manage resources, track inventory, and handle patient appointments
                </p>
                <div className="flex items-center text-blue-600 font-medium group-hover:text-blue-700">
                  Continue as Hospital
                  <Stethoscope className="ml-2 h-4 w-4" />
                </div>
              </div>
            </button>

            <button
              onClick={() => onUserTypeSelect('patient')}
              className="group bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="flex flex-col items-center">
                <div className="bg-green-100 rounded-full p-4 mb-4 group-hover:bg-green-200 transition-colors">
                  <User className="h-8 w-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Patient</h2>
                <p className="text-gray-600 text-center mb-4">
                  Book appointments, view medical reports, upload documents, and track your medical history
                </p>
                <div className="flex items-center text-green-600 font-medium group-hover:text-green-700">
                  Continue as Patient
                  <Heart className="ml-2 h-4 w-4" />
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <button
            onClick={() => setUserType('')}
            className="mb-4 text-gray-600 hover:text-gray-800 flex items-center mx-auto"
          >
            ← Back to selection
          </button>
          <div className="flex justify-center items-center mb-4">
            {userType === 'hospital' ? (
              <Building className="h-10 w-10 text-blue-600 mr-3" />
            ) : (
              <User className="h-10 w-10 text-green-600 mr-3" />
            )}
            <h1 className="text-3xl font-bold text-gray-900">
              {userType === 'hospital' ? 'Hospital Login' : 'Patient Access'}
            </h1>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-xl shadow-lg p-8">
          <input
            type="hidden"
            {...register('userType', { required: true })}
            value={userType}
          />

          {userType === 'hospital' ? (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Username
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    {...register('username', { required: 'Username is required' })}
                    type="text"
                    className="input-field pl-10"
                    placeholder="Enter your username"
                  />
                </div>
                {errors.username && (
                  <p className="mt-1 text-sm text-red-600">{errors.username.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    {...register('password', { required: 'Password is required' })}
                    type="password"
                    className="input-field pl-10"
                    placeholder="Enter your password"
                  />
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    {...register('name', { required: 'Name is required' })}
                    type="text"
                    className="input-field"
                    placeholder="John Doe"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Age *
                  </label>
                  <input
                    {...register('age', { required: 'Age is required' })}
                    type="number"
                    className="input-field"
                    placeholder="25"
                  />
                  {errors.age && (
                    <p className="mt-1 text-sm text-red-600">{errors.age.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Gender *
                  </label>
                  <select {...register('gender', { required: 'Gender is required' })} className="input-field">
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                  {errors.gender && (
                    <p className="mt-1 text-sm text-red-600">{errors.gender.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact *
                  </label>
                  <input
                    {...register('contact', { required: 'Contact is required' })}
                    type="tel"
                    className="input-field"
                    placeholder="+1234567890"
                  />
                  {errors.contact && (
                    <p className="mt-1 text-sm text-red-600">{errors.contact.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  {...register('email')}
                  type="email"
                  className="input-field"
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address *
                </label>
                <input
                  {...register('address', { required: 'Address is required' })}
                  type="text"
                  className="input-field"
                  placeholder="123 Main St, City"
                />
                {errors.address && (
                  <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Medical Issue *
                </label>
                <textarea
                  {...register('currentIssue', { required: 'Medical issue is required' })}
                  className="input-field"
                  rows="3"
                  placeholder="Describe your current medical issue..."
                />
                {errors.currentIssue && (
                  <p className="mt-1 text-sm text-red-600">{errors.currentIssue.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Blood Group
                  </label>
                  <select {...register('bloodGroup')} className="input-field">
                    <option value="">Select</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Allergies (comma separated)
                  </label>
                  <input
                    {...register('allergies')}
                    type="text"
                    className="input-field"
                    placeholder="Penicillin, Peanuts"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ongoing Treatments (comma separated)
                </label>
                <input
                  {...register('ongoingTreatments')}
                  type="text"
                  className="input-field"
                  placeholder="Physiotherapy, Medication"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full btn btn-primary mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Processing...
              </div>
            ) : (
              userType === 'hospital' ? 'Login to Hospital' : 'Access Patient Portal'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
