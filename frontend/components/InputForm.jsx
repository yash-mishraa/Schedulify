'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/Button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Checkbox } from './ui/checkbox';
import { Plus, Trash2 } from 'lucide-react';

const InputForm = ({ onSubmit, loading, validationResults }) => {
  const [formData, setFormData] = useState({
    working_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    lecture_duration: 45,
    start_time: '09:15',
    end_time: '16:55',
    lunch_start: '12:30',
    lunch_end: '13:30',
    courses: [
      { code: '', name: '', teacher: '', lectures_per_week: 3, type: 'lecture' }
    ],
    resources: { classrooms: 10, labs: 5 },
    custom_constraints: ['']
  });

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
      courses: [...formData.courses, { code: '', name: '', teacher: '', lectures_per_week: 3, type: 'lecture' }]
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
      {/* Basic Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Institution Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="start_time">Start Time</Label>
              <Input
                id="start_time"
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData({...formData, start_time: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="end_time">End Time</Label>
              <Input
                id="end_time"
                type="time"
                value={formData.end_time}
                onChange={(e) => setFormData({...formData, end_time: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="lecture_duration">Lecture Duration (minutes)</Label>
              <select 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.lecture_duration}
                onChange={(e) => setFormData({...formData, lecture_duration: parseInt(e.target.value)})}
              >
                <option value="30">30 minutes</option>
                <option value="45">45 minutes</option>
                <option value="60">60 minutes</option>
                <option value="90">90 minutes</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="lunch_start">Lunch Start Time</Label>
              <Input
                id="lunch_start"
                type="time"
                value={formData.lunch_start}
                onChange={(e) => setFormData({...formData, lunch_start: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="lunch_end">Lunch End Time</Label>
              <Input
                id="lunch_end"
                type="time"
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
          <CardTitle>Working Days</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {workingDays.map((day) => (
              <div key={day} className="flex items-center space-x-2">
                <Checkbox
                  id={day}
                  checked={formData.working_days?.includes(day) || false}
                  onCheckedChange={() => toggleDay(day)}
                />
                <Label htmlFor={day} className="text-sm font-medium">
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
          <CardTitle className="flex items-center justify-between">
            Courses
            <Button
              type="button"
              variant="outline"
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
            <div key={index} className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Course {index + 1}</h4>
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
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div>
                  <Label>Course Code</Label>
                  <Input
                    placeholder="CS101"
                    value={course.code}
                    onChange={(e) => updateCourse(index, 'code', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Course Name</Label>
                  <Input
                    placeholder="Data Structures"
                    value={course.name}
                    onChange={(e) => updateCourse(index, 'name', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Teacher</Label>
                  <Input
                    placeholder="Dr. Smith"
                    value={course.teacher}
                    onChange={(e) => updateCourse(index, 'teacher', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Lectures/Week</Label>
                  <Input
                    type="number"
                    min="1"
                    max="20"
                    value={course.lectures_per_week}
                    onChange={(e) => updateCourse(index, 'lectures_per_week', parseInt(e.target.value) || 1)}
                  />
                </div>
                <div>
                  <Label>Type</Label>
                  <select 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={course.type}
                    onChange={(e) => updateCourse(index, 'type', e.target.value)}
                  >
                    <option value="lecture">Lecture</option>
                    <option value="lab">Lab</option>
                  </select>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Resources */}
      <Card>
        <CardHeader>
          <CardTitle>Available Resources</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="classrooms">Number of Classrooms</Label>
              <Input
                id="classrooms"
                type="number"
                min="1"
                value={formData.resources.classrooms}
                onChange={(e) => setFormData({
                  ...formData, 
                  resources: {...formData.resources, classrooms: parseInt(e.target.value) || 1}
                })}
              />
            </div>
            <div>
              <Label htmlFor="labs">Number of Labs</Label>
              <Input
                id="labs"
                type="number"
                min="0"
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
          <CardTitle className="flex items-center justify-between">
            Custom Constraints (Guidelines)
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addConstraint}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Constraint
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-gray-600 mb-4">
            <p>Examples:</p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>"Dr. Smith not available on Monday"</li>
              <li>"Labs must be consecutive with lectures"</li>
              <li>"No classes after 4 PM on Friday"</li>
              <li>"Maximum 6 hours per day for any teacher"</li>
            </ul>
          </div>
          
          {formData.custom_constraints.map((constraint, index) => (
            <div key={index} className="flex items-center space-x-2">
              <Textarea
                placeholder="Enter custom constraint..."
                className="flex-1"
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

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Generating Timetable...' : 'Generate Optimized Timetable'}
      </Button>
    </form>
  );
};

export default InputForm;
