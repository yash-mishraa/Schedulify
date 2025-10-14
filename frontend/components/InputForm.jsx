'use client';

import { useState, useEffect } from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Checkbox } from './ui/checkbox';
import { Plus, Trash2, Edit3, Clock, Calendar, Users, Settings } from 'lucide-react';

const InputForm = ({ onSubmit, loading, validationResults, initialData }) => {
  const [formData, setFormData] = useState({
    working_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    lecture_duration: 45,
    start_time: '09:15',
    end_time: '16:55',
    lunch_start: '12:30',
    lunch_end: '13:30',
    courses: [
      { code: '', name: '', teacher: '', lectures_per_week: 3, type: 'lecture', lab_duration: 2 }
    ],
    resources: { classrooms: 10, labs: 5 },
    custom_constraints: ['']
  });

  // Load initial data when editing
  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const workingDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const toggleDay = (day) => {
    const currentDays = formData.working_days || [];
    if (currentDays.includes(day)) {
      setFormData({
        ...formData,
        working_days: currentDays.filter(d => d !== day)
      });
    } else {
      setFormData({
        ...formData,
        working_days: [...currentDays, day]
      });
    }
  };

  const addCourse = () => {
    setFormData({
      ...formData,
      courses: [...formData.courses, { code: '', name: '', teacher: '', lectures_per_week: 3, type: 'lecture', lab_duration: 2 }]
    });
  };

  const removeCourse = (index) => {
    setFormData({
      ...formData,
      courses: formData.courses.filter((_, i) => i !== index)
    });
  };

  const updateCourse = (index, field, value) => {
    const newCourses = [...formData.courses];
    newCourses[index] = { ...newCourses[index], [field]: value };
    setFormData({ ...formData, courses: newCourses });
  };

  const addConstraint = () => {
    setFormData({
      ...formData,
      custom_constraints: [...formData.custom_constraints, '']
    });
  };

  const removeConstraint = (index) => {
    setFormData({
      ...formData,
      custom_constraints: formData.custom_constraints.filter((_, i) => i !== index)
    });
  };

  const updateConstraint = (index, value) => {
    const newConstraints = [...formData.custom_constraints];
    newConstraints[index] = value;
    setFormData({ ...formData, custom_constraints: newConstraints });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {initialData && (
        <div className="info-area">
          <div className="flex items-center space-x-2">
            <Edit3 className="h-4 w-4" />
            <span className="text-sm font-medium">
              Edit Mode: Modify your settings below and click "Generate Optimized Timetable" to regenerate.
            </span>
          </div>
        </div>
      )}

      {/* Institution Settings Section - Professional Layout */}
<div className="space-y-0">
  <div className="glass-section-header">
    <h3 className="section-title">
      <Settings className="h-5 w-5 mr-2" />
      Institution Settings
    </h3>
  </div>
  <div className="content-area">
    {/* Time Settings */}
    <div className="space-y-6">
      <div>
        <h4 className="text-white/90 font-medium mb-4">Class Timings</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label className="text-label">Start Time</Label>
            <Input
              type="time"
              className="glass-input"
              value={formData.start_time}
              onChange={(e) => setFormData({...formData, start_time: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-label">End Time</Label>
            <Input
              type="time"
              className="glass-input"
              value={formData.end_time}
              onChange={(e) => setFormData({...formData, end_time: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-label">Lecture Duration (minutes)</Label>
            <select 
              className="glass-select w-full"
              value={formData.lecture_duration}
              onChange={(e) => setFormData({...formData, lecture_duration: parseInt(e.target.value)})}
            >
              <option value="30" className="bg-slate-800 text-white">30 minutes</option>
              <option value="35" className="bg-slate-800 text-white">35 minutes</option>
              <option value="40" className="bg-slate-800 text-white">40 minutes</option>
              <option value="45" className="bg-slate-800 text-white">45 minutes</option>
              <option value="50" className="bg-slate-800 text-white">50 minutes</option>
              <option value="55" className="bg-slate-800 text-white">55 minutes</option>
              <option value="60" className="bg-slate-800 text-white">60 minutes</option>
              <option value="75" className="bg-slate-800 text-white">75 minutes</option>
              <option value="90" className="bg-slate-800 text-white">90 minutes</option>
            </select>
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-white/90 font-medium mb-4">Lunch Break</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="text-label">Lunch Start Time</Label>
            <Input
              type="time"
              className="glass-input"
              value={formData.lunch_start}
              onChange={(e) => setFormData({...formData, lunch_start: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-label">Lunch End Time</Label>
            <Input
              type="time"
              className="glass-input"
              value={formData.lunch_end}
              onChange={(e) => setFormData({...formData, lunch_end: e.target.value})}
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

      {/* Working Days Section */}
      <div className="space-y-0">
        <div className="glass-section-header">
          <h3 className="section-title">
            <Calendar className="h-5 w-5 mr-2" />
            Working Days
          </h3>
        </div>
        <div className="content-area">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {workingDays.map((day) => (
              <div key={day} className="flex items-center space-x-3">
                <Checkbox
                  id={day}
                  checked={formData.working_days?.includes(day) || false}
                  onCheckedChange={() => toggleDay(day)}
                />
                <Label htmlFor={day} className="text-white cursor-pointer text-sm">
                  {day}
                </Label>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Courses Section */}
      <div className="space-y-0">
        <div className="glass-section-header">
          <div className="flex items-center justify-between">
            <h3 className="section-title">
              <Users className="h-5 w-5 mr-2" />
              Courses
            </h3>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={addCourse}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Course
            </Button>
          </div>
        </div>
        <div className="content-area space-y-4">
          {formData.courses.map((course, index) => (
            <div key={index} className="course-card space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-white font-medium">Course {index + 1}</h4>
                {formData.courses.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeCourse(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                <div>
                  <Label className="text-label">Course Code</Label>
                  <Input
                    className="glass-input"
                    placeholder="e.g., CS101"
                    value={course.code}
                    onChange={(e) => updateCourse(index, 'code', e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-label">Course Name</Label>
                  <Input
                    className="glass-input"
                    placeholder="e.g., Data Structures"
                    value={course.name}
                    onChange={(e) => updateCourse(index, 'name', e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-label">Teacher</Label>
                  <Input
                    className="glass-input"
                    placeholder="e.g., Dr. Smith"
                    value={course.teacher}
                    onChange={(e) => updateCourse(index, 'teacher', e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-label">Lectures/Week</Label>
                  <Input
                    className="glass-input"
                    type="number"
                    min="1"
                    max="20"
                    value={course.lectures_per_week}
                    onChange={(e) => updateCourse(index, 'lectures_per_week', parseInt(e.target.value) || 1)}
                  />
                </div>
                <div>
                  <Label className="text-label">Type</Label>
                  <select 
                    className="glass-select"
                    value={course.type}
                    onChange={(e) => updateCourse(index, 'type', e.target.value)}
                  >
                    <option value="lecture" className="bg-slate-800 text-white">Lecture</option>
                    <option value="lab" className="bg-slate-800 text-white">Lab</option>
                  </select>
                </div>
                {course.type === 'lab' && (
                  <div>
                    <Label className="text-label">Lab Duration (periods)</Label>
                    <select 
                      className="glass-select"
                      value={course.lab_duration || 2}
                      onChange={(e) => updateCourse(index, 'lab_duration', parseInt(e.target.value))}
                    >
                      <option value="1" className="bg-slate-800 text-white">1 period</option>
                      <option value="2" className="bg-slate-800 text-white">2 periods</option>
                      <option value="3" className="bg-slate-800 text-white">3 periods</option>
                      <option value="4" className="bg-slate-800 text-white">4 periods</option>
                    </select>
                    <div className="text-white/70 text-xs mt-1">
                      {course.lab_duration || 2} × {formData.lecture_duration} min = {(course.lab_duration || 2) * formData.lecture_duration} minutes
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Resources Section */}
      <div className="space-y-0">
        <div className="glass-section-header">
          <h3 className="section-title">Available Resources</h3>
        </div>
        <div className="content-area">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-label">Number of Classrooms</Label>
              <Input
                type="number"
                min="1"
                className="glass-input"
                value={formData.resources.classrooms}
                onChange={(e) => setFormData({
                  ...formData, 
                  resources: {...formData.resources, classrooms: parseInt(e.target.value) || 1}
                })}
              />
            </div>
            <div>
              <Label className="text-label">Number of Labs</Label>
              <Input
                type="number"
                min="0"
                className="glass-input"
                value={formData.resources.labs}
                onChange={(e) => setFormData({
                  ...formData,
                  resources: {...formData.resources, labs: parseInt(e.target.value) || 0}
                })}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Custom Constraints Section */}
      <div className="space-y-0">
        <div className="glass-section-header">
          <div className="flex items-center justify-between">
            <h3 className="section-title">Custom Constraints</h3>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={addConstraint}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Constraint
            </Button>
          </div>
        </div>
        <div className="content-area space-y-4">
          <div className="info-area">
            <p className="text-white/90 text-sm mb-3 font-medium">Examples of custom constraints:</p>
            <ul className="list-disc list-inside space-y-1 text-sm text-white/70">
              <li>Mr. Arun not available on Monday</li>
              <li>No classes after 4 PM on Friday</li>
              <li>Maximum 6 hours per day for any teacher</li>
            </ul>
            <div className="mt-3 text-xs text-blue-200">
              <strong>Note:</strong> Lab sessions automatically take consecutive time slots based on lab duration setting above.
            </div>
          </div>
          
          {formData.custom_constraints.map((constraint, index) => (
            <div key={index} className="flex items-start space-x-2">
              <Textarea
                placeholder="Enter custom constraint..."
                className="glass-textarea flex-1"
                value={constraint}
                onChange={(e) => updateConstraint(index, e.target.value)}
                rows={2}
              />
              {formData.custom_constraints.length > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeConstraint(index)}
                  className="mt-1"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Submit Button */}
      <div className="pt-4">
        <Button type="submit" className="btn-primary w-full btn-large" disabled={loading}>
          {loading ? (
            <>
              <Clock className="h-4 w-4 mr-2 animate-spin" />
              Generating Timetable...
            </>
          ) : (
            <>
              {initialData ? 'Regenerate Optimized Timetable' : 'Generate Optimized Timetable'}
            </>
          )}
        </Button>
      </div>
    </form>
  );
};

export default InputForm;
