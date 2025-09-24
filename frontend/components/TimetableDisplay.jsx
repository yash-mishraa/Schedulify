'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertTriangle, TrendingUp } from 'lucide-react';

const TimetableDisplay = ({ data, institutionId }) => {
  const { timetable, fitness_score, summary, generation_count } = data;

  const renderTimetableCell = (cellData) => {
    if (!cellData) {
      return (
        <div className="h-24 border border-gray-200 bg-gray-50 flex items-center justify-center text-gray-400 text-sm">
          Free
        </div>
      );
    }

    const bgColor = cellData.type === 'lab' ? 'bg-blue-100 border-blue-300' : 'bg-green-100 border-green-300';
    const textColor = cellData.type === 'lab' ? 'text-blue-800' : 'text-green-800';

    return (
      <div className={`h-24 border-2 ${bgColor} ${textColor} p-2 flex flex-col justify-between text-sm`}>
        <div>
          <div className="font-bold text-xs">{cellData.course_code}</div>
          <div className="text-xs truncate">{cellData.teacher}</div>
        </div>
        <div className="flex justify-between items-end">
          <Badge variant={cellData.type === 'lab' ? 'default' : 'secondary'} className="text-xs px-1">
            {cellData.type}
          </Badge>
          <span className="text-xs font-medium">{cellData.room}</span>
        </div>
      </div>
    );
  };

  const timeSlots = Object.keys(Object.values(timetable)[0] || {}).sort();
  const days = Object.keys(timetable).sort();

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Fitness Score</p>
                <p className="text-2xl font-bold text-blue-600">{fitness_score.toFixed(1)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Classes Scheduled</p>
                <p className="text-2xl font-bold text-green-600">{summary.total_classes_scheduled}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Generations</p>
                <p className="text-2xl font-bold text-orange-600">{generation_count}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Constraint Violations */}
      {summary.constraint_violations?.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              <p className="font-medium">Constraint Violations:</p>
              <ul className="list-disc list-inside space-y-1">
                {summary.constraint_violations.map((violation, index) => (
                  <li key={index}>{violation}</li>
                ))}
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Recommendations */}
      {summary.recommendations?.length > 0 && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              <p className="font-medium">Recommendations:</p>
              <ul className="list-disc list-inside space-y-1">
                {summary.recommendations.map((recommendation, index) => (
                  <li key={index}>{recommendation}</li>
                ))}
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Weekly Timetable */}
      <Card>
        <CardHeader>
          <CardTitle>Weekly Timetable</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="min-w-full">
              <div className="grid grid-cols-8 gap-1">
                {/* Header */}
                <div className="bg-gray-100 p-2 text-center font-bold text-sm">
                  Time / Day
                </div>
                {days.map(day => (
                  <div key={day} className="bg-gray-100 p-2 text-center font-bold text-sm">
                    {day}
                  </div>
                ))}

                {/* Time slots and schedule */}
                {timeSlots.map(timeSlot => (
                  <>
                    <div key={timeSlot} className="bg-gray-50 p-2 text-center font-medium text-sm flex items-center justify-center border">
                      {timeSlot}
                    </div>
                    {days.map(day => (
                      <div key={`${day}-${timeSlot}`}>
                        {renderTimetableCell(timetable[day]?.[timeSlot])}
                      </div>
                    ))}
                  </>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Course Completion Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Course Completion Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Course Code</th>
                  <th className="text-left p-2">Scheduled</th>
                  <th className="text-left p-2">Required</th>
                  <th className="text-left p-2">Completion Rate</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(summary.courses_completion || {}).map(([courseCode, completion]) => (
                  <tr key={courseCode} className="border-b">
                    <td className="p-2 font-medium">{courseCode}</td>
                    <td className="p-2">{completion.scheduled}</td>
                    <td className="p-2">{completion.required}</td>
                    <td className="p-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${completion.completion_rate}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">
                          {completion.completion_rate.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Teacher Workload */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Teacher Workload</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(summary.teacher_workload || {}).map(([teacher, hours]) => (
                <div key={teacher} className="flex items-center justify-between">
                  <span className="font-medium">{teacher}</span>
                  <Badge variant="outline">{hours} classes</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Room Utilization</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(summary.room_utilization || {}).map(([room, usage]) => (
                <div key={room} className="flex items-center justify-between">
                  <span className="font-medium">{room}</span>
                  <Badge variant="outline">{usage} classes</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TimetableDisplay;
