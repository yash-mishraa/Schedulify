from fastapi import APIRouter, HTTPException, BackgroundTasks
from typing import List, Dict, Any
import asyncio
from datetime import datetime
import pytz
from google.cloud import firestore

from ..models.timetable import TimetableRequest, TimetableResponse
from ..services.genetic_algorithm import GeneticTimetableOptimizer, Course
from ..services.firebase_service import get_firebase_service
from ..utils.export_utils import ExportUtils

router = APIRouter(prefix="/api/v1/timetable", tags=["timetable"])

def get_export_utils():
    return ExportUtils()

async def update_institution_stats(institution_id: str):
    """Update institution statistics after timetable generation"""
    try:
        firebase_service = get_firebase_service()
        ist_timezone = pytz.timezone('Asia/Kolkata')
        
        if not firebase_service.db:
            print("Firebase not available, skipping stats update")
            return
        
        doc_ref = firebase_service.db.collection('institutions').document(institution_id)
        doc = doc_ref.get()
        
        if doc.exists:
            institution_data = doc.to_dict()
            institution_data["total_timetables_generated"] = institution_data.get("total_timetables_generated", 0) + 1
            institution_data["last_timetable_generated"] = datetime.now(ist_timezone).isoformat()
            institution_data["updated_at"] = datetime.now(ist_timezone).isoformat()
            
            doc_ref.set(institution_data)
            print(f"Updated institution {institution_id} stats: {institution_data['total_timetables_generated']} timetables generated")
    except Exception as e:
        print(f"Failed to update institution stats: {e}")

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
                duration=request.lecture_duration,
                lab_duration=getattr(course_data, 'lab_duration', 2)
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
        
        # Get current IST time
        ist_timezone = pytz.timezone('Asia/Kolkata')
        current_ist = datetime.now(ist_timezone)
        
        # Prepare complete timetable data for storage
        complete_timetable_data = {
            'institution_id': request.institution_id,
            'timetable': result['timetable'],
            'fitness_score': result['fitness_score'],
            'summary': result['summary'],
            'generation_count': result['generation'],
            'created_at': current_ist.isoformat(),
            'updated_at': current_ist.isoformat(),
            'constraints': constraints,
            'courses_data': [course.dict() for course in courses],
            'resources': request.resources
        }
        
        # Save to Firebase immediately (not in background)
        firebase_service = get_firebase_service()
        if firebase_service.db:
            try:
                # Save with a specific document ID for easy retrieval
                doc_id = f"{request.institution_id}_{int(current_ist.timestamp())}"
                firebase_service.db.collection('timetables').document(doc_id).set(complete_timetable_data)
                
                # Also update the "latest" document for this institution
                latest_doc_id = f"{request.institution_id}_latest"
                firebase_service.db.collection('timetables').document(latest_doc_id).set(complete_timetable_data)
                
                print(f"Timetable saved successfully: {doc_id} and {latest_doc_id}")
            except Exception as e:
                print(f"Error saving to Firebase: {e}")
        
        # Background tasks
        background_tasks.add_task(update_institution_stats, request.institution_id)
        background_tasks.add_task(save_user_inputs_background, request.institution_id, request.dict())
        
        # Return response
        return TimetableResponse(
            timetable=result['timetable'],
            fitness_score=result['fitness_score'],
            summary=result['summary'],
            generation_count=result['generation'],
            institution_id=request.institution_id,
            timestamp=current_ist.isoformat()
        )
        
    except Exception as e:
        print(f"Timetable generation error: {e}")
        raise HTTPException(status_code=500, detail=f"Timetable generation failed: {str(e)}")

async def save_user_inputs_background(institution_id: str, request_data: dict):
    """Save user inputs in background"""
    try:
        firebase_service = get_firebase_service()
        if firebase_service.db:
            await firebase_service.save_user_inputs(institution_id, request_data)
    except Exception as e:
        print(f"Error saving user inputs: {e}")

