from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from enum import Enum

class ConstraintType(str, Enum):
    TEACHER_AVAILABILITY = "teacher_availability"
    ROOM_AVAILABILITY = "room_availability"
    TIME_RESTRICTION = "time_restriction"
    CONSECUTIVE_CLASSES = "consecutive_classes"
    WORKLOAD_LIMIT = "workload_limit"
    LUNCH_BREAK = "lunch_break"
    CUSTOM = "custom"

class Priority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class Constraint(BaseModel):
    id: Optional[str] = Field(None, description="Unique constraint identifier")
    type: ConstraintType = Field(..., description="Type of constraint")
    priority: Priority = Field(default=Priority.MEDIUM, description="Constraint priority")
    description: str = Field(..., description="Human-readable description")
    parameters: Dict[str, Any] = Field(default={}, description="Constraint-specific parameters")
    is_active: bool = Field(default=True, description="Whether constraint is active")

class TeacherAvailabilityConstraint(Constraint):
    type: ConstraintType = Field(default=ConstraintType.TEACHER_AVAILABILITY)
    teacher_name: str = Field(..., description="Teacher name")
    unavailable_days: List[str] = Field(default=[], description="Days when teacher is unavailable")
    unavailable_times: List[str] = Field(default=[], description="Time slots when teacher is unavailable")
    max_hours_per_day: Optional[int] = Field(None, description="Maximum teaching hours per day")
    preferred_days: List[str] = Field(default=[], description="Preferred working days")

class RoomAvailabilityConstraint(Constraint):
    type: ConstraintType = Field(default=ConstraintType.ROOM_AVAILABILITY)
    room_name: str = Field(..., description="Room identifier")
    unavailable_days: List[str] = Field(default=[], description="Days when room is unavailable")
    unavailable_times: List[str] = Field(default=[], description="Time slots when room is unavailable")
    room_type: str = Field(default="classroom", description="Type of room (classroom, lab, etc.)")

class TimeRestrictionConstraint(Constraint):
    type: ConstraintType = Field(default=ConstraintType.TIME_RESTRICTION)
    course_code: str = Field(..., description="Course affected by restriction")
    restricted_days: List[str] = Field(default=[], description="Days when course cannot be scheduled")
    restricted_times: List[str] = Field(default=[], description="Time slots when course cannot be scheduled")
    preferred_times: List[str] = Field(default=[], description="Preferred time slots for course")

class ConsecutiveClassesConstraint(Constraint):
    type: ConstraintType = Field(default=ConstraintType.CONSECUTIVE_CLASSES)
    course_code: str = Field(..., description="Course code")
    must_be_consecutive: bool = Field(default=True, description="Whether classes must be consecutive")
    max_gap_between_classes: int = Field(default=0, description="Maximum gap (in time slots) between classes")

class WorkloadLimitConstraint(Constraint):
    type: ConstraintType = Field(default=ConstraintType.WORKLOAD_LIMIT)
    teacher_name: str = Field(..., description="Teacher name")
    max_classes_per_day: int = Field(default=8, description="Maximum classes per day")
    max_classes_per_week: int = Field(default=30, description="Maximum classes per week")
    min_break_time: int = Field(default=15, description="Minimum break time in minutes")

class LunchBreakConstraint(Constraint):
    type: ConstraintType = Field(default=ConstraintType.LUNCH_BREAK)
    start_time: str = Field(..., description="Lunch break start time")
    end_time: str = Field(..., description="Lunch break end time")
    applies_to_all: bool = Field(default=True, description="Whether applies to all teachers/rooms")
    exceptions: List[str] = Field(default=[], description="List of exceptions (teacher names or room names)")

class CustomConstraint(Constraint):
    type: ConstraintType = Field(default=ConstraintType.CUSTOM)
    rule: str = Field(..., description="Custom rule in natural language")
    affected_entities: List[str] = Field(default=[], description="List of affected entities (teachers, courses, rooms)")
    implementation_notes: str = Field(default="", description="Notes for implementation")

