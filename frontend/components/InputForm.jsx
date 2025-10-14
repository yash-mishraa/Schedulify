'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/Button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Checkbox } from './ui/checkbox';
import { Plus, Trash2, Edit3 } from 'lucide-react';

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
        <Card className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-blue-400/30">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 text-blue-100">
              <Edit3 className="h-4 w-4" />
              <span className="text-sm font-medium">
                Edit Mode: Modify your settings below and click "Generate Optimized Timetable" to regenerate.
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Basic Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-white">Institution Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="start_time" className="text-label">Start Time</Label>
              <Input
                id="start_time"
                type="time"
                className="glass-input"
                value={formData.start_time}
                onChange={(e) => setFormData({...formData, start_time: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="end_time" className="text-label">End Time</Label>
              <Input
                id="end_time"
                type="time"
                className="glass-input"
                value={formData.end_time}
                onChange={(e) => setFormData({...formData, end_time: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="lecture_duration" className="text-label">Lecture Duration (minutes)</Label>
              <select 
                className="glass-select"
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
                <option value="65" className="bg-slate-800 text-white">65 minutes</option>
                <option value="75" className="bg-slate-800 text-white">75 minutes</option>
                <option value="90" className="bg-slate-800 text-white">90 minutes</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="lunch_start" className="text-label">Lunch Start Time</Label>
              <Input
                id="lunch_start"
                type="time"
                className="glass-input"
                value={formData.lunch_start}
                onChange={(e) => setFormData({...formData, lunch_start: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="lunch_end" className="text-label">Lunch End Time</Label>
              <Input
                id="lunch_end"
                type="time"
                className="glass-input"
                value={formData.lunch_end}
                onChange={(e) => setFormData({...formData, lunch_end: e.target.value})}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Working Days */}
      <Card>
        <CardHeader>
          <CardTitle className="text-white">Working Days</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {workingDays.map((day) => (
              <div key={day} className="flex items-center space-x-3">
                <Checkbox
                  id={day}
                  checked={formData.working_days?.includes(day) || false}
                  onCheckedChange={() => toggleDay(day)}
                />
                <Label htmlFor={day} className="text-label cursor-pointer">
                  {day}
                </Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Courses */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-white">
            Courses
            <Button
  type="button"
  variant="secondary"
  size="sm"
  onClick={addCourse}
>
  <Plus className="h-4 w-4 mr-2" />
  Add Course
</Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {formData.courses.map((course, index) => (
            <div key={index} className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-white">Course {index + 1}</h4>
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
                    placeholder=" "
                    value={course.code}
                    onChange={(e) => updateCourse(index, 'code', e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-label">Course Name</Label>
                  <Input
                    className="glass-input"
                    placeholder=" "
                    value={course.name}
                    onChange={(e) => updateCourse(index, 'name', e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-label">Teacher</Label>
                  <Input
                    className="glass-input"
                    placeholder=" "
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
                      <option value="2" className="bg-slate-800 text-white">2 periods (90 min)</option>
                      <option value="3" className="bg-slate-800 text-white">3 periods (135 min)</option>
                      <option value="4" className="bg-slate-800 text-white">4 periods (180 min)</option>
                    </select>
                    <div className="text-white/80 text-xs mt-1">
                      {course.lab_duration || 2} × {formData.lecture_duration} min = {(course.lab_duration || 2) * formData.lecture_duration} minutes
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Resources */}
      <Card>
        <CardHeader>
          <CardTitle className="text-white">Available Resources</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="classrooms" className="text-label">Number of Classrooms</Label>
              <Input
                id="classrooms"
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
              <Label htmlFor="labs" className="text-label">Number of Labs</Label>
              <Input
                id="labs"
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
        </CardContent>
      </Card>

      {/* Custom Constraints */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-white">
            Custom Constraints
<Button
  type="button"
  variant="secondary"
  size="sm"
  onClick={addConstraint}
>
  <Plus className="h-4 w-4 mr-2" />
  Add Constraint
</Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-white/80 text-sm mb-4">
            <p className="font-medium mb-2 text-white">Examples of custom constraints:</p>
            <ul className="list-disc list-inside space-y-1 text-xs text-white/70">
              <li>Mr. Arun not available on Monday</li>
              <li>No classes after 4 PM on Friday</li>
              <li>Maximum 6 hours per day for any teacher</li>
            </ul>
            <div className="mt-3 p-3 bg-white/10 rounded-lg text-xs border border-white/20">
              <strong className="text-blue-200">Note:</strong> <span className="text-white/80">Lab sessions automatically take consecutive time slots based on lab duration setting above.</span>
            </div>
          </div>
          
          {formData.custom_constraints.map((constraint, index) => (
            <div key={index} className="flex items-center space-x-2">
              <Textarea
                placeholder="Enter custom constraint..."
                className="glass-textarea flex-1"
                value={constraint}
                onChange={(e) => updateConstraint(index, e.target.value)}
              />
              {formData.custom_constraints.length > 1 && (
<Button
  type="button"
  variant="outline"
  size="sm"
  onClick={() => removeConstraint(index)}
>
  <Trash2 className="h-4 w-4" />
</Button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

<Button type="submit" className="w-full btn-large" disabled={loading}>
  {loading ? 'Generating Timetable...' : initialData ? 'Regenerate Optimized Timetable' : 'Generate Optimized Timetable'}
</Button>
    </form>
  );
};

export default InputForm;
