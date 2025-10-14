'use client';

import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Clock, Users, Award, Calendar, Utensils, BookOpen, GraduationCap, Edit3, Sparkles } from 'lucide-react';

const TimetableDisplay = ({ data, institutionId, onEdit }) => {
  const { timetable, fitness_score, summary, timestamp, constraints } = data;

  if (!timetable) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-white/70">No timetable data available</p>
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

  return (
    <div className="space-y-6">
      {/* Edit Button - Glass Theme */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="text-lg font-semibold text-white flex items-center">
              <Sparkles className="h-5 w-5 mr-2 text-purple-400" />
              Generated Timetable
            </div>
            <button
  onClick={onEdit}
  className="btn-secondary flex items-center"
>
  <Edit3 className="h-4 w-4 mr-2" />
  Edit Configuration
</button>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Summary Cards - Glass Theme */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card-hover p-6">
          <div className="flex items-center space-x-3">
            <Award className="h-8 w-8 text-purple-400 glow-purple rounded-full p-1 bg-purple-500/20" />
            <div>
              <div className="text-2xl font-bold text-white">{fitness_score?.toFixed(1) || 'N/A'}</div>
              <div className="text-sm text-white/70">Fitness Score</div>
            </div>
          </div>
        </div>

        <div className="glass-card-hover p-6">
          <div className="flex items-center space-x-3">
            <BookOpen className="h-8 w-8 text-green-400 rounded-full p-1 bg-green-500/20" />
            <div>
              <div className="text-2xl font-bold text-white">{stats.totalClasses}</div>
              <div className="text-sm text-white/70">Total Classes</div>
            </div>
          </div>
        </div>

        <div className="glass-card-hover p-6">
          <div className="flex items-center space-x-3">
            <GraduationCap className="h-8 w-8 text-blue-400 glow-blue rounded-full p-1 bg-blue-500/20" />
            <div>
              <div className="text-2xl font-bold text-white">{stats.lectureCount}</div>
              <div className="text-sm text-white/70">Lectures</div>
            </div>
          </div>
        </div>

        <div className="glass-card-hover p-6">
          <div className="flex items-center space-x-3">
            <Calendar className="h-8 w-8 text-orange-400 rounded-full p-1 bg-orange-500/20" />
            <div>
              <div className="text-2xl font-bold text-white">{stats.labCount}</div>
              <div className="text-sm text-white/70">Lab Sessions</div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Statistics - Glass Theme */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-white">Course Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(stats.courseStats).map(([course, count]) => (
                <div key={course} className="flex justify-between items-center p-2 rounded-lg bg-white/5">
                  <span className="text-sm font-medium text-white">{course}</span>
                  <div className="glass-badge text-xs">{count} classes</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-white">Teacher Workload</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(stats.teacherWorkload).map(([teacher, workload]) => (
                <div key={teacher} className="flex justify-between items-center p-2 rounded-lg bg-white/5">
                  <span className="text-sm font-medium text-white">{teacher}</span>
                  <div className={`glass-badge text-xs ${
                    workload > 8 
                      ? 'bg-gradient-to-r from-red-500/30 to-red-400/30' 
                      : 'bg-gradient-to-r from-green-500/30 to-green-400/30'
                  }`}>
                    {workload} hours/week
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Generation Info - Glass Theme */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between text-sm">
            <div className="text-white/80">
              <strong className="text-purple-300">Institution ID:</strong> <span className="font-mono">{institutionId}</span>
            </div>
            <div className="text-white/80">
              <strong className="text-blue-300">Generated At:</strong> {formatISTTime(timestamp)} IST
            </div>
            <div className="flex items-center space-x-2">
              <div className="glass-badge text-xs">
                <Utensils className="h-3 w-3 mr-1 inline" />
                Lunch: {lunchStart} - {lunchEnd}
              </div>
              <div className={`glass-badge text-xs ${
                fitness_score > 5000 
                  ? 'bg-gradient-to-r from-green-500/30 to-emerald-500/30' 
                  : 'bg-gradient-to-r from-yellow-500/30 to-orange-500/30'
              }`}>
                {fitness_score > 5000 ? "Excellent" : "Good"}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Glass Timetable */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl text-white">Weekly Timetable</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <div className="glass-table">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 backdrop-blur-sm border-b border-white/20 text-white font-semibold p-4 text-left min-w-24">
                      Time / Day
                    </th>
                    {sortedDays.map(day => (
                      <th key={day} className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 backdrop-blur-sm border-b border-white/20 text-white font-semibold p-4 text-center min-w-32">
                        {day}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedTimeSlots.map(timeSlot => (
                    <tr key={timeSlot} className="hover:bg-white/5 transition-colors">
                      <td className="border-b border-white/10 p-4 font-medium bg-white/5 text-center text-white">
                        {timeSlot}
                      </td>
                      {sortedDays.map(day => {
                        if (isLunchTime(timeSlot)) {
                          return (
                            <td key={`${day}-${timeSlot}`} className="border-b border-white/10 p-2">
                              <div className="lunch-slot p-3 text-center">
                                <div className="flex items-center justify-center space-x-2">
                                  <Utensils className="h-4 w-4" />
                                  <span className="font-bold">LUNCH</span>
                                </div>
                                <div className="text-xs mt-1 opacity-90">
                                  {lunchStart} - {lunchEnd}
                                </div>
                              </div>
                            </td>
                          );
                        }

                        const classInfo = timetable[day]?.[timeSlot];
                        return (
                          <td key={`${day}-${timeSlot}`} className="border-b border-white/10 p-2">
                            {classInfo ? (
                              <div className={
                                classInfo.type === 'lab' ? 'lab-slot p-3 text-sm' :
                                'lecture-slot p-3 text-sm'
                              }>
                                <div className="font-bold text-sm mb-1">
                                  {classInfo.course_code || classInfo.code || 'N/A'}
                                  {classInfo.type === 'lab' && classInfo.is_consecutive && (
                                    <span className="text-xs ml-1 bg-white/20 px-1 rounded">
                                      {classInfo.session_part}
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs mb-1 opacity-90">
                                  {classInfo.teacher || 'No Teacher'}
                                </div>
                                <div className="flex items-center justify-between">
                                  <div className="bg-white/20 backdrop-blur-sm border border-white/30 text-white px-2 py-1 rounded-full text-xs font-medium">
                                    {classInfo.type === 'lab' ? 'Lab' : 'Lecture'}
                                    {classInfo.type === 'lab' && classInfo.total_duration > 1 && (
                                      <span className="ml-1">({classInfo.total_duration}p)</span>
                                    )}
                                  </div>
                                  <span className="text-xs opacity-80">
                                    {classInfo.room || 'Room 1'}
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <div className="free-slot p-3 text-center text-sm">
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
          </div>
        </CardContent>
      </Card>

      {/* Legend - Glass Theme */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-white">Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-gradient-to-r from-green-500/30 to-emerald-500/30 border border-green-300/40 rounded"></div>
              <span className="text-sm text-white/80">Lecture</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-gradient-to-r from-blue-500/30 to-cyan-500/30 border border-blue-300/40 rounded"></div>
              <span className="text-sm text-white/80">Lab Session</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-gradient-to-r from-orange-500/30 to-yellow-500/30 border border-orange-300/40 rounded"></div>
              <span className="text-sm text-white/80">Lunch Break</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-white/5 border border-white/20 rounded"></div>
              <span className="text-sm text-white/80">Free Period</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TimetableDisplay;
