from fastapi import APIRouter, HTTPException
from typing import List, Optional
from datetime import datetime
import uuid
import pytz

# Remove the unused Institution import, only keep what we need
from ..models.institution import InstitutionCreate, InstitutionUpdate, InstitutionResponse
from ..services.firebase_service import get_firebase_service

router = APIRouter(prefix="/api/v1/institutions", tags=["institutions"])

@router.post("/", response_model=InstitutionResponse)
async def create_institution(institution_data: InstitutionCreate):
    """Create a new institution"""
    try:
        # Generate unique institution ID
        institution_id = f"inst_{int(datetime.now().timestamp())}_{uuid.uuid4().hex[:8]}"
        
        # Get IST timezone
        ist_timezone = pytz.timezone('Asia/Kolkata')
        current_ist = datetime.now(ist_timezone)
        
        institution = {
            "id": institution_id,
            "name": institution_data.name,
            "created_at": current_ist.isoformat(),
            "updated_at": None,
            "settings": institution_data.settings or {},
            "active_timetables": [],
            "total_timetables_generated": 0,
            "last_timetable_generated": None
        }
        
        # Save to Firebase
        try:
            firebase_service = get_firebase_service()
            if firebase_service.db:
                firebase_service.db.collection('institutions').document(institution_id).set(institution)
        except Exception as e:
            print(f"Firebase save error: {e}")
        
        return InstitutionResponse(**institution)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create institution: {str(e)}")

@router.get("/{institution_id}", response_model=InstitutionResponse)
async def get_institution(institution_id: str):
    """Get institution by ID"""
    try:
        firebase_service = get_firebase_service()
        
        if not firebase_service.db:
            # Return a default response if Firebase is not available
            return InstitutionResponse(
                id=institution_id,
                name="Default Institution",
                created_at=datetime.now().isoformat(),
                total_timetables_generated=0
            )
        
        doc = firebase_service.db.collection('institutions').document(institution_id).get()
        
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Institution not found")
        
        institution_data = doc.to_dict()
        return InstitutionResponse(**institution_data)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get institution: {str(e)}")

@router.put("/{institution_id}", response_model=InstitutionResponse)
async def update_institution(institution_id: str, update_data: InstitutionUpdate):
    """Update institution"""
    try:
        firebase_service = get_firebase_service()
        
        if not firebase_service.db:
            raise HTTPException(status_code=503, detail="Database service unavailable")
        
        doc_ref = firebase_service.db.collection('institutions').document(institution_id)
        doc = doc_ref.get()
        
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Institution not found")
        
        institution_data = doc.to_dict()
        
        # Update fields
        if update_data.name is not None:
            institution_data["name"] = update_data.name
        if update_data.settings is not None:
            institution_data["settings"] = update_data.settings
        
        # Get IST timezone
        ist_timezone = pytz.timezone('Asia/Kolkata')
        institution_data["updated_at"] = datetime.now(ist_timezone).isoformat()
        
        # Save to Firebase
        doc_ref.set(institution_data)
        
        return InstitutionResponse(**institution_data)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update institution: {str(e)}")

@router.delete("/{institution_id}")
async def delete_institution(institution_id: str):
    """Delete institution and all its data"""
    try:
        firebase_service = get_firebase_service()
        
        if not firebase_service.db:
            return {"message": f"Institution {institution_id} marked for deletion (Firebase unavailable)"}
        
        # Check if institution exists
        institution_doc = firebase_service.db.collection('institutions').document(institution_id).get()
        if not institution_doc.exists:
            raise HTTPException(status_code=404, detail="Institution not found")
        
        # Delete all timetables for this institution
        try:
            timetables_ref = firebase_service.db.collection('timetables').where('institution_id', '==', institution_id)
            for doc in timetables_ref.stream():
                doc.reference.delete()
        except Exception as e:
            print(f"Error deleting timetables: {e}")
        
        # Delete all user inputs for this institution
        try:
            inputs_ref = firebase_service.db.collection('user_inputs').where('institution_id', '==', institution_id)
            for doc in inputs_ref.stream():
                doc.reference.delete()
        except Exception as e:
            print(f"Error deleting user inputs: {e}")
        
        # Delete institution
        firebase_service.db.collection('institutions').document(institution_id).delete()
        
        return {"message": f"Institution {institution_id} and all associated data deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete institution: {str(e)}")

@router.get("/{institution_id}/timetables")
async def get_institution_timetables(institution_id: str):
    """Get all timetables for an institution"""
    try:
        firebase_service = get_firebase_service()
        
        if not firebase_service.db:
            return {
                "institution_id": institution_id,
                "total_timetables": 0,
                "timetables": []
            }
        
        # Check if institution exists
        institution_doc = firebase_service.db.collection('institutions').document(institution_id).get()
        if not institution_doc.exists:
            raise HTTPException(status_code=404, detail="Institution not found")
        
        # Get timetables
        timetables_ref = firebase_service.db.collection('timetables').where('institution_id', '==', institution_id)
        timetables = []
        
        try:
            for doc in timetables_ref.stream():
                timetable_data = doc.to_dict()
                timetables.append({
                    "id": doc.id,
                    "created_at": timetable_data.get("created_at"),
                    "fitness_score": timetable_data.get("fitness_score"),
                    "summary": timetable_data.get("summary", {})
                })
        except Exception as e:
            print(f"Error getting timetables: {e}")
        
        # Sort by creation date (newest first)
        timetables.sort(key=lambda x: x.get("created_at", ""), reverse=True)
        
        return {
            "institution_id": institution_id,
            "total_timetables": len(timetables),
            "timetables": timetables
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get timetables: {str(e)}")
