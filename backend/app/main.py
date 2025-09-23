from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os
from datetime import datetime
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Import routes (Firebase will be initialized when FirebaseService is created)
from app.routes import timetable, auth

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("🚀 Schedulify Backend Started on Render")
    # Test Firebase connection on startup
    try:
        from app.services.firebase_service import FirebaseService
        firebase_service = FirebaseService()
        logger.info("✅ Firebase connection established successfully")
    except Exception as e:
        logger.error(f"❌ Firebase connection failed: {e}")
        # Don't crash the app, but log the error
    yield
    # Shutdown
    logger.info("👋 Schedulify Backend Stopped")

app = FastAPI(
    title="Schedulify API",
    description="AI-Powered Automatic Timetable Generator",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration - Updated for Render + Vercel
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", 
        "https://*.vercel.app",
        "https://*.onrender.com",
        "https://schedulify-frontend.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

# Include routers
app.include_router(timetable.router, prefix="/api/v1/timetable", tags=["timetable"])
app.include_router(auth.router, prefix="/api/v1/auth", tags=["authentication"])

@app.get("/")
async def root():
    return {
        "message": "Schedulify API is running on Render!", 
        "timestamp": datetime.now(),
        "status": "healthy",
        "platform": "render"
    }

@app.get("/health")
async def health_check():
    """Enhanced health check with Firebase connection status"""
    try:
        from app.services.firebase_service import FirebaseService
        firebase_service = FirebaseService()
        firebase_status = "connected"
    except Exception as e:
        firebase_status = f"error: {str(e)}"
    
    return {
        "status": "healthy", 
        "service": "schedulify-backend", 
        "platform": "render",
        "firebase": firebase_status,
        "timestamp": datetime.now()
    }

@app.get("/test-firebase")
async def test_firebase():
    """Test Firebase connection endpoint"""
    try:
        from app.services.firebase_service import FirebaseService
        firebase_service = FirebaseService()
        
        # Try to access a collection (won't create anything)
        test_ref = firebase_service.db.collection('test')
        
        return {
            "firebase_status": "✅ Connected successfully",
            "project_id": os.getenv("FIREBASE_PROJECT_ID"),
            "timestamp": datetime.now()
        }
    except Exception as e:
        return {
            "firebase_status": f"❌ Connection failed: {str(e)}",
            "timestamp": datetime.now()
        }

# Add this for Render deployment
if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
