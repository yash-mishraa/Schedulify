from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import firebase_admin
from firebase_admin import credentials, firestore
import os
from datetime import datetime

from app.models.timetable import TimetableRequest, TimetableResponse
from app.services.genetic_algorithm import GeneticTimetableOptimizer
from app.services.firebase_service import FirebaseService
from app.routes import timetable, auth

# Initialize Firebase Admin
if not firebase_admin._apps:
    cred = credentials.Certificate({
        "type": "service_account",
        "project_id": os.getenv("FIREBASE_PROJECT_ID"),
        "private_key_id": os.getenv("FIREBASE_PRIVATE_KEY_ID"),
        "private_key": os.getenv("FIREBASE_PRIVATE_KEY").replace('\\n', '\n'),
        "client_email": os.getenv("FIREBASE_CLIENT_EMAIL"),
        "client_id": os.getenv("FIREBASE_CLIENT_ID"),
        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
        "token_uri": "https://oauth2.googleapis.com/token"
    })
    firebase_admin.initialize_app(cred)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("🚀 Schedulify Backend Started on Render")
    yield
    # Shutdown
    print("👋 Schedulify Backend Stopped")

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
        "https://*.onrender.com",  # Add Render domains
        "https://schedulify-frontend.vercel.app"  # Your specific Vercel domain
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
        "status": "healthy"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "schedulify-backend", "platform": "render"}

# Add this for Render deployment
if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
