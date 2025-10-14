from pydantic import BaseModel
from typing import Optional, Dict, Any

class InstitutionCreate(BaseModel):
    name: str
    settings: Optional[Dict[str, Any]] = {}

class InstitutionUpdate(BaseModel):
    name: Optional[str] = None
    settings: Optional[Dict[str, Any]] = None

class InstitutionResponse(BaseModel):
    id: str
    name: str
    created_at: str
    updated_at: Optional[str] = None
    total_timetables_generated: int = 0
    last_timetable_generated: Optional[str] = None
    
    class Config:
        from_attributes = True
