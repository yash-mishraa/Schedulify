'use client';

import { useState } from 'react';
import { Button } from './ui/Button';
import { Download, FileSpreadsheet, FileText, Clock, CheckCircle, AlertCircle, Info } from 'lucide-react';
import toast from 'react-hot-toast';

const ExportOptions = ({ institutionId, timetableData, institutionData }) => {
  const [exporting, setExporting] = useState({ excel: false, pdf: false });

  // Create export data from the timetable data already in frontend
  const createExportData = () => {
    if (!timetableData || !timetableData.timetable) {
      return null;
    }

    const exportData = {
      institution_id: institutionId,
      institution_name: institutionData?.name || 'Institution',
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

      // Use client-side export for better control
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

  const downloadFile = (blob, format, institutionName) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const extension = format === 'excel' ? 'csv' : 'pdf';
    const safeName = institutionName.replace(/[^a-zA-Z0-9]/g, '_');
    link.download = `${safeName}_timetable_${timestamp}.${extension}`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const exportToExcelClientSide = async (data) => {
    const csvContent = generateCSVContent(data);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    downloadFile(blob, 'excel', data.institution_name);
  };

  const exportToPDFClientSide = async (data) => {
    const htmlContent = generateHTMLContent(data);
    
    // Create a blob and download it as HTML (which can be saved as PDF)
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
    downloadFile(blob, 'pdf', data.institution_name);
    
    // Also open in new window for immediate viewing/printing
    const printWindow = window.open('', '_blank');
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const isLunchTime = (timeSlot, constraints) => {
    if (!constraints?.lunch_start || !constraints?.lunch_end) return false;
    
    const slot = timeSlot.replace(':', '');
    const lunchStart = constraints.lunch_start.replace(':', '');
    const lunchEnd = constraints.lunch_end.replace(':', '');
    
    return slot >= lunchStart && slot < lunchEnd;
  };

  const generateCSVContent = (data) => {
    const { timetable, institution_name, constraints } = data;
    let csv = `${institution_name} - Weekly Timetable\n\n`;
    
    // Get all days and time slots
    const days = Object.keys(timetable || {});
    const timeSlots = new Set();
    
    days.forEach(day => {
      Object.keys(timetable[day] || {}).forEach(slot => {
        timeSlots.add(slot);
      });
    });
    
    // Add lunch slots if they're missing
    if (constraints?.lunch_start && constraints?.lunch_end) {
      const lunchStart = constraints.lunch_start;
      timeSlots.add(lunchStart);
    }
    
    const sortedTimeSlots = Array.from(timeSlots).sort((a, b) => {
      const timeA = a.split(':').map(Number);
      const timeB = b.split(':').map(Number);
      return (timeA[0] * 60 + timeA[1]) - (timeB[0] * 60 + timeB[1]);
    });
    
    const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const sortedDays = days.sort((a, b) => dayOrder.indexOf(a) - dayOrder.indexOf(b));
    
    // Create header
    csv += 'Time,' + sortedDays.join(',') + '\n';
    
    // Add timetable rows
    sortedTimeSlots.forEach(timeSlot => {
      csv += timeSlot;
      sortedDays.forEach(day => {
        if (isLunchTime(timeSlot, constraints)) {
          csv += ',LUNCH BREAK';
        } else {
          const classInfo = timetable[day]?.[timeSlot];
          if (classInfo) {
            const courseCode = classInfo.course_code || classInfo.code || 'N/A';
            const teacher = classInfo.teacher || 'N/A';
            const room = classInfo.room || 'N/A';
            const type = classInfo.type === 'lab' ? ' [LAB]' : '';
            const cellContent = `"${courseCode} - ${teacher} - ${room}${type}"`;
            csv += ',' + cellContent;
          } else {
            csv += ',Free';
          }
        }
      });
      csv += '\n';
    });
    
    return csv;
  };

  const generateHTMLContent = (data) => {
    const { timetable, institution_name, constraints } = data;
    
    // Get all days and time slots
    const days = Object.keys(timetable || {});
    const timeSlots = new Set();
    
    days.forEach(day => {
      Object.keys(timetable[day] || {}).forEach(slot => {
        timeSlots.add(slot);
      });
    });
    
    // Add lunch slots if they're missing
    if (constraints?.lunch_start && constraints?.lunch_end) {
      const lunchStart = constraints.lunch_start;
      timeSlots.add(lunchStart);
    }
    
    const sortedTimeSlots = Array.from(timeSlots).sort((a, b) => {
      const timeA = a.split(':').map(Number);
      const timeB = b.split(':').map(Number);
      return (timeA[0] * 60 + timeA[1]) - (timeB[0] * 60 + timeB[1]);
    });
    
    const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const sortedDays = days.sort((a, b) => dayOrder.indexOf(a) - dayOrder.indexOf(b));
    
    let tableRows = '';
    sortedTimeSlots.forEach(timeSlot => {
      tableRows += `<tr>
        <td class="time-slot">${timeSlot}</td>`;
      
      sortedDays.forEach(day => {
        if (isLunchTime(timeSlot, constraints)) {
          tableRows += `<td class="lunch-slot">
            <div class="class-card lunch-card">
              <div class="lunch-icon">🍽️</div>
              <div class="course-code">LUNCH BREAK</div>
              <div class="time-range">${constraints.lunch_start} - ${constraints.lunch_end}</div>
            </div>
          </td>`;
        } else {
          const classInfo = timetable[day]?.[timeSlot];
          if (classInfo) {
            const courseCode = classInfo.course_code || classInfo.code || 'N/A';
            const courseName = classInfo.course_name || classInfo.name || '';
            const teacher = classInfo.teacher || 'N/A';
            const room = classInfo.room || 'N/A';
            const isLab = classInfo.type === 'lab';
            
            tableRows += `<td class="${isLab ? 'lab-slot' : 'lecture-slot'}">
              <div class="class-card ${isLab ? 'lab-card' : 'lecture-card'}">
                <div class="course-header">
                  <div class="course-code">${courseCode}</div>
                  ${isLab ? '<div class="lab-badge">LAB</div>' : ''}
                </div>
                ${courseName ? `<div class="course-name">${courseName}</div>` : ''}
                <div class="teacher">${teacher}</div>
                <div class="room">${room}</div>
              </div>
            </td>`;
          } else {
            tableRows += `<td class="free-slot">
              <div class="class-card free-card">
                <div class="free-text">Free</div>
              </div>
            </td>`;
          }
        }
      });
      tableRows += '</tr>';
    });
    
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${institution_name} - Weekly Timetable</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 20px;
            min-height: 100vh;
          }
          
          .container {
            max-width: 1400px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.1);
            overflow: hidden;
          }
          
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px;
            text-align: center;
            position: relative;
          }
          
          .header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="0.5"/></pattern></defs><rect width="100" height="100" fill="url(%23grid)"/></svg>');
            opacity: 0.3;
          }
          
          .header-content {
            position: relative;
            z-index: 1;
          }
          
          .institution-name {
            font-size: 2.5em;
            font-weight: 700;
            margin-bottom: 10px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
          }
          
          .subtitle {
            font-size: 1.2em;
            opacity: 0.9;
            font-weight: 300;
          }
          
          .timetable-container {
            padding: 30px;
            overflow-x: auto;
          }
          
          .timetable {
            width: 100%;
            border-collapse: separate;
            border-spacing: 8px;
            margin-top: 20px;
          }
          
          .timetable th {
            background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
            color: white;
            padding: 20px 15px;
            font-weight: 600;
            text-align: center;
            border-radius: 12px;
            box-shadow: 0 4px 15px rgba(79, 172, 254, 0.3);
            position: relative;
            font-size: 1.1em;
          }
          
          .timetable th:first-child {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
          }
          
          .timetable td {
            padding: 8px;
            vertical-align: top;
            position: relative;
          }
          
          .time-slot {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            color: white;
            font-weight: 600;
            text-align: center;
            border-radius: 12px;
            box-shadow: 0 4px 15px rgba(240, 147, 251, 0.3);
            font-size: 1.1em;
            padding: 20px 15px !important;
          }
          
          .class-card {
            border-radius: 12px;
            padding: 15px;
            text-align: center;
            min-height: 120px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            box-shadow: 0 6px 20px rgba(0,0,0,0.1);
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
          }
          
          .class-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, rgba(255,255,255,0.3), rgba(255,255,255,0.1), rgba(255,255,255,0.3));
          }
          
          .lecture-card {
            background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
            color: #2d3748;
            border-left: 5px solid #38b2ac;
          }
          
          .lab-card {
            background: linear-gradient(135deg, #d299c2 0%, #fef9d7 100%);
            color: #2d3748;
            border-left: 5px solid #805ad5;
          }
          
          .lunch-card {
            background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
            color: #744210;
            border-left: 5px solid #ed8936;
          }
          
          .free-card {
            background: linear-gradient(135deg, #e2e8f0 0%, #f7fafc 100%);
            color: #718096;
            border-left: 5px solid #cbd5e0;
          }
          
          .course-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 8px;
          }
          
          .course-code {
            font-weight: 700;
            font-size: 1.1em;
            color: inherit;
          }
          
          .course-name {
            font-size: 0.85em;
            opacity: 0.8;
            margin-bottom: 6px;
            font-style: italic;
          }
          
          .teacher {
            font-weight: 600;
            margin-bottom: 4px;
            font-size: 0.9em;
          }
          
          .room {
            font-size: 0.8em;
            opacity: 0.8;
          }
          
          .lab-badge {
            background: #805ad5;
            color: white;
            padding: 2px 8px;
            border-radius: 20px;
            font-size: 0.7em;
            font-weight: 600;
          }
          
          .lunch-icon {
            font-size: 1.5em;
            margin-bottom: 8px;
          }
          
          .time-range {
            font-size: 0.8em;
            opacity: 0.8;
            margin-top: 4px;
          }
          
          .free-text {
            font-style: italic;
            font-size: 0.9em;
          }
          
          @media print {
            body {
              background: white;
              padding: 0;
            }
            
            .container {
              box-shadow: none;
              border-radius: 0;
            }
            
            .header {
              background: #667eea !important;
              -webkit-print-color-adjust: exact;
              color-adjust: exact;
            }
            
            .class-card {
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
              -webkit-print-color-adjust: exact;
              color-adjust: exact;
            }
            
            .timetable th, .time-slot {
              -webkit-print-color-adjust: exact;
              color-adjust: exact;
            }
          }
          
          @media (max-width: 768px) {
            .header {
              padding: 20px;
            }
            
            .institution-name {
              font-size: 1.8em;
            }
            
            .timetable-container {
              padding: 15px;
            }
            
            .class-card {
              min-height: 100px;
              padding: 10px;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="header-content">
              <div class="institution-name">${institution_name}</div>
              <div class="subtitle">Weekly Timetable</div>
            </div>
          </div>
          
          <div class="timetable-container">
            <table class="timetable">
              <thead>
                <tr>
                  <th>Time / Day</th>
                  ${sortedDays.map(day => `<th>${day}</th>`).join('')}
                </tr>
              </thead>
              <tbody>
                ${tableRows}
              </tbody>
            </table>
          </div>
        </div>
        
        <script>
          // Auto-print after 1 second
          setTimeout(() => {
            window.print();
          }, 1000);
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
      institutionName: institutionData?.name || 'Institution',
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
            {/* CSV Export */}
            <div className="bg-slate-700/40 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:border-green-400/40 transition-all duration-300">
              <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-green-500/20 rounded-xl flex items-center justify-center">
                  <FileSpreadsheet className="h-8 w-8 text-green-400" />
                </div>
                <div>
                  <h4 className="text-white font-semibold text-lg mb-2">Export to Excel/CSV</h4>
                  <p className="text-white/80 text-sm mb-4">
                    Download CSV file with complete timetable data
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
                  <h4 className="text-white font-semibold text-lg mb-2">Download as PDF</h4>
                  <p className="text-white/80 text-sm mb-4">
                    Beautiful PDF with styled timetable layout
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
                  <h4 className="text-white/90 font-medium mb-3">Institution Details</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-white/70">Institution:</span>
                      <span className="text-white font-semibold">{stats.institutionName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/70">Generated:</span>
                      <span className="text-white">{stats.generatedAt}</span>
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
                  <h4 className="text-blue-200 font-semibold mb-1">Export Features</h4>
                  <p className="text-blue-100 text-sm">
                    CSV files include complete timetable data with lunch breaks and can be opened in Excel. 
                    PDF files are beautifully formatted and download automatically with proper institution names.
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
