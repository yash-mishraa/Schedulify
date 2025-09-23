'use client';

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2 } from 'lucide-react';

const InputForm = ({ onSubmit, loading, validationResults }) => {
  const { register, control, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
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
    }
  });

  const { fields: courseFields, append: appendCourse, remove: removeCourse } = useFieldArray({
    control,
    name: 'courses'
  });

  const { fields: constraintFields, append: appendConstraint, remove: removeConstraint } = useFieldArray({
    control,
    name: 'custom_constraints'
  });

  const workingDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const selectedDays = watch('working_days');

  const toggleDay = (day) => {
    const currentDays = selectedDays || [];
    if (currentDays.includes(day)) {
      setValue('working_days', currentDays.filter(d => d !== day));
    } else {
      setValue('working_days', [...currentDays, day]);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
                {...register('start_time', { required: 'Start time is required' })}
              />
              {errors.start_time && <p className="text-red-600 text-sm">{errors.start_time.message}</p>}
            </div>
            <div>
              <Label htmlFor="end_time">End Time</Label>
              <Input
                id="end_time"
                type="time"
                {...register('end_time', { required: 'End time is required' })}
              />
              {errors.end_time && <p className="text-red-600 text-sm">{errors.end_time.message}</p>}
            </div>
            <div>
              <Label htmlFor="lecture_duration">Lecture Duration (minutes)</Label>
              <Select onValueChange={(value) => setValue('lecture_duration', parseInt(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="45">45 minutes</SelectItem>
                  <SelectItem value="60">60 minutes</SelectItem>
                  <SelectItem value="90">90 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="lunch_start">Lunch Start Time</Label>
              <Input
                id="lunch_start"
                type="time"
                {...register('lunch_start')}
              />
            </div>
            <div>
              <Label htmlFor="lunch_end">Lunch End Time</Label>
              <Input
                id="lunch_end"
                type="time"
                {...register('lunch_end')}
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
                  checked={selectedDays?.includes(day) || false}
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
              onClick={() => appendCourse({ code: '', name: '', teacher: '', lectures_per_week: 3, type: 'lecture' })}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Course
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {courseFields.map((field, index) => (
            <div key={field.id} className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Course {index + 1}</h4>
                {courseFields.length > 1 && (
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
                  <Label htmlFor={`courses.${index}.code`}>Course Code</Label>
                  <Input
                    {...register(`courses.${index}.code`, { required: 'Course code is required' })}
                    placeholder="CS101"
                  />
                </div>
                <div>
                  <Label htmlFor={`courses.${index}.name`}>Course Name</Label>
                  <Input
                    {...register(`courses.${index}.name`, { required: 'Course name is required' })}
                    placeholder="Data Structures"
                  />
                </div>
                <div>
                  <Label htmlFor={`courses.${index}.teacher`}>Teacher</Label>
                  <Input
                    {...register(`courses.${index}.teacher`, { required: 'Teacher name is required' })}
                    placeholder="Dr. Smith"
                  />
                </div>
                <div>
                  <Label htmlFor={`courses.${index}.lectures_per_week`}>Lectures/Week</Label>
                  <Input
                    type="number"
                    min="1"
                    max="20"
                    {...register(`courses.${index}.lectures_per_week`, { 
                      required: 'Number of lectures is required',
                      min: 1,
                      max: 20
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor={`courses.${index}.type`}>Type</Label>
                  <Select onValueChange={(value) => setValue(`courses.${index}.type`, value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lecture">Lecture</SelectItem>
                      <SelectItem value="lab">Lab</SelectItem>
                    </SelectContent>
                  </Select>
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
                {...register('resources.classrooms', { 
                  required: 'Number of classrooms is required',
                  min: 1
                })}
              />
            </div>
            <div>
              <Label htmlFor="labs">Number of Labs</Label>
              <Input
                id="labs"
                type="number"
                min="0"
                {...register('resources.labs', { min: 0 })}
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
              onClick={() => appendConstraint('')}
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
          
          {constraintFields.map((field, index) => (
            <div key={field.id} className="flex items-center space-x-2">
              <Textarea
                {...register(`custom_constraints.${index}`)}
                placeholder="Enter custom constraint..."
                className="flex-1"
              />
              {constraintFields.length > 1 && (
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
