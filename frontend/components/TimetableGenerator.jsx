'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/Button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { Alert, AlertDescription } from './ui/alert';
import { Loader2, RefreshCw, AlertCircle, CheckCircle, XCircle, Edit3 } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

import InputForm from './InputForm';
import TimetableDisplay from './TimetableDisplay';
import ExportOptions from './ExportOptions';

const TimetableGenerator = ({ institutionId }) => {
  const [timetableData, setTimetableData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationResults, setValidationResults] = useState(null);
  const [activeTab, setActiveTab] = useState('input');
  const [apiStatus, setApiStatus] = useState('checking');
  const [lastPing, setLastPing] = useState(null);
  const [savedFormData, setSavedFormData] = useState(null); // Store form data for editing

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

    // Save form data for future editing
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

      // Add constraints to the response data for lunch break display
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

  // Handle edit functionality
  const handleEditTimetable = () => {
    setActiveTab('input');
    toast.success('Switched to edit mode. Modify your settings and regenerate.');
  };

  const getStatusIcon = () => {
    switch (apiStatus) {
      case 'connected':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'disconnected':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Loader2 className="h-5 w-5 animate-spin text-yellow-600" />;
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
        return 'bg-green-50 border-green-200 text-green-800';
      case 'disconnected':
        return 'bg-red-50 border-red-200 text-red-800';
      default:
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Schedulify</h1>
        <p className="text-xl text-gray-600">AI-Powered Automatic Timetable Generator</p>
      </div>

      {/* API Status Card */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {getStatusIcon()}
              <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor()}`}>
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
                <Button
                  onClick={() => {
                    window.open(`${process.env.NEXT_PUBLIC_API_URL}/health`, '_blank');
                    setTimeout(() => checkApiConnection(), 5000);
                  }}
                  variant="default"
                  size="sm"
                >
                  Wake Up Backend
                </Button>
              )}
            </div>
          </div>
          {apiStatus === 'disconnected' && (
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800 font-medium mb-2">Backend URL: {process.env.NEXT_PUBLIC_API_URL}</p>
              <p className="text-sm text-blue-700">
                🔧 <strong>Quick Fix:</strong> Click "Wake Up Backend" button above, wait 30 seconds, then click "Check Connection"
              </p>
              <p className="text-xs mt-1 text-blue-600">
                Free tier backends sleep after 15 minutes of inactivity. This is normal behavior.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {validationResults && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Validation Results</CardTitle>
          </CardHeader>
          <CardContent>
            {validationResults.errors?.length > 0 && (
              <div className="mb-4">
                <h4 className="text-red-600 font-semibold mb-2 flex items-center">
                  <XCircle className="h-4 w-4 mr-2" />
                  Errors:
                </h4>
                <ul className="list-disc list-inside text-red-600 space-y-1 ml-6">
                  {validationResults.errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
            {validationResults.warnings?.length > 0 && (
              <div>
                <h4 className="text-yellow-600 font-semibold mb-2 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Warnings:
                </h4>
                <ul className="list-disc list-inside text-yellow-600 space-y-1 ml-6">
                  {validationResults.warnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}
            {validationResults.is_valid && (
              <div className="text-green-600 flex items-center">
                <CheckCircle className="h-4 w-4 mr-2" />
                All validations passed! Ready to generate timetable.
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="input">
            <div className="flex items-center space-x-2">
              <span>Input Configuration</span>
              {timetableData && <Edit3 className="h-4 w-4" />}
            </div>
          </TabsTrigger>
          <TabsTrigger value="timetable" disabled={!timetableData}>
            Generated Timetable
          </TabsTrigger>
          <TabsTrigger value="export" disabled={!timetableData}>
            Export Options
          </TabsTrigger>
        </TabsList>

        <TabsContent value="input" className="space-y-6 mt-6">
          <InputForm 
            onSubmit={handleGenerateTimetable}
            loading={loading}
            validationResults={validationResults}
            apiStatus={apiStatus}
            initialData={savedFormData} // Pass saved data for editing
          />
        </TabsContent>

        <TabsContent value="timetable" className="space-y-6 mt-6">
          {timetableData && (
            <TimetableDisplay 
              data={timetableData}
              institutionId={institutionId}
              onEdit={handleEditTimetable}
            />
          )}
        </TabsContent>

        <TabsContent value="export" className="space-y-6 mt-6">
          {timetableData && (
            <ExportOptions 
              institutionId={institutionId}
              timetableData={timetableData}
            />
          )}
        </TabsContent>
      </Tabs>

      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-8 max-w-md mx-4">
            <div className="text-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin mx-auto text-blue-600" />
              <div>
                <h3 className="text-xl font-semibold mb-2">Generating Timetable</h3>
                <p className="text-gray-600 mb-4">
                  Our AI is optimizing your schedule using genetic algorithms...
                </p>
                <div className="text-sm text-gray-500">
                  <p>⏳ This process typically takes 2-3 minutes</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default TimetableGenerator;
