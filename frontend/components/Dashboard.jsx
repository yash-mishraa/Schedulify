'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/Button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Calendar,
  Clock,
  Building2,
  Sparkles,
  Zap,
  Shield,
  Plus,
  Trash2,
  History,
  ArrowLeft,
  Edit3,
} from 'lucide-react';
import TimetableGenerator from './TimetableGenerator';
import axios from 'axios';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const [institutionId, setInstitutionId] = useState('');
  const [institutionName, setInstitutionName] = useState('');
  const [institutionData, setInstitutionData] = useState(null);
  const [showGenerator, setShowGenerator] = useState(false);
  const [loading, setLoading] = useState(false);
  const [existingInstitutions, setExistingInstitutions] = useState([]);
  const [storedInputs, setStoredInputs] = useState(null);

  useEffect(() => {
    loadStoredInstitution();
    loadRecentInstitutions();
  }, []);

  const loadStoredInstitution = async () => {
    const storedId = localStorage.getItem('institutionId');
    const storedName = localStorage.getItem('institutionName');
    const storedFormData = localStorage.getItem('lastFormData');

    if (storedId && storedName) {
      setInstitutionId(storedId);
      setInstitutionName(storedName);

      const instData = {
        id: storedId,
        name: storedName,
        total_timetables_generated: 0,
      };
      setInstitutionData(instData);

      if (storedFormData) {
        try {
          setStoredInputs(JSON.parse(storedFormData));
        } catch (e) {
          console.error('Error parsing stored form data:', e);
        }
      }
    }
  };

  const loadRecentInstitutions = () => {
    const recent = JSON.parse(localStorage.getItem('recentInstitutions') || '[]');
    setExistingInstitutions(recent.slice(0, 5));
  };

  const createNewInstitution = async () => {
    if (!institutionName.trim()) {
      toast.error('Please enter institution name');
      return;
    }

    setLoading(true);
    try {
      const fallbackId = `inst_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      let newInstitution;

      try {
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/institutions/`,
          {
            name: institutionName,
            settings: {},
          }
        );
        newInstitution = response.data;
      } catch (error) {
        console.log('Backend unavailable, using fallback');
        newInstitution = {
          id: fallbackId,
          name: institutionName,
          created_at: new Date().toISOString(),
          total_timetables_generated: 0,
        };
      }

      localStorage.setItem('institutionId', newInstitution.id);
      localStorage.setItem('institutionName', newInstitution.name);

      const recent = JSON.parse(localStorage.getItem('recentInstitutions') || '[]');
      const updatedRecent = [
        { id: newInstitution.id, name: newInstitution.name, created_at: newInstitution.created_at },
        ...recent.filter((inst) => inst.id !== newInstitution.id),
      ].slice(0, 10);
      localStorage.setItem('recentInstitutions', JSON.stringify(updatedRecent));

      setInstitutionId(newInstitution.id);
      setInstitutionData(newInstitution);
      setExistingInstitutions(updatedRecent.slice(0, 5));
      setStoredInputs(null);
      setInstitutionName('');

      toast.success('Institution created successfully!');
      setShowGenerator(true);
    } catch (error) {
      console.error('Failed to create institution:', error);
      toast.error('Failed to create institution. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const selectExistingInstitution = (instId, instName) => {
    setLoading(true);

    const storedFormData = localStorage.getItem(`formData_${instId}`);
    let institutionInputs = null;
    if (storedFormData) {
      try {
        institutionInputs = JSON.parse(storedFormData);
      } catch (e) {
        console.error('Error parsing stored form data:', e);
      }
    }

    localStorage.setItem('institutionId', instId);
    localStorage.setItem('institutionName', instName);
    if (institutionInputs) {
      localStorage.setItem('lastFormData', JSON.stringify(institutionInputs));
    }

    const institutionDataObj = {
      id: instId,
      name: instName,
      total_timetables_generated: 0,
    };

    setInstitutionId(instId);
    setInstitutionName('');
    setInstitutionData(institutionDataObj);
    setStoredInputs(institutionInputs);
    setShowGenerator(true);

    toast.success(`Loaded ${instName}`);
    setLoading(false);
  };

  // BULLETPROOF DELETE FUNCTION
  const handleDeleteClick = (institutionToDelete) => {
    // Debug logs
    console.log('🗑️ Delete button clicked for:', institutionToDelete.name);
    
    const userConfirmed = window.confirm(`Are you sure you want to delete "${institutionToDelete.name}"?`);
    console.log('👤 User confirmed:', userConfirmed);
    
    if (!userConfirmed) {
      console.log('❌ User cancelled deletion');
      return;
    }

    try {
      console.log('🔄 Starting deletion process...');
      
      // Get current institutions from localStorage
      const currentInstitutions = JSON.parse(localStorage.getItem('recentInstitutions') || '[]');
      console.log('📋 Current institutions:', currentInstitutions.length);
      
      // Filter out the institution to delete
      const updatedInstitutions = currentInstitutions.filter(
        (inst) => inst.id !== institutionToDelete.id
      );
      console.log('📋 After filtering:', updatedInstitutions.length);
      
      // Save back to localStorage
      localStorage.setItem('recentInstitutions', JSON.stringify(updatedInstitutions));
      console.log('💾 Saved to localStorage');
      
      // Remove form data for this institution
      localStorage.removeItem(`formData_${institutionToDelete.id}`);
      console.log('🗑️ Removed form data');
      
      // If this was the current institution, clear current state
      if (institutionId === institutionToDelete.id) {
        console.log('🔄 Clearing current institution state...');
        localStorage.removeItem('institutionId');
        localStorage.removeItem('institutionName');
        localStorage.removeItem('lastFormData');
        setInstitutionId('');
        setInstitutionName('');
        setInstitutionData(null);
        setStoredInputs(null);
        setShowGenerator(false);
        console.log('✅ Current institution state cleared');
      }

      // Force update the UI by setting state directly
      setExistingInstitutions([...updatedInstitutions.slice(0, 5)]);
      console.log('🔄 UI state updated');
      
      // Success notification
      toast.success(`${institutionToDelete.name} deleted successfully`);
      console.log('✅ Delete operation completed successfully');
      
    } catch (error) {
      console.error('❌ Error during deletion:', error);
      toast.error('Failed to delete institution');
    }
  };

  const goBackToSelection = () => {
    setShowGenerator(false);
  };

  if (showGenerator) {
    return (
      <div>
        <div className="container mx-auto px-6 pt-6">
          <Button onClick={goBackToSelection} variant="outline" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Institution Selection
          </Button>
        </div>

        <TimetableGenerator
          institutionId={institutionId}
          institutionData={institutionData}
          initialInputs={storedInputs}
        />
      </div>
    );
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
            <h1 className="text-6xl font-bold gradient-text mb-4">Schedulify</h1>
            <p className="text-xl text-white/80 max-w-2xl mx-auto mb-8">
              AI-Powered Automatic Timetable Generator with advanced algorithms for creating clash-free, optimized schedules
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

      {/* Main Content */}
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Create New Institution */}
          <div className="glass-card p-8">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-white mb-2 flex items-center justify-center">
                <Plus className="h-6 w-6 mr-2" />
                Create New Institution
              </h2>
              <p className="text-white/70">Set up a new institution for timetable generation</p>
            </div>

            <div className="space-y-6">
              <div>
                <Label className="text-label mb-2 block">Institution Name</Label>
                <Input
                  className="glass-input w-full"
                  value={institutionName}
                  onChange={(e) => setInstitutionName(e.target.value)}
                  placeholder="Enter your institution name"
                  disabled={loading}
                />
              </div>

              <Button
                onClick={createNewInstitution}
                className="btn-primary w-full btn-large"
                disabled={!institutionName.trim() || loading}
              >
                {loading ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" /> Creating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" /> Create Institution
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Recent Institutions */}
          <div className="glass-card p-8">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-white mb-2 flex items-center justify-center">
                <History className="h-6 w-6 mr-2" /> Recent Institutions
              </h2>
              <p className="text-white/70">Continue with previously created institutions</p>
            </div>

            {existingInstitutions.length > 0 ? (
              <div className="space-y-3">
                {existingInstitutions.map((institution, index) => (
                  <div
                    key={`${institution.id}-${index}`}
                    className="bg-white/10 rounded-lg p-4 flex items-center justify-between hover:bg-white/15 transition-all duration-200"
                  >
                    <div className="flex-1">
                      <h3 className="text-white font-medium">{institution.name}</h3>
                      <p className="text-white/60 text-xs">
                        Created: {new Date(institution.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex space-x-2 ml-4">
                      <Button
                        onClick={() => selectExistingInstitution(institution.id, institution.name)}
                        variant="secondary"
                        size="sm"
                        disabled={loading}
                      >
                        Load
                      </Button>
                      
                      {/* BULLETPROOF DELETE BUTTON */}
                      <div
                        onClick={() => handleDeleteClick(institution)}
                        className="cursor-pointer bg-transparent hover:bg-red-500/20 text-white/90 hover:text-white font-medium px-3 py-1.5 text-sm rounded-md border border-white/30 hover:border-red-400 transition-all duration-200 flex items-center justify-center"
                        style={{ 
                          minWidth: '36px', 
                          minHeight: '32px',
                          pointerEvents: loading ? 'none' : 'auto'
                        }}
                        title={`Delete ${institution.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Building2 className="h-12 w-12 text-white/40 mx-auto mb-4" />
                <p className="text-white/60">No recent institutions found</p>
                <p className="text-white/40 text-sm">Create your first institution to get started</p>
              </div>
            )}
          </div>
        </div>

        {/* Current Institution Info */}
        {institutionData && !showGenerator && (
          <div className="mt-8">
            <Card className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-400/30">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-semibold text-lg mb-1 flex items-center">
                      Current Institution: {institutionData.name}
                      {storedInputs && <Edit3 className="h-4 w-4 ml-2 text-green-300" />}
                    </h3>
                    <p className="text-green-200/80 text-sm">
                      ID: {institutionData.id}
                      {storedInputs && <span className="ml-3">• Previous inputs saved</span>}
                    </p>
                  </div>
                  <Button onClick={() => setShowGenerator(true)} className="btn-primary">
                    Continue to Timetable Generator
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* DEBUG PANEL - Remove this after testing */}
        <div className="mt-8 bg-gray-800/50 rounded-lg p-4 text-white text-xs">
          <h4 className="font-bold mb-2">🐛 Debug Info:</h4>
          <p>Existing Institutions: {existingInstitutions.length}</p>
          <p>Current Institution: {institutionData?.name || 'None'}</p>
          <div className="mt-2">
            <strong>Institutions List:</strong>
            {existingInstitutions.map((inst, i) => (
              <div key={i} className="ml-4">
                • {inst.name} (ID: {inst.id})
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
