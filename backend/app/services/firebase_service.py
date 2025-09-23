from firebase_admin import firestore
from typing import Dict, Any, Optional
import asyncio
from datetime import datetime

class FirebaseService:
    def __init__(self):
        self.db = firestore.client()
    
    async def save_timetable(self, institution_id: str, timetable_data: Dict[str, Any]) -> bool:
        """Save timetable to Firestore with real-time update trigger"""
        try:
            doc_ref = self.db.collection('timetables').document(institution_id)
            
            # Add metadata
            timetable_data.update({
                'updated_at': datetime.now(),
                'version': datetime.now().timestamp(),
                'status': 'completed'
            })
            
            # Save to Firestore
            doc_ref.set(timetable_data)
            
            # Trigger real-time update notification
            await self._notify_clients(institution_id, 'timetable_updated')
            
            return True
        except Exception as e:
            print(f"Error saving timetable: {e}")
            return False
    
    async def get_timetable(self, institution_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve timetable from Firestore"""
        try:
            doc_ref = self.db.collection('timetables').document(institution_id)
            doc = doc_ref.get()
            
            if doc.exists:
                return doc.to_dict()
            return None
        except Exception as e:
            print(f"Error retrieving timetable: {e}")
            return None
    
    async def save_user_inputs(self, institution_id: str, inputs: Dict[str, Any]) -> bool:
        """Save user inputs for timetable generation"""
        try:
            doc_ref = self.db.collection('inputs').document(institution_id)
            
            inputs.update({
                'updated_at': datetime.now(),
                'version': datetime.now().timestamp()
            })
            
            doc_ref.set(inputs)
            return True
        except Exception as e:
            print(f"Error saving inputs: {e}")
            return False
    
    async def get_user_inputs(self, institution_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve user inputs from Firestore"""
        try:
            doc_ref = self.db.collection('inputs').document(institution_id)
            doc = doc_ref.get()
            
            if doc.exists:
                return doc.to_dict()
            return None
        except Exception as e:
            print(f"Error retrieving inputs: {e}")
            return None
    
    async def _notify_clients(self, institution_id: str, event_type: str):
        """Send real-time notification to connected clients"""
        try:
            notification_ref = self.db.collection('notifications').document(institution_id)
            notification_ref.set({
                'event_type': event_type,
                'timestamp': datetime.now(),
                'institution_id': institution_id
            })
        except Exception as e:
            print(f"Error sending notification: {e}")
