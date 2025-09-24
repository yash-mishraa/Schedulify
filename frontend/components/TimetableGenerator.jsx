'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/Button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { Alert, AlertDescription } from './ui/alert';
import { Loader2, RefreshCw, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
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

  // Check API connection on component mount
  useEffect(() => {
    checkApiConnection();
  }, []);

  const checkApiConnection = async () => {
    setApiStatus('checking');
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/health`, {
        timeout: 10000 // 10 second timeout
      });
      
      if (response.status === 200) {
        setApiStatus('connected');
        setError('');
      } else {
        throw new Error('API health check failed');
      }
    } catch (err) {
      console.error('API connection error:', err);
      setApiStatus('disconnected');
      setError('Backend server is not accessible. The service may be starting up (please wait 1-2 minutes) or there may be a connection issue.');
    }
  };

  const handleGenerateTimetable = async (formData) => {
    if (apiStatus !== 'connected') {
      toast.error('Backend server is not accessible. Please check connection first.');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      // Show loading toast
      toast.loading('Validating input data...', { id: 'generating' });

      // First validate the inputs
      const validationResponse = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/timetable/validate`,
        { ...formData, institution_id: institutionId },
        { timeout: 30000 } // 30 second timeout
      );

      setValidationResults(validationResponse.data);

      if (!validationResponse.data.is_valid) {
        setError('Please fix the validation errors before generating timetable');
        toast.error('Please fix validation errors', { id: 'generating' });
        setLoading(false);
        return;
      }

      // Update loading message
      toast.loading('Generating optimized timetable... This may take 2-3 minutes.', { id: 'generating' });

      // Generate timetable with longer timeout
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/timetable/generate`,
        { ...formData, institution_id: institutionId },
        { timeout: 300000 } // 5 minute timeout for AI processing
      );

      setTimetableData(response.data);
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
        return 'Server Connected';
      case 'disconnected':
        return 'Server Offline';
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
            {apiStatus !== 'connected' && (
              <Button
                onClick={checkApiConnection}
                variant="outline"
                size="sm"
                disabled={apiStatus === 'checking'}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${apiStatus === 'checking' ? 'animate-spin' : ''}`} />
                Retry Connection
              </Button>
            )}
          </div>
          {apiStatus === 'disconnected' && (
            <div className="mt-3 text-sm text-gray-600">
              <p>The backend server may be sleeping (free tier). It will wake up automatically when accessed.</p>
              <p className="text-xs mt-1">⏳ Please wait 30-60 seconds and click "Retry Connection"</p>
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
          <TabsTrigger value="input">Input Configuration</TabsTrigger>
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
          />
        </TabsContent>

        <TabsContent value="timetable" className="space-y-6 mt-6">
          {timetableData && (
            <TimetableDisplay 
              data={timetableData}
              institutionId={institutionId}
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
                  <p>🧠 Processing {timetableData?.courses?.length || 0} courses</p>
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
