'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import axios from 'axios';

const ExportOptions = ({ institutionId, timetableData }) => {
  const [exporting, setExporting] = useState('');

  const handleExport = async (format) => {
    setExporting(format);
    
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/timetable/export/${institutionId}`,
        {},
        {
          params: { format },
          responseType: 'blob'
        }
      );

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      const filename = format === 'xlsx' 
        ? `timetable_${institutionId}_${new Date().toISOString().split('T')[0]}.xlsx`
        : `timetable_${institutionId}_${new Date().toISOString().split('T')[0]}.pdf`;
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setExporting('');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Export Timetable</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              onClick={() => handleExport('xlsx')}
              disabled={exporting === 'xlsx'}
              className="h-20 flex-col space-y-2"
              variant="outline"
            >
              <FileSpreadsheet className="h-8 w-8" />
              <div>
                <div className="font-medium">Export to Excel</div>
                <div className="text-sm text-gray-600">
                  {exporting === 'xlsx' ? 'Generating...' : 'Download as .xlsx file'}
                </div>
              </div>
            </Button>

            <Button
              onClick={() => handleExport('pdf')}
              disabled={exporting === 'pdf'}
              className="h-20 flex-col space-y-2"
              variant="outline"
            >
              <FileText className="h-8 w-8" />
              <div>
                <div className="font-medium">Export to PDF</div>
                <div className="text-sm text-gray-600">
                  {exporting === 'pdf' ? 'Generating...' : 'Download as .pdf file'}
                </div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Export Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Export Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Institution ID:</span>
              <p className="text-gray-600">{institutionId}</p>
            </div>
            <div>
              <span className="font-medium">Generated At:</span>
              <p className="text-gray-600">
                {new Date(timetableData.timestamp).toLocaleString()}
              </p>
            </div>
            <div>
              <span className="font-medium">Fitness Score:</span>
              <p className="text-gray-600">{timetableData.fitness_score.toFixed(1)}</p>
            </div>
            <div>
              <span className="font-medium">Total Classes:</span>
              <p className="text-gray-600">{timetableData.summary.total_classes_scheduled}</p>
            </div>
          </div>
          
          <div className="pt-4 border-t">
            <p className="text-sm text-gray-600">
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
