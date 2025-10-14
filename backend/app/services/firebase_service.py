import firebase_admin
from firebase_admin import credentials, firestore
from typing import Dict, Any, Optional
from datetime import datetime
import os
import json
import asyncio

class FirebaseService:
    def __init__(self):
        self.db = None
        self.initialize_firebase()
    
    def initialize_firebase(self):
        """Initialize Firebase Admin SDK"""
        try:
            # Check if Firebase is already initialized
            if not firebase_admin._apps:
                # Get Firebase credentials from environment
                firebase_credentials = os.getenv('FIREBASE_CREDENTIALS')
                
                if firebase_credentials:
                    # Parse the JSON credentials
                    cred_dict = json.loads(firebase_credentials)
                    cred = credentials.Certificate(cred_dict)
                else:
                    # Fallback to default credentials (for local development)
                    cred = credentials.ApplicationDefault()
                
                # Initialize the app
                firebase_admin.initialize_app(cred)
            
            # Get Firestore client
            self.db = firestore.client()
            print("Firebase initialized successfully")
            
        except Exception as e:
            print(f"Firebase initialization error: {e}")
            # Create a mock db for development
            self.db = None
    
    async def save_timetable(self, institution_id: str, timetable_data: Dict[str, Any]):
        """Save timetable to Firestore"""
        try:
            if not self.db:
                print("Firebase not available, skipping save")
                return
                
            doc_data = {
                'institution_id': institution_id,
                'timetable': timetable_data.get('timetable', {}),
                'fitness_score': timetable_data.get('fitness_score', 0),
                'summary': timetable_data.get('summary', {}),
                'generation_count': timetable_data.get('generation', 0),
                'created_at': datetime.now().isoformat(),
                'updated_at': datetime.now().isoformat()
            }
            
            # Save to timetables collection
            doc_ref = self.db.collection('timetables').document()
            doc_ref.set(doc_data)
            
            print(f"Timetable saved for institution {institution_id}")
            
        except Exception as e:
            print(f"Error saving timetable: {e}")
    
    async def get_timetable(self, institution_id: str) -> Optional[Dict[str, Any]]:
        """Get latest timetable for institution"""
        try:
            if not self.db:
                return None
                
            # Query for latest timetable
            query = (self.db.collection('timetables')
                    .where('institution_id', '==', institution_id)
                    .order_by('created_at', direction=firestore.Query.DESCENDING)
                    .limit(1))
            
            docs = query.stream()
            for doc in docs:
                return doc.to_dict()
            
            return None
            
        except Exception as e:
            print(f"Error getting timetable: {e}")
            return None
    
    async def save_user_inputs(self, institution_id: str, user_inputs: Dict[str, Any]):
        """Save user inputs to Firestore"""
        try:
            if not self.db:
                print("Firebase not available, skipping save")
                return
                
            doc_data = {
                'institution_id': institution_id,
                'inputs': user_inputs,
                'created_at': datetime.now().isoformat()
            }
            
            # Save to user_inputs collection
            doc_ref = self.db.collection('user_inputs').document()
            doc_ref.set(doc_data)
            
            print(f"User inputs saved for institution {institution_id}")
            
        except Exception as e:
            print(f"Error saving user inputs: {e}")

# Global instance
_firebase_service = None

def get_firebase_service() -> FirebaseService:
    """Get Firebase service instance (singleton pattern)"""
    global _firebase_service
    if _firebase_service is None:
        _firebase_service = FirebaseService()
    return _firebase_service
