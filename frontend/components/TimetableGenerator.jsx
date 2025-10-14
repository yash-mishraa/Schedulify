'use client';

import { useState, useEffect } from 'react';
import { Alert, AlertDescription } from './ui/alert';
import { Loader2, RefreshCw, AlertCircle, CheckCircle, XCircle, Edit3, Settings, FileText, Download } from 'lucide-react';
import { Button } from './ui/Button';
import axios from 'axios';
import toast from 'react-hot-toast';

import InputForm from './InputForm';
import TimetableDisplay from './TimetableDisplay';
import ExportOptions from './ExportOptions';

const TimetableGenerator = ({ institutionId, institutionData }) => {
  const [timetableData, setTimetableData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationResults, setValidationResults] = useState(null);
  const [activeTab, setActiveTab] = useState('input');
  const [apiStatus, setApiStatus] = useState('checking');
  const [lastPing, setLastPing] = useState(null);
  const [savedFormData, setSavedFormData] = useState(null);

  // Check API connection on component mount
  useEffect(() => {
    checkApiConnection();
    
    const keepAliveInterval = setInterval(() => {
      if (apiStatus === 'connected') {
        pingBackend();
      }
    }, 14 * 60 * 1000);

    return () => clearInterval(keepAliveInterval);
  }, [apiStatus]);

  const pingBackend = async () => {
    try {
      await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/health`, { timeout: 5000 });
      setLastPing(new Date().toLocaleTimeString());
      console.log('Backend keep-alive ping successful');
    } catch (error) {
      console.log('Keep-alive ping failed, backend may be sleeping');
    }
  };

  const checkApiConnection = async () => {
    setApiStatus('checking');
    setError('');
    
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://schedulify-backend-h9ld.onrender.com';
    
    if (!backendUrl) {
      setApiStatus('disconnected');
      setError('Backend URL not configured. Please check environment variables.');
      return;
    }
    
    try {
      toast.loading('Connecting to backend...', { id: 'connection' });
      
      const response = await axios.get(`${backendUrl}/health`, {
        timeout: 30000
      });
      
      if (response.status === 200) {
        setApiStatus('connected');
        setError('');
        toast.success('Connected to backend!', { id: 'connection' });
        setLastPing(new Date().toLocaleTimeString());
      } else {
        throw new Error('Backend responded with non-200 status');
      }
    } catch (err) {
      console.error('API connection error:', err);
      setApiStatus('disconnected');
      
      let errorMessage = 'Backend server is not accessible. ';
      
      if (err.code === 'ECONNABORTED' || err.message.includes('timeout')) {
        errorMessage += 'The service is starting up (this can take 30-60 seconds on free tier). Please wait and try again.';
      } else if (err.response?.status === 503) {
        errorMessage += 'Service temporarily unavailable. The backend is waking up.';
      } else {
        errorMessage += 'Please check if the backend is running and the URL is correct.';
      }
      
      setError(errorMessage);
      toast.error('Connection failed', { id: 'connection' });
    }
  };

  const handleGenerateTimetable = async (formData) => {
    if (apiStatus !== 'connected') {
      toast.error('Backend server is not accessible. Please check connection first.');
      return;
    }

    setSavedFormData(formData);

    setLoading(true);
    setError('');
    
    try {
      toast.loading('Validating input data...', { id: 'generating' });

      const validationResponse = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/timetable/validate`,
        { ...formData, institution_id: institutionId },
        { timeout: 30000 }
      );

      setValidationResults(validationResponse.data);

      if (!validationResponse.data.is_valid) {
        setError('Please fix the validation errors before generating timetable');
        toast.error('Please fix validation errors', { id: 'generating' });
        setLoading(false);
        return;
      }

      toast.loading('Generating optimized timetable... This may take 2-3 minutes.', { id: 'generating' });

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/timetable/generate`,
        { ...formData, institution_id: institutionId },
        { timeout: 300000 }
      );

      const enhancedData = {
        ...response.data,
        constraints: {
          lunch_start: formData.lunch_start,
          lunch_end: formData.lunch_end,
          working_days: formData.working_days,
          start_time: formData.start_time,
          end_time: formData.end_time,
          lecture_duration: formData.lecture_duration
        }
      };

      setTimetableData(enhancedData);
      setActiveTab('timetable');
      toast.success('Timetable generated successfully!', { id: 'generating' });
      
    } catch (err) {
      console.error('Timetable generation error:', err);
      
      let errorMessage;
      if (err.code === 'ECONNABORTED') {
        errorMessage = 'Request timeout. The backend may be processing - please try again in a moment.';
      } else if (err.response?.status === 503) {
        errorMessage = 'Backend service is starting up. Please wait 1-2 minutes and try again.';
      } else {
        errorMessage = err.response?.data?.detail || 'Failed to generate timetable. Please check your backend connection.';
      }
      
      setError(errorMessage);
      toast.error(errorMessage, { id: 'generating' });
    } finally {
      setLoading(false);
    }
  };

  const handleEditTimetable = () => {
    setActiveTab('input');
    toast.success('Switched to edit mode. Modify your settings and regenerate.');
  };

  const getStatusIcon = () => {
    switch (apiStatus) {
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'disconnected':
        return <XCircle className="h-4 w-4 text-red-400" />;
      default:
        return <Loader2 className="h-4 w-4 animate-spin text-yellow-400" />;
    }
  };

  const getStatusText = () => {
    switch (apiStatus) {
      case 'connected':
        return `Server Connected ${lastPing ? `(Last ping: ${lastPing})` : ''}`;
      case 'disconnected':
        return 'Server Offline - Click "Wake Up Backend" below';
      default:
        return 'Checking Connection...';
    }
  };

  const getStatusColor = () => {
    switch (apiStatus) {
      case 'connected':
        return 'status-connected';
      case 'disconnected':
        return 'status-disconnected';
      default:
        return 'status-checking';
    }
  };

  const tabs = [
    {
      id: 'input',
      label: 'Input Configuration',
      icon: Settings,
      disabled: false
    },
    {
      id: 'timetable',
      label: 'Generated Timetable',
      icon: FileText,
      disabled: !timetableData
    },
    {
      id: 'export',
      label: 'Export Options',
      icon: Download,
      disabled: !timetableData
    }
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-4xl font-bold gradient-text mb-2">Schedulify</h1>
        <p className="text-xl text-white/80">AI-Powered Automatic Timetable Generator</p>
      </div>

      {/* Clean Connection Status */}
      <div className="connection-status-bar">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {getStatusIcon()}
            <span className={`px-3 py-1 rounded-lg text-sm font-medium border backdrop-blur-sm ${getStatusColor()}`}>
              {getStatusText()}
            </span>
          </div>
          <div className="flex space-x-2">
            <Button
              onClick={checkApiConnection}
              variant="outline"
              size="sm"
              disabled={apiStatus === 'checking'}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${apiStatus === 'checking' ? 'animate-spin' : ''}`} />
              Check Connection
            </Button>
            {apiStatus === 'disconnected' && (
              <button
                onClick={() => {
                  window.open(`${process.env.NEXT_PUBLIC_API_URL}/health`, '_blank');
                  setTimeout(() => checkApiConnection(), 5000);
                }}
                className="glass-button"
              >
                Wake Up Backend
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-500/20 border border-red-400/50 rounded-lg p-4 backdrop-blur-sm">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-red-300 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-red-200 font-semibold mb-1">Connection Error</h4>
              <p className="text-red-100 text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Validation Results */}
      {validationResults && (
        <div className="space-y-4">
          {validationResults.errors?.length > 0 && (
            <div className="validation-error">
              <h4 className="text-red-200 font-semibold mb-3 flex items-center">
                <XCircle className="h-4 w-4 mr-2" />
                Validation Errors:
              </h4>
              <ul className="space-y-2">
                {validationResults.errors.map((error, index) => (
                  <li key={index} className="text-red-100 text-sm flex items-start">
                    <span className="w-2 h-2 bg-red-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    {error}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {validationResults.warnings?.length > 0 && (
            <div className="bg-yellow-500/20 border border-yellow-400/50 rounded-lg p-4 backdrop-blur-sm">
              <h4 className="text-yellow-200 font-semibold mb-3 flex items-center">
                <AlertCircle className="h-4 w-4 mr-2" />
                Warnings:
              </h4>
              <ul className="space-y-2">
                {validationResults.warnings.map((warning, index) => (
                  <li key={index} className="text-yellow-100 text-sm flex items-start">
                    <span className="w-2 h-2 bg-yellow-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    {warning}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {validationResults.is_valid && (
            <div className="validation-success">
              <div className="text-green-100 flex items-center">
                <CheckCircle className="h-4 w-4 mr-2 text-green-300" />
                All validations passed! Ready to generate timetable.
              </div>
            </div>
          )}
        </div>
      )}

      {/* Professional Main Tabs */}
      <div className="professional-tabs">
        <div className="grid grid-cols-3 gap-1.5">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const isDisabled = tab.disabled;
            
            return (
              <button
                key={tab.id}
                onClick={() => !isDisabled && setActiveTab(tab.id)}
                className={`
                  professional-tab
                  ${isActive ? 'professional-tab-active' : ''}
                  ${isDisabled ? 'professional-tab-disabled' : ''}
                `}
                disabled={isDisabled}
              >
                <div className="flex items-center justify-center space-x-2">
                  <Icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-white/70'}`} />
                  <span className="font-semibold text-sm">
                    {tab.label}
                    {tab.id === 'input' && timetableData && (
                      <Edit3 className="h-3 w-3 ml-1 inline" />
                    )}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="mt-8">
        {activeTab === 'input' && (
          <InputForm 
            onSubmit={handleGenerateTimetable}
            loading={loading}
            validationResults={validationResults}
            apiStatus={apiStatus}
            initialData={savedFormData}
          />
        )}

        {activeTab === 'timetable' && timetableData && (
          <TimetableDisplay 
            data={timetableData}
            institutionId={institutionId}
            onEdit={handleEditTimetable}
          />
        )}

        {activeTab === 'export' && timetableData && (
          <ExportOptions 
            institutionId={institutionId}
            timetableData={timetableData}
          />
        )}
      </div>

      {/* Loading Modal */}
      {loading && (
        <div className="loading-overlay">
          <div className="glass-card p-8 max-w-md mx-4">
            <div className="text-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin mx-auto text-purple-400" />
              <div>
                <h3 className="text-xl font-semibold mb-2 text-white">Generating Timetable</h3>
                <p className="text-white/80 mb-4">
                  Our AI is optimizing your schedule using genetic algorithms...
                </p>
                <div className="text-sm text-white/70">
                  <p>⏳ This process typically takes 2-3 minutes</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimetableGenerator;
