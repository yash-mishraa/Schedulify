'use client';

import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/Button';
import { Download, FileText, Calendar, Clock } from 'lucide-react';

const ExportOptions = ({ institutionId, timetableData }) => {
  const handleExport = async (format) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/timetable/export/${institutionId}?format=${format}`,
        { method: 'POST' }
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        
        // Use IST date for filename
        const istDate = new Date().toLocaleString('en-IN', {
          timeZone: 'Asia/Kolkata',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        }).replace(/\//g, '-');
        
        link.download = `timetable_${institutionId}_${istDate}.${format}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  // Format IST time
  const formatISTTime = (utcTimestamp) => {
    const utcDate = new Date(utcTimestamp);
    const istDate = new Date(utcDate.getTime() + (5.5 * 60 * 60 * 1000));
    return istDate.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Download className="h-5 w-5" />
            <span>Export Timetable</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              onClick={() => handleExport('xlsx')}
              className="h-20 flex-col space-y-2"
              variant="outline"
            >
              <FileText className="h-8 w-8" />
              <div className="text-center">
                <div className="font-medium">Export to Excel</div>
                <div className="text-sm text-gray-600">Download as .xlsx file</div>
              </div>
            </Button>

            <Button
              onClick={() => handleExport('pdf')}
              className="h-20 flex-col space-y-2"
              variant="outline"
            >
              <Download className="h-8 w-8" />
              <div className="text-center">
                <div className="font-medium">Export to PDF</div>
                <div className="text-sm text-gray-600">Download as .pdf file</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Export Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p><strong>Institution ID:</strong></p>
              <p className="text-gray-600">{institutionId}</p>
            </div>
            <div>
              <p><strong>Generated At:</strong></p>
              <p className="text-gray-600">{formatISTTime(timetableData.timestamp || new Date())} IST</p>
            </div>
            <div>
              <p><strong>Fitness Score:</strong></p>
              <p className="text-gray-600">{timetableData.fitness_score?.toFixed(1)}</p>
            </div>
            <div>
              <p><strong>Total Classes:</strong></p>
              <p className="text-gray-600">{timetableData.summary?.total_classes_scheduled || 32}</p>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-gray-50 rounded-md">
            <p className="text-sm text-gray-700">
              Export includes the complete timetable with course information, teacher assignments, 
              room allocations, and summary statistics. Files are optimized for printing and sharing.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExportOptions;
