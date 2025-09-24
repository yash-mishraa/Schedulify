'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar, Clock, Users, Building2, BookOpen, TrendingUp } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import TimetableGenerator from './TimetableGenerator';

const Dashboard = () => {
  const [user, loading, error] = useAuthState(auth);
  const [institutionId, setInstitutionId] = useState('');
  const [institutionName, setInstitutionName] = useState('');
  const [showGenerator, setShowGenerator] = useState(false);

  useEffect(() => {
    // Generate or get institution ID from local storage
    let storedId = localStorage.getItem('institutionId');
    let storedName = localStorage.getItem('institutionName');
    
    if (!storedId) {
      storedId = `inst_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('institutionId', storedId);
    }
    
    setInstitutionId(storedId);
    setInstitutionName(storedName || 'My Institution');
  }, []);

  const handleInstitutionSetup = () => {
    if (institutionName.trim()) {
      localStorage.setItem('institutionName', institutionName);
      setShowGenerator(true);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (showGenerator) {
    return <TimetableGenerator institutionId={institutionId} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Calendar className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Schedulify</h1>
                <p className="text-gray-600">AI-Powered Timetable Generator</p>
              </div>
            </div>
            {user && (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">Welcome, {user.email}</span>
                <Button 
                  variant="outline" 
                  onClick={() => auth.signOut()}
                >
                  Sign Out
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to Schedulify
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Generate optimized, clash-free timetables for your educational institution using 
            advanced AI algorithms. Save time and eliminate scheduling conflicts automatically.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Card className="text-center">
            <CardContent className="p-6">
              <TrendingUp className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">AI Optimization</h3>
              <p className="text-gray-600 text-sm">
                Uses genetic algorithms to create the most efficient schedules
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="p-6">
              <Clock className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Real-time Updates</h3>
              <p className="text-gray-600 text-sm">
                Instant synchronization and live updates across all devices
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="p-6">
              <Users className="h-12 w-12 text-purple-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Clash-free</h3>
              <p className="text-gray-600 text-sm">
                Intelligent conflict resolution for teachers and rooms
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="p-6">
              <Building2 className="h-12 w-12 text-orange-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Multi-tenant</h3>
              <p className="text-gray-600 text-sm">
                Supports multiple institutions with secure data isolation
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Institution Setup */}
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-center">Setup Your Institution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="institutionName">Institution Name</Label>
              <Input
                id="institutionName"
                value={institutionName}
                onChange={(e) => setInstitutionName(e.target.value)}
                placeholder="Enter your institution name"
              />
            </div>
            
            <div className="text-sm text-gray-600">
              <p><strong>Institution ID:</strong> {institutionId}</p>
              <p className="text-xs mt-1">
                This unique ID will be used to save and sync your timetables
              </p>
            </div>

            <Button 
              onClick={handleInstitutionSetup}
              className="w-full"
              disabled={!institutionName.trim()}
            >
              Start Creating Timetable
            </Button>
          </CardContent>
        </Card>

        {/* How it Works */}
        <div className="mt-16">
          <h3 className="text-2xl font-bold text-center mb-8">How It Works</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">1</span>
              </div>
              <h4 className="text-lg font-semibold mb-2">Input Requirements</h4>
              <p className="text-gray-600">
                Enter your courses, teachers, working days, and any custom constraints
              </p>
            </div>

            <div className="text-center">
              <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-green-600">2</span>
              </div>
              <h4 className="text-lg font-semibold mb-2">AI Processing</h4>
              <p className="text-gray-600">
                Our genetic algorithm optimizes your schedule for best results
              </p>
            </div>

            <div className="text-center">
              <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-purple-600">3</span>
              </div>
              <h4 className="text-lg font-semibold mb-2">Get Results</h4>
              <p className="text-gray-600">
                Download your optimized timetable in PDF or Excel format
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
