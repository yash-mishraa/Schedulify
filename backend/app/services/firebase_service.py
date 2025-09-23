from firebase_admin import firestore
from typing import Dict, Any, Optional
import asyncio
from datetime import datetime
import firebase_admin
from firebase_admin import credentials
import os
import logging

logger = logging.getLogger(__name__)

class FirebaseService:
    def __init__(self):
        # Initialize Firebase if not already done
        self._initialize_firebase()
        self.db = firestore.client()
    
    def _initialize_firebase(self):
        """Initialize Firebase Admin SDK if not already initialized"""
        try:
            # Check if Firebase is already initialized
            firebase_admin.get_app()
            logger.info("Firebase already initialized")
        except ValueError:
            # Firebase not initialized, so initialize it
            logger.info("Initializing Firebase Admin SDK")
            
            # Get credentials from environment variables
            firebase_config = {
                "type": "service_account",
                "project_id": os.getenv("FIREBASE_PROJECT_ID"),
                "private_key_id": os.getenv("FIREBASE_PRIVATE_KEY_ID"),
                "private_key": os.getenv("FIREBASE_PRIVATE_KEY", "").replace('\\n', '\n'),
                "client_email": os.getenv("FIREBASE_CLIENT_EMAIL"),
                "client_id": os.getenv("FIREBASE_CLIENT_ID"),
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs"
            }
            
            # Validate required environment variables
            required_vars = ["FIREBASE_PROJECT_ID", "FIREBASE_PRIVATE_KEY_ID", 
                           "FIREBASE_PRIVATE_KEY", "FIREBASE_CLIENT_EMAIL", "FIREBASE_CLIENT_ID"]
            
            missing_vars = [var for var in required_vars if not os.getenv(var)]
            if missing_vars:
                raise ValueError(f"Missing required Firebase environment variables: {missing_vars}")
            
            # Initialize Firebase
            cred = credentials.Certificate(firebase_config)
            firebase_admin.initialize_app(cred)
            logger.info("Firebase Admin SDK initialized successfully")
    
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
            logger.error(f"Error saving timetable: {e}")
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
            logger.error(f"Error retrieving timetable: {e}")
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
            logger.error(f"Error saving inputs: {e}")
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
            logger.error(f"Error retrieving inputs: {e}")
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
            logger.error(f"Error sending notification: {e}")