class ConstraintSet(BaseModel):
    institution_id: str = Field(..., description="Institution identifier")
    constraints: List[Constraint] = Field(default=[], description="List of constraints")
    created_at: Optional[str] = Field(None, description="Creation timestamp")
    updated_at: Optional[str] = Field(None, description="Last update timestamp")
    version: int = Field(default=1, description="Version number")

    def add_constraint(self, constraint: Constraint) -> None:
        """Add a new constraint to the set"""
        constraint.id = f"{constraint.type}_{len(self.constraints)}_{hash(constraint.description)}"
        self.constraints.append(constraint)

    def remove_constraint(self, constraint_id: str) -> bool:
        """Remove a constraint by ID"""
        for i, constraint in enumerate(self.constraints):
            if constraint.id == constraint_id:
                self.constraints.pop(i)
                return True
        return False

    def get_constraints_by_type(self, constraint_type: ConstraintType) -> List[Constraint]:
        """Get all constraints of a specific type"""
        return [c for c in self.constraints if c.type == constraint_type and c.is_active]

    def get_constraints_by_priority(self, priority: Priority) -> List[Constraint]:
        """Get all constraints with a specific priority"""
        return [c for c in self.constraints if c.priority == priority and c.is_active]

    def validate_constraints(self) -> Dict[str, Any]:
        """Validate all constraints and return validation results"""
        results = {
            "is_valid": True,
            "errors": [],
            "warnings": [],
            "conflicts": []
        }

        # Check for conflicting constraints
        teacher_constraints = self.get_constraints_by_type(ConstraintType.TEACHER_AVAILABILITY)
        for i, constraint1 in enumerate(teacher_constraints):
            for j, constraint2 in enumerate(teacher_constraints[i+1:], i+1):
                if (hasattr(constraint1, 'teacher_name') and 
                    hasattr(constraint2, 'teacher_name') and
                    constraint1.teacher_name == constraint2.teacher_name):
                    
                    # Check for conflicting availability
                    if (hasattr(constraint1, 'unavailable_days') and 
                        hasattr(constraint2, 'preferred_days')):
                        conflicts = set(constraint1.unavailable_days) & set(constraint2.preferred_days)
                        if conflicts:
                            results["conflicts"].append({
                                "type": "teacher_availability_conflict",
                                "teacher": constraint1.teacher_name,
                                "conflicting_days": list(conflicts),
                                "constraint_ids": [constraint1.id, constraint2.id]
                            })

        # Validate time formats
        for constraint in self.constraints:
            if hasattr(constraint, 'start_time') and constraint.start_time:
                if not self._is_valid_time_format(constraint.start_time):
                    results["errors"].append(f"Invalid time format in constraint {constraint.id}: {constraint.start_time}")
                    results["is_valid"] = False

            if hasattr(constraint, 'end_time') and constraint.end_time:
                if not self._is_valid_time_format(constraint.end_time):
                    results["errors"].append(f"Invalid time format in constraint {constraint.id}: {constraint.end_time}")
                    results["is_valid"] = False

        # Check for reasonable workload limits
        workload_constraints = self.get_constraints_by_type(ConstraintType.WORKLOAD_LIMIT)
        for constraint in workload_constraints:
            if hasattr(constraint, 'max_classes_per_day') and constraint.max_classes_per_day > 12:
                results["warnings"].append(f"High daily workload limit for {constraint.teacher_name}: {constraint.max_classes_per_day} classes")

        return results

    def _is_valid_time_format(self, time_str: str) -> bool:
        """Validate time format (HH:MM)"""
        try:
            parts = time_str.split(':')
            if len(parts) != 2:
                return False
            
            hour, minute = int(parts[0]), int(parts[1])
            return 0 <= hour <= 23 and 0 <= minute <= 59
        except (ValueError, AttributeError):
            return False

# Utility functions for constraint parsing
def parse_natural_language_constraint(text: str) -> Optional[Constraint]:
    """Parse natural language constraint into structured constraint"""
    text_lower = text.lower().strip()
    
    # Teacher availability patterns
    if "not available" in text_lower and any(day in text_lower for day in ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]):
        # Extract teacher name and days
        words = text.split()
        teacher_name = ""
        unavailable_days = []
        
        # Find teacher name (look for titles)
        for i, word in enumerate(words):
            if word.lower() in ["dr.", "prof.", "mr.", "mrs.", "ms."]:
                if i + 1 < len(words):
                    teacher_name = f"{word} {words[i+1]}"
                    break
        
        # Extract days
        days_map = {
            "monday": "Monday", "tuesday": "Tuesday", "wednesday": "Wednesday",
            "thursday": "Thursday", "friday": "Friday", "saturday": "Saturday", "sunday": "Sunday"
        }
        
        for day_key, day_value in days_map.items():
            if day_key in text_lower:
                unavailable_days.append(day_value)
        
        if teacher_name and unavailable_days:
            return TeacherAvailabilityConstraint(
                teacher_name=teacher_name,
                unavailable_days=unavailable_days,
                description=text,
                priority=Priority.HIGH
            )
    
    # Lunch break patterns
    if "lunch" in text_lower and "break" in text_lower:
        # Extract time range
        import re
        time_pattern = r'\b([01]?[0-9]|2[0-3]):[0-5][0-9]\b'
        times = re.findall(time_pattern, text)
        
        if len(times) >= 2:
            return LunchBreakConstraint(
                start_time=times[0],
                end_time=times[1],
                description=text,
                priority=Priority.MEDIUM
            )
    
    # Default to custom constraint
    return CustomConstraint(
        rule=text,
        description=text,
        priority=Priority.MEDIUM
    )

def create_default_constraints(institution_id: str, 
                             working_days: List[str], 
                             start_time: str, 
                             end_time: str,
                             lunch_start: str = None,
                             lunch_end: str = None) -> ConstraintSet:
    """Create default constraints for an institution"""
    constraint_set = ConstraintSet(institution_id=institution_id)
    
    # Add lunch break constraint if specified
    if lunch_start and lunch_end:
        lunch_constraint = LunchBreakConstraint(
            start_time=lunch_start,
            end_time=lunch_end,
            description=f"Lunch break from {lunch_start} to {lunch_end}",
            priority=Priority.HIGH
        )
        constraint_set.add_constraint(lunch_constraint)
    
    # Add default workload constraints
    default_workload = WorkloadLimitConstraint(
        teacher_name="*",  # Applies to all teachers
        max_classes_per_day=8,
        max_classes_per_week=30,
        description="Default workload limits for all teachers",
        priority=Priority.MEDIUM
    )
    constraint_set.add_constraint(default_workload)
    
    return constraint_set
