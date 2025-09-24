'use client';

import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Clock, Users, Award, Calendar, Utensils, BookOpen, GraduationCap } from 'lucide-react';

const TimetableDisplay = ({ data, institutionId, onEdit }) => {
  const { timetable, fitness_score, summary, timestamp, constraints } = data;

  if (!timetable) {
    return (
      <Card>
        <CardContent className="p-6">
          <p>No timetable data available</p>
        </CardContent>
      </Card>
    );
  }

  // Format IST time properly
  const formatISTTime = (timestamp) => {
    if (!timestamp) return new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    
    try {
      const date = new Date(timestamp);
      return date.toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      return new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    }
  };

  // Get lunch time from constraints
  const lunchStart = constraints?.lunch_start || '12:30';
  const lunchEnd = constraints?.lunch_end || '13:30';

  // Helper to check if a time slot is lunch time
  const isLunchTime = (timeSlot) => {
    const [hours, minutes] = timeSlot.split(':').map(Number);
    const slotMinutes = hours * 60 + minutes;
    
    const [lunchStartHours, lunchStartMinutes] = lunchStart.split(':').map(Number);
    const lunchStartTotal = lunchStartHours * 60 + lunchStartMinutes;
    
    const [lunchEndHours, lunchEndMinutes] = lunchEnd.split(':').map(Number);
    const lunchEndTotal = lunchEndHours * 60 + lunchEndMinutes;
    
    return slotMinutes >= lunchStartTotal && slotMinutes < lunchEndTotal;
  };

  // Calculate statistics
  const calculateStats = () => {
    let totalClasses = 0;
    let labCount = 0;
    let lectureCount = 0;
    const teacherWorkload = {};
    const courseStats = {};
    
    Object.values(timetable).forEach(daySchedule => {
      Object.values(daySchedule).forEach(classInfo => {
        if (classInfo) {
          totalClasses++;
          if (classInfo.type === 'lab') labCount++;
          else lectureCount++;
          
          const teacher = classInfo.teacher || 'Unknown';
          teacherWorkload[teacher] = (teacherWorkload[teacher] || 0) + 1;
          
          const course = classInfo.course_code || 'Unknown';
          courseStats[course] = (courseStats[course] || 0) + 1;
        }
      });
    });
    
    return { totalClasses, labCount, lectureCount, teacherWorkload, courseStats };
  };

  const stats = calculateStats();

  // Get all time slots and days
  const allTimeSlots = new Set();
  const allDays = Object.keys(timetable);
  
  Object.values(timetable).forEach(daySchedule => {
    Object.keys(daySchedule).forEach(timeSlot => {
      allTimeSlots.add(timeSlot);
    });
  });

  // Add lunch slot
  const [lunchHour, lunchMinute] = lunchStart.split(':').map(Number);
  const lunchSlot = `${lunchHour.toString().padStart(2, '0')}:${lunchMinute.toString().padStart(2, '0')}`;
  allTimeSlots.add(lunchSlot);
  
  const sortedTimeSlots = Array.from(allTimeSlots).sort((a, b) => {
    const [hoursA, minutesA] = a.split(':').map(Number);
    const [hoursB, minutesB] = b.split(':').map(Number);
    return (hoursA * 60 + minutesA) - (hoursB * 60 + minutesB);
  });

  const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const sortedDays = allDays.sort((a, b) => dayOrder.indexOf(a) - dayOrder.indexOf(b));

  const getClassColor = (classInfo) => {
    if (!classInfo) return '';
    return classInfo.type === 'lab' 
      ? 'bg-blue-100 border-blue-300 text-blue-800'
      : 'bg-green-100 border-green-300 text-green-800';
  };

  return (
    <div className="space-y-6">
      {/* Edit Button */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="text-lg font-semibold">Generated Timetable</div>
            <button
              onClick={onEdit}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Edit Configuration
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
              <BookOpen className="h-5 w-5 text-green-600" />
              <div>
                <div className="text-2xl font-bold text-green-600">{stats.totalClasses}</div>
                <div className="text-sm text-gray-600">Total Classes</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <GraduationCap className="h-5 w-5 text-purple-600" />
              <div>
                <div className="text-2xl font-bold text-purple-600">{stats.lectureCount}</div>
                <div className="text-sm text-gray-600">Lectures</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-orange-600" />
              <div>
                <div className="text-2xl font-bold text-orange-600">{stats.labCount}</div>
                <div className="text-sm text-gray-600">Lab Sessions</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Course Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(stats.courseStats).map(([course, count]) => (
                <div key={course} className="flex justify-between items-center">
                  <span className="text-sm font-medium">{course}</span>
                  <Badge variant="outline">{count} classes</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Teacher Workload</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(stats.teacherWorkload).map(([teacher, workload]) => (
                <div key={teacher} className="flex justify-between items-center">
                  <span className="text-sm font-medium">{teacher}</span>
                  <Badge variant={workload > 8 ? "destructive" : "default"}>
                    {workload} hours/week
                  </Badge>
                </div>
              ))}
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
              <strong>Generated At:</strong> {formatISTTime(timestamp)} IST
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline">Lunch: {lunchStart} - {lunchEnd}</Badge>
              <Badge variant={fitness_score > 5000 ? "default" : "secondary"}>
                {fitness_score > 5000 ? "Excellent" : "Good"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rest of the timetable display code stays the same... */}
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
                      if (isLunchTime(timeSlot)) {
                        return (
                          <td key={`${day}-${timeSlot}`} className="border border-gray-300 p-2">
                            <div className="p-3 rounded-lg bg-orange-100 border-2 border-orange-300 text-orange-800 text-center">
                              <div className="flex items-center justify-center space-x-2">
                                <Utensils className="h-4 w-4" />
                                <span className="font-bold">LUNCH</span>
                              </div>
                              <div className="text-xs mt-1">
                                {lunchStart} - {lunchEnd}
                              </div>
                            </div>
                          </td>
                        );
                      }

                      const classInfo = timetable[day]?.[timeSlot];
                      return (
                        <td key={`${day}-${timeSlot}`} className="border border-gray-300 p-2">
                          {classInfo ? (
  <div className={`p-3 rounded-lg border-2 ${getClassColor(classInfo)} text-sm`}>
    <div className="font-bold text-sm mb-1">
      {classInfo.course_code || classInfo.code || 'N/A'}
      {classInfo.type === 'lab' && classInfo.is_consecutive && (
        <span className="text-xs ml-1 bg-blue-200 px-1 rounded">
          {classInfo.session_part}
        </span>
      )}
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
        {classInfo.type === 'lab' && classInfo.total_duration > 1 && (
          <span className="ml-1">({classInfo.total_duration}p)</span>
        )}
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
              <span className="text-sm">Lab Session</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-orange-100 border border-orange-300 rounded"></div>
              <span className="text-sm">Lunch Break</span>
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
