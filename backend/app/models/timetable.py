from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime

class CourseModel(BaseModel):
    code: str = Field(..., description="Course code (e.g., CS101)")
    name: str = Field(..., description="Course name")
    teacher: str = Field(..., description="Teacher's name")
    lectures_per_week: int = Field(..., ge=1, le=20, description="Number of lectures per week")
    type: str = Field(..., description="Type: 'lecture' or 'lab'")

class TimetableRequest(BaseModel):
    institution_id: str = Field(..., description="Unique institution identifier")
    working_days: List[str] = Field(default=["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"])
    lecture_duration: int = Field(default=45, description="Lecture duration in minutes")
    start_time: str = Field(default="09:15", description="Start time (HH:MM)")
    end_time: str = Field(default="16:55", description="End time (HH:MM)")
    lunch_start: Optional[str] = Field(default="12:30", description="Lunch start time")
    lunch_end: Optional[str] = Field(default="13:30", description="Lunch end time")
    courses: List[CourseModel] = Field(..., description="List of courses")
    resources: Dict[str, int] = Field(default={"classrooms": 10, "labs": 5})
    custom_constraints: Optional[List[str]] = Field(default=[], description="Custom constraint rules")

class TimetableResponse(BaseModel):
    timetable: Dict[str, Any]
    fitness_score: float
    summary: Dict[str, Any]
    generation_count: int
    institution_id: str
    timestamp: datetime
