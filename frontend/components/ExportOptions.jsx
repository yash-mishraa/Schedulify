'use client';

import { useState } from 'react';
import { Button } from './ui/Button';
import { Download, FileSpreadsheet, FileText, Clock, CheckCircle, AlertCircle, Info } from 'lucide-react';
import toast from 'react-hot-toast';

const ExportOptions = ({ institutionId, timetableData }) => {
  const [exporting, setExporting] = useState({ excel: false, pdf: false });

  // Create export data from the timetable data already in frontend
  const createExportData = () => {
    if (!timetableData || !timetableData.timetable) {
      return null;
    }

    // Format the data for export
    const exportData = {
      institution_id: institutionId,
      timetable: timetableData.timetable,
      fitness_score: timetableData.fitness_score || 0,
      summary: timetableData.summary || {},
      generation_count: timetableData.generation_count || 0,
      created_at: timetableData.timestamp || new Date().toISOString(),
      constraints: timetableData.constraints || {}
    };

    return exportData;
  };

  const handleExport = async (format) => {
    const exportData = createExportData();
    
    if (!exportData) {
      toast.error('No timetable data available for export');
      return;
    }

    setExporting(prev => ({ ...prev, [format]: true }));
    
    try {
      toast.loading(`Generating ${format.toUpperCase()} file...`, { id: `export-${format}` });

      // Try backend export first
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/timetable/export/${institutionId}?format=${format}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(exportData),
        });

        if (response.ok) {
          // Backend export successful
          const blob = await response.blob();
          downloadFile(blob, format, institutionId);
          toast.success(`${format.toUpperCase()} file downloaded successfully!`, { id: `export-${format}` });
          return;
        }
      } catch (backendError) {
        console.log('Backend export failed, using client-side export');
      }

      // Fallback to client-side export
      if (format === 'excel') {
        await exportToExcelClientSide(exportData);
      } else {
        await exportToPDFClientSide(exportData);
      }

      toast.success(`${format.toUpperCase()} file generated successfully!`, { id: `export-${format}` });

    } catch (error) {
      console.error(`Export ${format} error:`, error);
      toast.error(`Failed to export ${format.toUpperCase()} file. ${error.message}`, { id: `export-${format}` });
    } finally {
      setExporting(prev => ({ ...prev, [format]: false }));
    }
  };

  const downloadFile = (blob, format, institutionId) => {
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
  };

  const exportToExcelClientSide = async (data) => {
    // Create CSV content (simplified Excel alternative)
    const csvContent = generateCSVContent(data);
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    link.download = `timetable_${institutionId}_${timestamp}.csv`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const exportToPDFClientSide = async (data) => {
    // Create HTML content for PDF (can be printed to PDF by browser)
    const htmlContent = generateHTMLContent(data);
    
    // Open in new window for printing
    const printWindow = window.open('', '_blank');
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Trigger print dialog
    printWindow.onload = () => {
      printWindow.print();
    };
  };

  const generateCSVContent = (data) => {
    const { timetable, fitness_score } = data;
    let csv = 'Timetable Export\n\n';
    
    // Add metadata
    csv += `Institution ID:,${institutionId}\n`;
    csv += `Generated At:,${new Date().toLocaleString()}\n`;
    csv += `Fitness Score:,${fitness_score}\n\n`;
    
    // Get days and time slots
    const days = Object.keys(timetable || {});
    const timeSlots = new Set();
    
    days.forEach(day => {
      Object.keys(timetable[day] || {}).forEach(slot => {
        timeSlots.add(slot);
      });
    });
    
    const sortedTimeSlots = Array.from(timeSlots).sort();
    const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const sortedDays = days.sort((a, b) => dayOrder.indexOf(a) - dayOrder.indexOf(b));
    
    // Create header
    csv += 'Time/Day,' + sortedDays.join(',') + '\n';
    
    // Add timetable rows
    sortedTimeSlots.forEach(timeSlot => {
      csv += timeSlot;
      sortedDays.forEach(day => {
        const classInfo = timetable[day]?.[timeSlot];
        if (classInfo) {
          const cellContent = `"${classInfo.course_code || 'N/A'} - ${classInfo.teacher || 'N/A'} - ${classInfo.room || 'N/A'}"`;
          csv += ',' + cellContent;
        } else {
          csv += ',Free';
        }
      });
      csv += '\n';
    });
    
    return csv;
  };

  const generateHTMLContent = (data) => {
    const { timetable, fitness_score } = data;
    
    // Get days and time slots
    const days = Object.keys(timetable || {});
    const timeSlots = new Set();
    
    days.forEach(day => {
      Object.keys(timetable[day] || {}).forEach(slot => {
        timeSlots.add(slot);
      });
    });
    
    const sortedTimeSlots = Array.from(timeSlots).sort();
    const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const sortedDays = days.sort((a, b) => dayOrder.indexOf(a) - dayOrder.indexOf(b));
    
    let tableRows = '';
    sortedTimeSlots.forEach(timeSlot => {
      tableRows += `<tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; background: #f5f5f5;">${timeSlot}</td>`;
      sortedDays.forEach(day => {
        const classInfo = timetable[day]?.[timeSlot];
        if (classInfo) {
          const bgColor = classInfo.type === 'lab' ? '#e3f2fd' : '#f3e5f5';
          tableRows += `<td style="padding: 8px; border: 1px solid #ddd; background: ${bgColor};">
            <strong>${classInfo.course_code || 'N/A'}</strong><br>
            ${classInfo.teacher || 'N/A'}<br>
            <small>${classInfo.room || 'N/A'}</small>
            ${classInfo.type === 'lab' ? '<br><em>[LAB]</em>' : ''}
          </td>`;
        } else {
          tableRows += `<td style="padding: 8px; border: 1px solid #ddd; background: #f9f9f9; text-align: center; color: #666;">Free</td>`;
        }
      });
      tableRows += '</tr>';
    });
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Weekly Timetable</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { color: #333; text-align: center; }
          .meta { margin-bottom: 20px; background: #f5f5f5; padding: 10px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { padding: 12px 8px; border: 1px solid #ddd; background: #4a90e2; color: white; }
          td { padding: 8px; border: 1px solid #ddd; vertical-align: top; }
          @media print { body { margin: 10px; font-size: 12px; } }
        </style>
      </head>
      <body>
        <h1>Weekly Timetable</h1>
        <div class="meta">
          <strong>Institution ID:</strong> ${institutionId}<br>
          <strong>Generated:</strong> ${new Date().toLocaleString()}<br>
          <strong>Fitness Score:</strong> ${fitness_score}
        </div>
        <table>
          <thead>
            <tr>
              <th>Time/Day</th>
              ${sortedDays.map(day => `<th>${day}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
        <script>
          window.onload = function() {
            setTimeout(() => window.print(), 500);
          };
        </script>
      </body>
      </html>
    `;
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
            {/* CSV Export (Excel Alternative) */}
            <div className="bg-slate-700/40 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:border-green-400/40 transition-all duration-300">
              <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-green-500/20 rounded-xl flex items-center justify-center">
                  <FileSpreadsheet className="h-8 w-8 text-green-400" />
                </div>
                <div>
                  <h4 className="text-white font-semibold text-lg mb-2">Export to CSV/Excel</h4>
                  <p className="text-white/80 text-sm mb-4">
                    Download as CSV file (opens in Excel)
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
                      Generating CSV...
                    </>
                  ) : (
                    <>
                      <FileSpreadsheet className="h-4 w-4 mr-2" />
                      Download CSV
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
                  <h4 className="text-white font-semibold text-lg mb-2">Print to PDF</h4>
                  <p className="text-white/80 text-sm mb-4">
                    Open printable view (save as PDF from browser)
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
                      Opening Print View...
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4 mr-2" />
                      Print to PDF
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
                    Export works offline using your generated timetable data. CSV files can be opened in Excel or Google Sheets. 
                    For PDF, use your browser's "Print to PDF" feature from the print dialog.
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
