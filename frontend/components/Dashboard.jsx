'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/Button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Calendar, Clock, Users, Building2, TrendingUp, Sparkles, Zap, Shield } from 'lucide-react';
import TimetableGenerator from './TimetableGenerator';

const Dashboard = () => {
  const [institutionId, setInstitutionId] = useState('');
  const [institutionName, setInstitutionName] = useState('');
  const [showGenerator, setShowGenerator] = useState(false);

  useEffect(() => {
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

  if (showGenerator) {
    return <TimetableGenerator institutionId={institutionId} />;
  }

  return (
    <div className="min-h-screen">
      {/* Hero Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-blue-600/20 backdrop-blur-sm"></div>
        <div className="relative container mx-auto px-6 py-16">
          <div className="text-center">
            <div className="flex items-center justify-center mb-6">
              <div className="glass-card p-4 float-animation">
                <Calendar className="h-12 w-12 text-purple-400" />
              </div>
            </div>
            <h1 className="text-6xl font-bold gradient-text mb-4">
              Schedulify
            </h1>
            <p className="text-xl text-white/80 max-w-2xl mx-auto mb-8">
              AI-Powered Automatic Timetable Generator with advanced algorithms 
              for creating clash-free, optimized schedules
            </p>
            <div className="flex items-center justify-center space-x-4">
              <div className="glass-badge">
                <Sparkles className="h-4 w-4 mr-2 inline" />
                AI-Powered
              </div>
              <div className="glass-badge">
                <Zap className="h-4 w-4 mr-2 inline" />
                Real-time
              </div>
              <div className="glass-badge">
                <Shield className="h-4 w-4 mr-2 inline" />
                Clash-free
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-12">
        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <div className="glass-card-hover p-6 text-center float-animation">
            <div className="mb-4">
              <TrendingUp className="h-12 w-12 text-purple-400 mx-auto glow-purple rounded-full p-2 bg-purple-500/20" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-3">AI Optimization</h3>
            <p className="text-white/70 text-sm">
              Uses genetic algorithms to create the most efficient schedules with maximum optimization
            </p>
          </div>

          <div className="glass-card-hover p-6 text-center float-animation" style={{animationDelay: '0.5s'}}>
            <div className="mb-4">
              <Clock className="h-12 w-12 text-blue-400 mx-auto glow-blue rounded-full p-2 bg-blue-500/20" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-3">Real-time Updates</h3>
            <p className="text-white/70 text-sm">
              Instant synchronization and live updates across all devices with Firebase integration
            </p>
          </div>

          <div className="glass-card-hover p-6 text-center float-animation" style={{animationDelay: '1s'}}>
            <div className="mb-4">
              <Users className="h-12 w-12 text-green-400 mx-auto rounded-full p-2 bg-green-500/20" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-3">Clash-free</h3>
            <p className="text-white/70 text-sm">
              Intelligent conflict resolution for teachers, rooms, and consecutive lab sessions
            </p>
          </div>

          <div className="glass-card-hover p-6 text-center float-animation" style={{animationDelay: '1.5s'}}>
            <div className="mb-4">
              <Building2 className="h-12 w-12 text-orange-400 mx-auto rounded-full p-2 bg-orange-500/20" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-3">Multi-tenant</h3>
            <p className="text-white/70 text-sm">
              Supports multiple institutions with secure data isolation and cloud storage
            </p>
          </div>
        </div>

        {/* Institution Setup */}
        <div className="max-w-md mx-auto">
          <div className="glass-card p-8">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">Setup Your Institution</h2>
              <p className="text-white/70">Get started with AI-powered scheduling</p>
            </div>
            
            <div className="space-y-6">
              <div>
                <Label className="text-white mb-2 block">Institution Name</Label>
                <Input
                  className="glass-input w-full"
                  value={institutionName}
                  onChange={(e) => setInstitutionName(e.target.value)}
                  placeholder="Enter your institution name"
                />
              </div>
              
              <div className="glass-card p-4 bg-white/5">
                <div className="text-sm text-white/80">
                  <p className="font-medium text-purple-300">Institution ID:</p>
                  <p className="font-mono text-xs break-all mt-1">{institutionId}</p>
                  <p className="text-xs mt-2 text-white/60">
                    This unique ID will be used to save and sync your timetables securely
                  </p>
                </div>
              </div>

              <Button 
                onClick={handleInstitutionSetup}
                className="glass-button w-full"
                disabled={!institutionName.trim()}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Start Creating Timetable
              </Button>
            </div>
          </div>
        </div>

        {/* How it Works */}
        <div className="mt-20">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold gradient-text mb-4">How It Works</h3>
            <p className="text-white/70 max-w-2xl mx-auto">
              Our advanced AI system creates optimized timetables in three simple steps
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="glass-card-hover p-8 text-center">
              <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6 glow-purple">
                <span className="text-2xl font-bold text-white">1</span>
              </div>
              <h4 className="text-xl font-semibold text-white mb-4">Input Requirements</h4>
              <p className="text-white/70">
                Enter your courses, teachers, working days, constraints, and lab duration requirements
              </p>
            </div>

            <div className="glass-card-hover p-8 text-center">
              <div className="bg-gradient-to-r from-green-500 to-blue-500 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6 glow-blue">
                <span className="text-2xl font-bold text-white">2</span>
              </div>
              <h4 className="text-xl font-semibold text-white mb-4">AI Processing</h4>
              <p className="text-white/70">
                Our genetic algorithm optimizes your schedule with consecutive lab sessions and clash resolution
              </p>
            </div>

            <div className="glass-card-hover p-8 text-center">
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">3</span>
              </div>
              <h4 className="text-xl font-semibold text-white mb-4">Get Results</h4>
              <p className="text-white/70">
                Download your optimized timetable in PDF or Excel format with detailed statistics
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
