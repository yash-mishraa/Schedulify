from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class Institution(BaseModel):
    id: str
    name: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    settings: Optional[Dict[str, Any]] = {}
    active_timetables: Optional[List[str]] = []
    total_timetables_generated: int = 0

class InstitutionCreate(BaseModel):
    name: str
    settings: Optional[Dict[str, Any]] = {}

class InstitutionUpdate(BaseModel):
    name: Optional[str] = None
    settings: Optional[Dict[str, Any]] = None

class InstitutionResponse(BaseModel):
    id: str
    name: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    total_timetables_generated: int
    last_timetable_generated: Optional[datetime] = None
