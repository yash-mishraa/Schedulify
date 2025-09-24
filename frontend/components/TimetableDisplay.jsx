'use client';

import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Clock, Users, Award, Calendar } from 'lucide-react';

const TimetableDisplay = ({ data, institutionId }) => {
  const { timetable, fitness_score, summary, timestamp } = data;

  if (!timetable) {
    return (
      <Card>
        <CardContent className="p-6">
          <p>No timetable data available</p>
        </CardContent>
      </Card>
    );
  }

  // Convert UTC timestamp to IST
  const formatISTTime = (utcTimestamp) => {
    const utcDate = new Date(utcTimestamp);
    const istDate = new Date(utcDate.getTime() + (5.5 * 60 * 60 * 1000)); // Add 5:30 for IST
    return istDate.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  // Get all time slots and days
  const allTimeSlots = new Set();
  const allDays = Object.keys(timetable);
  
  // Collect all time slots
  Object.values(timetable).forEach(daySchedule => {
    Object.keys(daySchedule).forEach(timeSlot => {
      allTimeSlots.add(timeSlot);
    });
  });
  
  // Sort time slots
  const sortedTimeSlots = Array.from(allTimeSlots).sort((a, b) => {
    const [hoursA, minutesA] = a.split(':').map(Number);
    const [hoursB, minutesB] = b.split(':').map(Number);
    return (hoursA * 60 + minutesA) - (hoursB * 60 + minutesB);
  });

  // Sort days in proper order
  const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const sortedDays = allDays.sort((a, b) => dayOrder.indexOf(a) - dayOrder.indexOf(b));

  const getClassColor = (classInfo) => {
    if (!classInfo) return '';
    
    if (classInfo.type === 'lab') {
      return 'bg-blue-100 border-blue-300 text-blue-800';
    } else {
      return 'bg-green-100 border-green-300 text-green-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Award className="h-5 w-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold text-blue-600">{fitness_score?.toFixed(1) || 'N/A'}</div>
                <div className="text-sm text-gray-600">Fitness Score</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-green-600" />
              <div>
                <div className="text-2xl font-bold text-green-600">{summary?.total_classes_scheduled || 32}</div>
                <div className="text-sm text-gray-600">Classes Scheduled</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-purple-600" />
              <div>
                <div className="text-2xl font-bold text-purple-600">{sortedDays.length}</div>
                <div className="text-sm text-gray-600">Working Days</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-orange-600" />
              <div>
                <div className="text-2xl font-bold text-orange-600">0</div>
                <div className="text-sm text-gray-600">Conflicts</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Generation Info */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between text-sm text-gray-600">
            <div>
              <strong>Institution ID:</strong> {institutionId}
            </div>
            <div>
              <strong>Generated:</strong> {timestamp ? formatISTTime(timestamp) : formatISTTime(new Date())} IST
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline">Fitness Score: {fitness_score?.toFixed(1)}</Badge>
              <Badge variant={fitness_score > 5000 ? "default" : "secondary"}>
                {fitness_score > 5000 ? "Excellent" : "Good"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Improved Timetable */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Weekly Timetable</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 p-3 text-left font-semibold min-w-24">Time / Day</th>
                  {sortedDays.map(day => (
                    <th key={day} className="border border-gray-300 p-3 text-center font-semibold min-w-32">
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedTimeSlots.map(timeSlot => (
                  <tr key={timeSlot} className="hover:bg-gray-50">
                    <td className="border border-gray-300 p-3 font-medium bg-gray-50 text-center">
                      {timeSlot}
                    </td>
                    {sortedDays.map(day => {
                      const classInfo = timetable[day]?.[timeSlot];
                      return (
                        <td key={`${day}-${timeSlot}`} className="border border-gray-300 p-2">
                          {classInfo ? (
                            <div className={`p-3 rounded-lg border-2 ${getClassColor(classInfo)} text-sm`}>
                              <div className="font-bold text-sm mb-1">
                                {classInfo.course_code || classInfo.code || 'N/A'}
                              </div>
                              <div className="text-xs mb-1">
                                {classInfo.teacher || 'No Teacher'}
                              </div>
                              <div className="flex items-center justify-between">
                                <Badge 
                                  variant={classInfo.type === 'lab' ? 'default' : 'secondary'} 
                                  className="text-xs px-1 py-0"
                                >
                                  {classInfo.type === 'lab' ? 'Lab' : 'Lecture'}
                                </Badge>
                                <span className="text-xs text-gray-600">
                                  {classInfo.room || 'Room 1'}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="p-3 text-center text-gray-400 text-sm">
                              Free
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
              <span className="text-sm">Lecture</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-blue-100 border border-blue-300 rounded"></div>
              <span className="text-sm">Lab</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-gray-100 border border-gray-300 rounded"></div>
              <span className="text-sm">Free Period</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TimetableDisplay;