@router.get("/{institution_id}")
async def get_timetable(institution_id: str):
    """Retrieve saved timetable"""
    try:
        firebase_service = get_firebase_service()
        
        if not firebase_service.db:
            raise HTTPException(status_code=503, detail="Database service unavailable")
        
        # Try to get the latest timetable
        latest_doc_id = f"{institution_id}_latest"
        doc = firebase_service.db.collection('timetables').document(latest_doc_id).get()
        
        if doc.exists:
            return doc.to_dict()
        
        # Fallback: get the most recent timetable
        query = (firebase_service.db.collection('timetables')
                .where('institution_id', '==', institution_id)
                .order_by('created_at', direction=firestore.Query.DESCENDING)
                .limit(1))
        
        docs = list(query.stream())
        if docs:
            return docs[0].to_dict()
        
        raise HTTPException(status_code=404, detail="Timetable not found")
        
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
        firebase_service = get_firebase_service()
        export_utils = ExportUtils()
        
        if not firebase_service.db:
            raise HTTPException(status_code=503, detail="Database service unavailable")
        
        # Try to get the latest timetable first
        latest_doc_id = f"{institution_id}_latest"
        doc = firebase_service.db.collection('timetables').document(latest_doc_id).get()
        
        if not doc.exists:
            # Fallback: get the most recent timetable
            query = (firebase_service.db.collection('timetables')
                    .where('institution_id', '==', institution_id)
                    .order_by('created_at', direction=firestore.Query.DESCENDING)
                    .limit(1))
            
            docs = list(query.stream())
            if not docs:
                raise HTTPException(status_code=404, detail="No timetable found for this institution. Please generate a timetable first.")
            
            timetable_data = docs[0].to_dict()
        else:
            timetable_data = doc.to_dict()
        
        print(f"Found timetable data for institution {institution_id}")
        
        # Get IST date for filename
        ist_timezone = pytz.timezone('Asia/Kolkata')
        current_ist = datetime.now(ist_timezone)
        date_str = current_ist.strftime('%Y%m%d_%H%M')
        
        if format.lower() == "xlsx":
            file_content = export_utils.export_to_excel(timetable_data)
            media_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            filename = f"timetable_{institution_id}_{date_str}.xlsx"
        elif format.lower() == "pdf":
            file_content = export_utils.export_to_pdf(timetable_data)
            media_type = "application/pdf"
            filename = f"timetable_{institution_id}_{date_str}.pdf"
        else:
            raise HTTPException(status_code=400, detail="Unsupported export format. Use 'xlsx' or 'pdf'.")
        
        from fastapi.responses import Response
        return Response(
            content=file_content,
            media_type=media_type,
            headers={
                "Content-Disposition": f"attachment; filename={filename}",
                "Content-Length": str(len(file_content))
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Export error: {e}")
        raise HTTPException(status_code=500, detail=f"Export failed: {str(e)}")

@router.get("/{institution_id}/history")
async def get_timetable_history(institution_id: str):
    """Get timetable generation history for an institution"""
    try:
        firebase_service = get_firebase_service()
        
        if not firebase_service.db:
            return {
                "institution_id": institution_id,
                "total_timetables": 0,
                "timetables": []
            }
        
        # Get timetables for this institution (excluding the "latest" document)
        timetables_ref = firebase_service.db.collection('timetables').where('institution_id', '==', institution_id)
        timetables = []
        
        for doc in timetables_ref.stream():
            if not doc.id.endswith('_latest'):  # Exclude the latest document
                timetable_data = doc.to_dict()
                timetables.append({
                    "id": doc.id,
                    "created_at": timetable_data.get("created_at"),
                    "fitness_score": timetable_data.get("fitness_score"),
                    "summary": timetable_data.get("summary", {}),
                    "generation_count": timetable_data.get("generation_count", 0)
                })
        
        # Sort by creation date (newest first)
        timetables.sort(key=lambda x: x.get("created_at", ""), reverse=True)
        
        return {
            "institution_id": institution_id,
            "total_timetables": len(timetables),
            "timetables": timetables[:10]  # Return last 10 timetables
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get timetable history: {str(e)}")

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
        
        # Validate course data
        for i, course in enumerate(request.courses):
            if not course.code.strip():
                validation_results['errors'].append(f"Course {i+1}: Course code is required")
                validation_results['is_valid'] = False
            
            if not course.name.strip():
                validation_results['errors'].append(f"Course {i+1}: Course name is required")
                validation_results['is_valid'] = False
                
            if not course.teacher.strip():
                validation_results['errors'].append(f"Course {i+1}: Teacher name is required")
                validation_results['is_valid'] = False
            
            if course.lectures_per_week <= 0:
                validation_results['errors'].append(f"Course {i+1}: Lectures per week must be greater than 0")
                validation_results['is_valid'] = False
            
            # Validate lab duration for lab courses
            if course.type == 'lab':
                lab_duration = getattr(course, 'lab_duration', 2)
                if lab_duration < 1 or lab_duration > 4:
                    validation_results['warnings'].append(f"Course {i+1}: Lab duration of {lab_duration} periods may be unusual")
        
        # Check if total lectures can fit in available slots
        total_lectures = sum(course.lectures_per_week for course in request.courses)
        
        # Calculate available slots per day (considering lunch break)
        start_time = datetime.strptime(request.start_time, '%H:%M')
        end_time = datetime.strptime(request.end_time, '%H:%M')
        lunch_start = datetime.strptime(request.lunch_start, '%H:%M')
        lunch_end = datetime.strptime(request.lunch_end, '%H:%M')
        
        total_minutes = (end_time - start_time).total_seconds() / 60
        lunch_minutes = (lunch_end - lunch_start).total_seconds() / 60
        available_minutes = total_minutes - lunch_minutes
        slots_per_day = int(available_minutes // request.lecture_duration)
        
        total_available_slots = len(request.working_days) * slots_per_day
        
        if total_lectures > total_available_slots:
            validation_results['errors'].append(
                f"Total required lectures ({total_lectures}) exceed available time slots ({total_available_slots}). "
                f"Consider reducing lectures per week or extending working hours."
            )
            validation_results['is_valid'] = False
        elif total_lectures > total_available_slots * 0.8:
            validation_results['warnings'].append(
                f"Schedule is quite tight: {total_lectures} lectures in {total_available_slots} slots. "
                f"This may result in less optimal scheduling."
            )
        
        # Check resource constraints
        if request.resources.get('classrooms', 0) < 1:
            validation_results['errors'].append("At least one classroom is required")
            validation_results['is_valid'] = False
        
        # Check if there are enough labs for lab courses
        lab_courses = [course for course in request.courses if course.type == 'lab']
        if lab_courses and request.resources.get('labs', 0) < 1:
            validation_results['warnings'].append("Lab courses detected but no labs specified in resources")
        
        # Validate time constraints
        if start_time >= end_time:
            validation_results['errors'].append("End time must be after start time")
            validation_results['is_valid'] = False
        
        if lunch_start >= lunch_end:
            validation_results['errors'].append("Lunch end time must be after lunch start time")
            validation_results['is_valid'] = False
        
        if lunch_start < start_time or lunch_end > end_time:
            validation_results['warnings'].append("Lunch break should be within working hours")
        
        # Check for potential teacher conflicts
        teacher_workload = {}
        for course in request.courses:
            teacher = course.teacher.strip().lower()
            teacher_workload[teacher] = teacher_workload.get(teacher, 0) + course.lectures_per_week
        
        for teacher, workload in teacher_workload.items():
            if workload > slots_per_day * len(request.working_days) * 0.6:  # More than 60% of available slots
                validation_results['warnings'].append(
                    f"Teacher '{teacher}' has high workload ({workload} hours/week). This may cause scheduling conflicts."
                )
        
        return validation_results
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Validation failed: {str(e)}")

@router.delete("/{institution_id}/timetables")
async def delete_all_timetables(institution_id: str):
    """Delete all timetables for an institution"""
    try:
        firebase_service = get_firebase_service()
        
        if not firebase_service.db:
            raise HTTPException(status_code=503, detail="Database service unavailable")
        
        # Delete all timetables for this institution
        timetables_ref = firebase_service.db.collection('timetables').where('institution_id', '==', institution_id)
        deleted_count = 0
        
        for doc in timetables_ref.stream():
            doc.reference.delete()
            deleted_count += 1
        
        # Also delete the latest document specifically
        latest_doc_id = f"{institution_id}_latest"
        try:
            firebase_service.db.collection('timetables').document(latest_doc_id).delete()
            deleted_count += 1
        except:
            pass
        
        # Reset institution timetable count
        try:
            institution_doc = firebase_service.db.collection('institutions').document(institution_id).get()
            if institution_doc.exists:
                institution_data = institution_doc.to_dict()
                institution_data["total_timetables_generated"] = 0
                institution_data["last_timetable_generated"] = None
                institution_data["updated_at"] = datetime.now(pytz.timezone('Asia/Kolkata')).isoformat()
                firebase_service.db.collection('institutions').document(institution_id).set(institution_data)
        except Exception as e:
            print(f"Error updating institution stats: {e}")
        
        return {
            "message": f"Successfully deleted {deleted_count} timetables for institution {institution_id}",
            "deleted_count": deleted_count
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete timetables: {str(e)}")
