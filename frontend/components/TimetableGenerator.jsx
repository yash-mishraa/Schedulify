'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import { subscribeTimetableUpdates } from '@/lib/firebase';
import axios from 'axios';

import InputForm from './InputForm';
import TimetableDisplay from './TimetableDisplay';
import ExportOptions from './ExportOptions';

const TimetableGenerator = ({ institutionId }) => {
  const [timetableData, setTimetableData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationResults, setValidationResults] = useState(null);
  const [activeTab, setActiveTab] = useState('input');

  useEffect(() => {
    // Subscribe to real-time timetable updates
    if (institutionId) {
      const unsubscribe = subscribeTimetableUpdates(institutionId, (data) => {
        setTimetableData(data);
        if (data && activeTab === 'input') {
          setActiveTab('timetable');
        }
      });

      return () => unsubscribe();
    }
  }, [institutionId, activeTab]);

  const handleGenerateTimetable = async (formData) => {
    setLoading(true);
    setError('');
    
    try {
      // First validate the inputs
      const validationResponse = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/timetable/validate`,
        { ...formData, institution_id: institutionId }
      );

      setValidationResults(validationResponse.data);

      if (!validationResponse.data.is_valid) {
        setError('Please fix the validation errors before generating timetable');
        setLoading(false);
        return;
      }

      // Generate timetable
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/timetable/generate`,
        { ...formData, institution_id: institutionId }
      );

      setTimetableData(response.data);
      setActiveTab('timetable');
      
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to generate timetable');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Schedulify</h1>
        <p className="text-xl text-gray-600">AI-Powered Automatic Timetable Generator</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {validationResults && (
        <Card>
          <CardHeader>
            <CardTitle>Validation Results</CardTitle>
          </CardHeader>
          <CardContent>
            {validationResults.errors?.length > 0 && (
              <div className="mb-4">
                <h4 className="text-red-600 font-semibold mb-2">Errors:</h4>
                <ul className="list-disc list-inside text-red-600 space-y-1">
                  {validationResults.errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
            {validationResults.warnings?.length > 0 && (
              <div>
                <h4 className="text-yellow-600 font-semibold mb-2">Warnings:</h4>
                <ul className="list-disc list-inside text-yellow-600 space-y-1">
                  {validationResults.warnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
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

        <TabsContent value="input" className="space-y-6">
          <InputForm 
            onSubmit={handleGenerateTimetable}
            loading={loading}
            validationResults={validationResults}
          />
        </TabsContent>

        <TabsContent value="timetable" className="space-y-6">
          {timetableData && (
            <TimetableDisplay 
              data={timetableData}
              institutionId={institutionId}
            />
          )}
        </TabsContent>

        <TabsContent value="export" className="space-y-6">
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
          <Card className="p-6">
            <div className="flex items-center space-x-4">
              <Loader2 className="h-8 w-8 animate-spin" />
              <div>
                <h3 className="text-lg font-semibold">Generating Timetable</h3>
                <p className="text-gray-600">Optimizing schedule using AI algorithms...</p>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default TimetableGenerator;
