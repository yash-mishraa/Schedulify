from fastapi import APIRouter, HTTPException, BackgroundTasks, Depends
from typing import List, Dict, Any
import asyncio
from datetime import datetime

from app.models.timetable import TimetableRequest, TimetableResponse
from app.services.genetic_algorithm import GeneticTimetableOptimizer, Course
from app.services.firebase_service import FirebaseService
from app.utils.export_utils import ExportUtils

router = APIRouter()
firebase_service = FirebaseService()
export_utils = ExportUtils()

@router.post("/generate", response_model=TimetableResponse)
async def generate_timetable(
    request: TimetableRequest,
    background_tasks: BackgroundTasks
):
    """Generate optimized timetable using genetic algorithm"""
    try:
        # Convert request data to Course objects
        courses = []
        for course_data in request.courses:
            course = Course(
                code=course_data.code,
                name=course_data.name,
                teacher=course_data.teacher,
                lectures_per_week=course_data.lectures_per_week,
                type=course_data.type,
                duration=request.lecture_duration
            )
            courses.append(course)
        
        # Prepare constraints
        constraints = {
            'working_days': request.working_days,
            'start_time': request.start_time,
            'end_time': request.end_time,
            'lecture_duration': request.lecture_duration,
            'lunch_start': request.lunch_start,
            'lunch_end': request.lunch_end,
            'custom_constraints': request.custom_constraints
        }
        
        # Initialize optimizer
        optimizer = GeneticTimetableOptimizer(
            courses=courses,
            constraints=constraints,
            resources=request.resources
        )
        
        # Run optimization
        result = optimizer.optimize()
        
        # Save to Firebase in background
        background_tasks.add_task(
            firebase_service.save_timetable,
            request.institution_id,
            result
        )
        
        # Also save user inputs for future reference
        background_tasks.add_task(
            firebase_service.save_user_inputs,
            request.institution_id,
            request.dict()
        )
        
        return TimetableResponse(
            timetable=result['timetable'],
            fitness_score=result['fitness_score'],
            summary=result['summary'],
            generation_count=result['generation'],
            institution_id=request.institution_id,
            timestamp=datetime.now()
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Timetable generation failed: {str(e)}")

@router.get("/{institution_id}")
async def get_timetable(institution_id: str):
    """Retrieve saved timetable"""
    try:
        timetable = await firebase_service.get_timetable(institution_id)
        
        if not timetable:
            raise HTTPException(status_code=404, detail="Timetable not found")
        
        return timetable
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving timetable: {str(e)}")

@router.post("/export/{institution_id}")
async def export_timetable(
    institution_id: str,
    format: str = "xlsx"  # "xlsx" or "pdf"
):
    """Export timetable to Excel or PDF"""
    try:
        timetable = await firebase_service.get_timetable(institution_id)
        
        if not timetable:
            raise HTTPException(status_code=404, detail="Timetable not found")
        
        if format.lower() == "xlsx":
            file_content = export_utils.export_to_excel(timetable)
            media_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            filename = f"timetable_{institution_id}_{datetime.now().strftime('%Y%m%d')}.xlsx"
        elif format.lower() == "pdf":
            file_content = export_utils.export_to_pdf(timetable)
            media_type = "application/pdf"
            filename = f"timetable_{institution_id}_{datetime.now().strftime('%Y%m%d')}.pdf"
        else:
            raise HTTPException(status_code=400, detail="Unsupported export format")
        
        from fastapi.responses import Response
        return Response(
            content=file_content,
            media_type=media_type,
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Export failed: {str(e)}")

@router.post("/validate")
async def validate_constraints(request: TimetableRequest):
    """Validate user inputs and constraints before generation"""
    try:
        validation_results = {
            'is_valid': True,
            'warnings': [],
            'errors': []
        }
        
        # Basic validations
        if not request.courses:
            validation_results['errors'].append("At least one course is required")
            validation_results['is_valid'] = False
        
        if not request.working_days:
            validation_results['errors'].append("At least one working day is required")
            validation_results['is_valid'] = False
        
        # Check if total lectures can fit in available slots
        total_lectures = sum(course.lectures_per_week for course in request.courses)
        total_slots = len(request.working_days) * 8  # Assuming ~8 slots per day
        
        if total_lectures > total_slots:
            validation_results['warnings'].append(
                f"Total required lectures ({total_lectures}) may exceed available time slots ({total_slots})"
            )
        
        # Check resource constraints
        if request.resources.get('classrooms', 0) < 1:
            validation_results['errors'].append("At least one classroom is required")
            validation_results['is_valid'] = False
        
        # Check for conflicting custom constraints
        custom_constraints = request.custom_constraints or []
        for constraint in custom_constraints:
            if 'contradiction' in constraint.lower():
                validation_results['warnings'].append(f"Potential constraint conflict: {constraint}")
        
        return validation_results
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Validation failed: {str(e)}")
