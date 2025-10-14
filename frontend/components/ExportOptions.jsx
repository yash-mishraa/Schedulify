'use client';

import { useState } from 'react';
import { Button } from './ui/Button';
import { Download, FileSpreadsheet, FileText, Clock, CheckCircle, AlertCircle, Info } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const ExportOptions = ({ institutionId, timetableData }) => {
  const [exporting, setExporting] = useState({ excel: false, pdf: false });

  const handleExport = async (format) => {
    if (!institutionId || !timetableData) {
      toast.error('No timetable data available for export');
      return;
    }

    setExporting(prev => ({ ...prev, [format]: true }));
    
    try {
      toast.loading(`Generating ${format.toUpperCase()} file...`, { id: `export-${format}` });

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/timetable/export/${institutionId}`,
        {},
        {
          params: { format: format },
          responseType: 'blob',
          timeout: 60000
        }
      );

      // Create blob and download
      const blob = new Blob([response.data], {
        type: format === 'excel' 
          ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          : 'application/pdf'
      });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      const extension = format === 'excel' ? 'xlsx' : 'pdf';
      link.download = `timetable_${institutionId}_${timestamp}.${extension}`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success(`${format.toUpperCase()} file downloaded successfully!`, { id: `export-${format}` });

    } catch (error) {
      console.error(`Export ${format} error:`, error);
      let errorMessage = `Failed to export ${format.toUpperCase()} file.`;
      
      if (error.response?.status === 404) {
        errorMessage = 'Timetable not found. Please generate a timetable first.';
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = 'Export timeout. Please try again.';
      } else if (error.response?.data) {
        try {
          const errorData = await error.response.data.text();
          const parsedError = JSON.parse(errorData);
          errorMessage = parsedError.detail || errorMessage;
        } catch (e) {
          // Use default error message
        }
      }
      
      toast.error(errorMessage, { id: `export-${format}` });
    } finally {
      setExporting(prev => ({ ...prev, [format]: false }));
    }
  };

  // Extract timetable statistics
  const getExportStats = () => {
    if (!timetableData) return null;

    const { timetable, fitness_score, timestamp } = timetableData;
    let totalClasses = 0;
    const courses = new Set();
    const teachers = new Set();

    if (timetable) {
      Object.values(timetable).forEach(daySchedule => {
        Object.values(daySchedule).forEach(classInfo => {
          if (classInfo) {
            totalClasses++;
            courses.add(classInfo.course_code || classInfo.code);
            teachers.add(classInfo.teacher);
          }
        });
      });
    }

    return {
      institutionId,
      generatedAt: timestamp ? new Date(timestamp).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : 'N/A',
      fitnessScore: fitness_score?.toFixed(1) || 'N/A',
      totalClasses,
      totalCourses: courses.size,
      totalTeachers: teachers.size
    };
  };

  const stats = getExportStats();

  return (
    <div className="space-y-6">
      {/* Export Header */}
      <div className="space-y-0">
        <div className="glass-section-header">
          <h3 className="section-title">
            <Download className="h-5 w-5 mr-2" />
            Export Timetable
          </h3>
        </div>
        <div className="content-area">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Excel Export */}
            <div className="bg-slate-700/40 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:border-green-400/40 transition-all duration-300">
              <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-green-500/20 rounded-xl flex items-center justify-center">
                  <FileSpreadsheet className="h-8 w-8 text-green-400" />
                </div>
                <div>
                  <h4 className="text-white font-semibold text-lg mb-2">Export to Excel</h4>
                  <p className="text-white/80 text-sm mb-4">
                    Download as .xlsx file with detailed spreadsheet format
                  </p>
                </div>
                <Button 
                  onClick={() => handleExport('excel')}
                  disabled={exporting.excel}
                  className="btn-primary w-full"
                >
                  {exporting.excel ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      Generating Excel...
                    </>
                  ) : (
                    <>
                      <FileSpreadsheet className="h-4 w-4 mr-2" />
                      Download Excel
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* PDF Export */}
            <div className="bg-slate-700/40 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:border-red-400/40 transition-all duration-300">
              <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-red-500/20 rounded-xl flex items-center justify-center">
                  <FileText className="h-8 w-8 text-red-400" />
                </div>
                <div>
                  <h4 className="text-white font-semibold text-lg mb-2">Export to PDF</h4>
                  <p className="text-white/80 text-sm mb-4">
                    Download as .pdf file optimized for printing
                  </p>
                </div>
                <Button 
                  onClick={() => handleExport('pdf')}
                  disabled={exporting.pdf}
                  className="btn-primary w-full"
                >
                  {exporting.pdf ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      Generating PDF...
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4 mr-2" />
                      Download PDF
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Export Information */}
      {stats && (
        <div className="space-y-0">
          <div className="glass-section-header">
            <h3 className="section-title">Export Information</h3>
          </div>
          <div className="content-area">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-4">
                <div className="bg-slate-700/30 rounded-lg p-4">
                  <h4 className="text-white/90 font-medium mb-3">Timetable Details</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-white/70">Institution ID:</span>
                      <span className="text-white font-mono">{stats.institutionId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/70">Generated At:</span>
                      <span className="text-white">{stats.generatedAt}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/70">Fitness Score:</span>
                      <span className="text-white font-semibold">{stats.fitnessScore}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                <div className="bg-slate-700/30 rounded-lg p-4">
                  <h4 className="text-white/90 font-medium mb-3">Schedule Statistics</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-white/70">Total Classes:</span>
                      <span className="text-white font-semibold">{stats.totalClasses}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/70">Total Courses:</span>
                      <span className="text-white font-semibold">{stats.totalCourses}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/70">Total Teachers:</span>
                      <span className="text-white font-semibold">{stats.totalTeachers}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Export Info Notice */}
            <div className="mt-6 bg-blue-500/20 border border-blue-400/40 rounded-lg p-4 backdrop-blur-sm">
              <div className="flex items-start space-x-3">
                <Info className="h-5 w-5 text-blue-300 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-blue-200 font-semibold mb-1">Export Information</h4>
                  <p className="text-blue-100 text-sm">
                    Exported files include the complete timetable with course information, teacher assignments, 
                    room allocations, and summary statistics. Files are optimized for printing and sharing.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status Messages */}
      {!stats && (
        <div className="bg-yellow-500/20 border border-yellow-400/40 rounded-lg p-4 backdrop-blur-sm">
          <div className="flex items-center space-x-3">
            <AlertCircle className="h-5 w-5 text-yellow-300" />
            <div>
              <h4 className="text-yellow-200 font-semibold">No Timetable Data</h4>
              <p className="text-yellow-100 text-sm">Please generate a timetable first before exporting.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExportOptions;
