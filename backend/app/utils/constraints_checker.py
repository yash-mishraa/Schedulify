from typing import Dict, List, Any, Set, Tuple, Optional
from datetime import datetime, timedelta
from app.models.constraints import (
    ConstraintSet, Constraint, ConstraintType, 
    TeacherAvailabilityConstraint, RoomAvailabilityConstraint,
    TimeRestrictionConstraint, WorkloadLimitConstraint,
    LunchBreakConstraint, ConsecutiveClassesConstraint
)
import logging
import re

logger = logging.getLogger(__name__)

class ConstraintsChecker:
    """Advanced constraints checker for timetable validation"""
    
    def __init__(self):
        self.violation_weights = {
            ConstraintType.TEACHER_AVAILABILITY: 10,
            ConstraintType.ROOM_AVAILABILITY: 8,
            ConstraintType.TIME_RESTRICTION: 6,
            ConstraintType.WORKLOAD_LIMIT: 7,
            ConstraintType.LUNCH_BREAK: 5,
            ConstraintType.CONSECUTIVE_CLASSES: 4,
            ConstraintType.CUSTOM: 3
        }
    
    def check_all_constraints(self, 
                            timetable: Dict[str, Any], 
                            constraint_set: ConstraintSet) -> List[str]:
        """Check all constraints and return list of violations"""
        violations = []
        
        for constraint in constraint_set.constraints:
            if not constraint.is_active:
                continue
            
            constraint_violations = self.check_constraint(timetable, constraint)
            violations.extend(constraint_violations)
        
        return violations
    
    def check_constraint(self, 
                        timetable: Dict[str, Any], 
                        constraint: Constraint) -> List[str]:
        """Check a specific constraint and return violations"""
        
        checker_methods = {
            ConstraintType.TEACHER_AVAILABILITY: self._check_teacher_availability,
            ConstraintType.ROOM_AVAILABILITY: self._check_room_availability,
            ConstraintType.TIME_RESTRICTION: self._check_time_restriction,
            ConstraintType.WORKLOAD_LIMIT: self._check_workload_limit,
            ConstraintType.LUNCH_BREAK: self._check_lunch_break,
            ConstraintType.CONSECUTIVE_CLASSES: self._check_consecutive_classes,
            ConstraintType.CUSTOM: self._check_custom_constraint
        }
        
        checker_method = checker_methods.get(constraint.type)
        if checker_method:
            try:
                return checker_method(timetable, constraint)
            except Exception as e:
                logger.error(f"Error checking constraint {constraint.id}: {str(e)}")
                return [f"Error checking constraint: {constraint.description}"]
        
        return []
    
    def _check_teacher_availability(self, 
                                  timetable: Dict[str, Any], 
                                  constraint: TeacherAvailabilityConstraint) -> List[str]:
        """Check teacher availability constraints"""
        violations = []
        teacher_name = constraint.teacher_name.lower()
        
        for day, day_schedule in timetable.items():
            # Check unavailable days
            if day in constraint.unavailable_days:
                for time_slot, class_info in day_schedule.items():
                    if class_info and class_info.get('teacher', '').lower() == teacher_name:
                        violations.append(
                            f"Teacher {constraint.teacher_name} scheduled on unavailable day {day} at {time_slot}"
                        )
            
            # Check unavailable times
            for time_slot in constraint.unavailable_times:
                class_info = day_schedule.get(time_slot)
                if class_info and class_info.get('teacher', '').lower() == teacher_name:
                    violations.append(
                        f"Teacher {constraint.teacher_name} scheduled at unavailable time {day} {time_slot}"
                    )
            
            # Check max hours per day
            if constraint.max_hours_per_day:
                daily_classes = sum(
                    1 for class_info in day_schedule.values()
                    if class_info and class_info.get('teacher', '').lower() == teacher_name
                )
                if daily_classes > constraint.max_hours_per_day:
                    violations.append(
                        f"Teacher {constraint.teacher_name} exceeds daily limit on {day}: "
                        f"{daily_classes} > {constraint.max_hours_per_day}"
                    )
        
        return violations
    
    def _check_room_availability(self, 
                               timetable: Dict[str, Any], 
                               constraint: RoomAvailabilityConstraint) -> List[str]:
        """Check room availability constraints"""
        violations = []
        room_name = constraint.room_name
        
        for day, day_schedule in timetable.items():
            # Check unavailable days
            if day in constraint.unavailable_days:
                for time_slot, class_info in day_schedule.items():
                    if class_info and class_info.get('room') == room_name:
                        violations.append(
                            f"Room {room_name} scheduled on unavailable day {day} at {time_slot}"
                        )
            
            # Check unavailable times
            for time_slot in constraint.unavailable_times:
                class_info = day_schedule.get(time_slot)
                if class_info and class_info.get('room') == room_name:
                    violations.append(
                        f"Room {room_name} scheduled at unavailable time {day} {time_slot}"
                    )
        
        return violations
    
    def _check_time_restriction(self, 
                              timetable: Dict[str, Any], 
                              constraint: TimeRestrictionConstraint) -> List[str]:
        """Check time restriction constraints"""
        violations = []
        course_code = constraint.course_code
        
        for day, day_schedule in timetable.items():
            # Check restricted days
            if day in constraint.restricted_days:
                for time_slot, class_info in day_schedule.items():
                    if class_info and class_info.get('course_code') == course_code:
                        violations.append(
                            f"Course {course_code} scheduled on restricted day {day} at {time_slot}"
                        )
            
            # Check restricted times
            for time_slot in constraint.restricted_times:
                class_info = day_schedule.get(time_slot)
                if class_info and class_info.get('course_code') == course_code:
                    violations.append(
                        f"Course {course_code} scheduled at restricted time {day} {time_slot}"
                    )
        
        return violations
    
    def _check_workload_limit(self, 
                            timetable: Dict[str, Any], 
                            constraint: WorkloadLimitConstraint) -> List[str]:
        """Check workload limit constraints"""
        violations = []
        teacher_name = constraint.teacher_name.lower()
        
        # Count daily and weekly classes
        weekly_classes = 0
        daily_classes = {}
        
        for day, day_schedule in timetable.items():
            daily_count = 0
            for class_info in day_schedule.values():
                if (class_info and 
                    (teacher_name == "*" or class_info.get('teacher', '').lower() == teacher_name)):
                    daily_count += 1
                    weekly_classes += 1
            
            daily_classes[day] = daily_count
            
            # Check daily limit
            if daily_count > constraint.max_classes_per_day:
                violations.append(
                    f"Teacher {constraint.teacher_name} exceeds daily limit on {day}: "
                    f"{daily_count} > {constraint.max_classes_per_day}"
                )
        
        # Check weekly limit
        if weekly_classes > constraint.max_classes_per_week:
            violations.append(
                f"Teacher {constraint.teacher_name} exceeds weekly limit: "
                f"{weekly_classes} > {constraint.max_classes_per_week}"
            )
        
        return violations
    
    def _check_lunch_break(self, 
                         timetable: Dict[str, Any], 
                         constraint: LunchBreakConstraint) -> List[str]:
        """Check lunch break constraints"""
        violations = []
        
        lunch_start = self._time_to_minutes(constraint.start_time)
        lunch_end = self._time_to_minutes(constraint.end_time)
        
        for day, day_schedule in timetable.items():
            for time_slot, class_info in day_schedule.items():
                if class_info:
                    slot_start = self._time_to_minutes(time_slot)
                    
                    # Check if class overlaps with lunch break
                    if lunch_start <= slot_start < lunch_end:
                        # Check if this entity has an exception
                        teacher = class_info.get('teacher', '')
                        room = class_info.get('room', '')
                        
                        if (teacher not in constraint.exceptions and 
                            room not in constraint.exceptions):
                            violations.append(
                                f"Class scheduled during lunch break: {day} {time_slot} - "
                                f"{class_info.get('course_code', 'Unknown')}"
                            )
        
        return violations
    
    def _check_consecutive_classes(self, 
                                 timetable: Dict[str, Any], 
                                 constraint: ConsecutiveClassesConstraint) -> List[str]:
        """Check consecutive classes constraints"""
        violations = []
        course_code = constraint.course_code
        
        for day, day_schedule in timetable.items():
            course_slots = []
            
            # Find all slots for this course on this day
            for time_slot, class_info in day_schedule.items():
                if class_info and class_info.get('course_code') == course_code:
                    course_slots.append(self._time_to_minutes(time_slot))
            
            if len(course_slots) > 1:
                course_slots.sort()
                
                # Check if classes are consecutive (or within allowed gap)
                for i in range(len(course_slots) - 1):
                    gap = course_slots[i + 1] - course_slots[i]
                    expected_gap = 45  # Assuming 45-minute classes
                    
                    if constraint.must_be_consecutive:
                        if gap != expected_gap:
                            violations.append(
                                f"Course {course_code} classes not consecutive on {day}: "
                                f"gap of {gap} minutes"
                            )
                    else:
                        max_allowed_gap = constraint.max_gap_between_classes * expected_gap
                        if gap > max_allowed_gap:
                            violations.append(
                                f"Course {course_code} classes have excessive gap on {day}: "
                                f"{gap} > {max_allowed_gap} minutes"
                            )
        
        return violations
    
    def _check_custom_constraint(self, 
                               timetable: Dict[str, Any], 
                               constraint: Constraint) -> List[str]:
        """Check custom constraints using pattern matching"""
        violations = []
        rule = constraint.description.lower()
        
        # Pattern: "no classes after X PM on day"
        if "no classes after" in rule and "pm" in rule:
            violations.extend(self._check_time_limit_pattern(timetable, rule))
        
        # Pattern: "maximum X classes per day"
        elif "maximum" in rule and "classes per day" in rule:
            violations.extend(self._check_daily_limit_pattern(timetable, rule))
        
        # Pattern: "teacher X not available on day Y"
        elif "not available" in rule:
            violations.extend(self._check_availability_pattern(timetable, rule))
        
        # Add more patterns as needed
        else:
            logger.warning(f"Unrecognized custom constraint pattern: {rule}")
        
        return violations
    
    def _check_time_limit_pattern(self, 
                                timetable: Dict[str, Any], 
                                rule: str) -> List[str]:
        """Check 'no classes after X PM' pattern"""
        violations = []
        
        # Extract time and day from rule
        time_match = re.search(r'(\d{1,2})\s*pm', rule)
        if time_match:
            hour_limit = int(time_match.group(1))
            if hour_limit < 12:  # Convert to 24-hour format
                hour_limit += 12
            
            limit_minutes = hour_limit * 60
            
            # Extract day if specified
            days_to_check = []
            day_patterns = {
                'monday': 'Monday', 'tuesday': 'Tuesday', 'wednesday': 'Wednesday',
                'thursday': 'Thursday', 'friday': 'Friday', 'saturday': 'Saturday', 'sunday': 'Sunday'
            }
            
            for day_key, day_value in day_patterns.items():
                if day_key in rule:
                    days_to_check.append(day_value)
            
            if not days_to_check:
                days_to_check = list(timetable.keys())
            
            # Check violations
            for day in days_to_check:
                if day in timetable:
                    for time_slot, class_info in timetable[day].items():
                        if class_info:
                            slot_minutes = self._time_to_minutes(time_slot)
                            if slot_minutes >= limit_minutes:
                                violations.append(
                                    f"Class scheduled after {hour_limit-12 if hour_limit > 12 else hour_limit} PM on {day}: "
                                    f"{class_info.get('course_code', 'Unknown')} at {time_slot}"
                                )
        
        return violations
    
    def _check_daily_limit_pattern(self, 
                                 timetable: Dict[str, Any], 
                                 rule: str) -> List[str]:
        """Check 'maximum X classes per day' pattern"""
        violations = []
        
        # Extract number from rule
        number_match = re.search(r'maximum\s+(\d+)', rule)
        if number_match:
            max_classes = int(number_match.group(1))
            
            for day, day_schedule in timetable.items():
                class_count = sum(1 for class_info in day_schedule.values() if class_info)
                if class_count > max_classes:
                    violations.append(
                        f"Too many classes on {day}: {class_count} > {max_classes}"
                    )
        
        return violations
    
    def _check_availability_pattern(self, 
                                  timetable: Dict[str, Any], 
                                  rule: str) -> List[str]:
        """Check 'teacher X not available on day Y' pattern"""
        violations = []
        
        # Extract teacher name and day
        words = rule.split()
        teacher_name = ""
        unavailable_day = ""
        
        # Find teacher name (look for titles or names before "not available")
        not_available_index = -1
        for i, word in enumerate(words):
            if word == "not" and i + 1 < len(words) and words[i + 1] == "available":
                not_available_index = i
                break
        
        if not_available_index > 0:
            # Extract teacher name before "not available"
            for i in range(not_available_index):
                if words[i].lower() in ["dr.", "prof.", "mr.", "mrs.", "ms."]:
                    if i + 1 < not_available_index:
                        teacher_name = f"{words[i]} {words[i+1]}"
                        break
        
        # Extract day
        day_patterns = {
            'monday': 'Monday', 'tuesday': 'Tuesday', 'wednesday': 'Wednesday',
            'thursday': 'Thursday', 'friday': 'Friday', 'saturday': 'Saturday', 'sunday': 'Sunday'
        }
        
        for day_key, day_value in day_patterns.items():
            if day_key in rule:
                unavailable_day = day_value
                break
        
        # Check for violations
        if teacher_name and unavailable_day and unavailable_day in timetable:
            for time_slot, class_info in timetable[unavailable_day].items():
                if (class_info and 
                    teacher_name.lower() in class_info.get('teacher', '').lower()):
                    violations.append(
                        f"Teacher {teacher_name} scheduled on unavailable day {unavailable_day} at {time_slot}"
                    )
        
        return violations
    
    def _time_to_minutes(self, time_str: str) -> int:
        """Convert time string (HH:MM) to minutes since midnight"""
        try:
            hours, minutes = map(int, time_str.split(':'))
            return hours * 60 + minutes
        except (ValueError, AttributeError):
            return 0
    
    def calculate_constraint_score(self, 
                                 timetable: Dict[str, Any], 
                                 constraint_set: ConstraintSet) -> float:
        """Calculate overall constraint satisfaction score (0-100)"""
        total_weight = 0
        satisfied_weight = 0
        
        for constraint in constraint_set.constraints:
            if not constraint.is_active:
                continue
            
            weight = self.violation_weights.get(constraint.type, 1)
            total_weight += weight
            
            violations = self.check_constraint(timetable, constraint)
            if not violations:
                satisfied_weight += weight
        
        if total_weight == 0:
            return 100.0
        
        return (satisfied_weight / total_weight) * 100
    
    def get_constraint_report(self, 
                            timetable: Dict[str, Any], 
                            constraint_set: ConstraintSet) -> Dict[str, Any]:
        """Generate detailed constraint satisfaction report"""
        report = {
            'overall_score': 0,
            'total_constraints': len(constraint_set.constraints),
            'satisfied_constraints': 0,
            'violated_constraints': 0,
            'constraint_details': [],
            'violation_summary': {},
            'recommendations': []
        }
        
        for constraint in constraint_set.constraints:
            if not constraint.is_active:
                continue
            
            violations = self.check_constraint(timetable, constraint)
            is_satisfied = len(violations) == 0
            
            constraint_detail = {
                'id': constraint.id,
                'type': constraint.type.value,
                'priority': constraint.priority.value,
                'description': constraint.description,
                'satisfied': is_satisfied,
                'violations': violations
            }
            
            report['constraint_details'].append(constraint_detail)
            
            if is_satisfied:
                report['satisfied_constraints'] += 1
            else:
                report['violated_constraints'] += 1
                
                # Group violations by type
                constraint_type = constraint.type.value
                if constraint_type not in report['violation_summary']:
                    report['violation_summary'][constraint_type] = 0
                report['violation_summary'][constraint_type] += len(violations)
        
        # Calculate overall score
        report['overall_score'] = self.calculate_constraint_score(timetable, constraint_set)
        
        # Generate recommendations
        if report['violated_constraints'] > 0:
            report['recommendations'] = self._generate_constraint_recommendations(report)
        
        return report
    
    def _generate_constraint_recommendations(self, report: Dict[str, Any]) -> List[str]:
        """Generate recommendations based on constraint violations"""
        recommendations = []
        
        violation_summary = report['violation_summary']
        
        if violation_summary.get('teacher_availability', 0) > 0:
            recommendations.append("Review teacher availability constraints - some may be too restrictive")
        
        if violation_summary.get('workload_limit', 0) > 0:
            recommendations.append("Consider adjusting workload limits or adding more teachers")
        
        if violation_summary.get('time_restriction', 0) > 0:
            recommendations.append("Time restrictions may conflict with course requirements")
        
        if violation_summary.get('lunch_break', 0) > 0:
            recommendations.append("Lunch break timing may need adjustment")
        
        if report['overall_score'] < 50:
            recommendations.append("Consider relaxing some constraints to improve feasibility")
        
        return recommendations
