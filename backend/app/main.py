from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
import pytz

# Import routes
from .routes import timetable, institutions

app = FastAPI(
    title="Schedulify API",
    description="AI-Powered Timetable Generator",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://*.vercel.app",
        "https://schedulify-frontend.vercel.app",
        "https://schedulify-kl5qrg7yd-yashmishra1408-gmailcoms-projects.vercel.app",
        "https://*.yashmishra1408-gmailcoms-projects.vercel.app",
        "*"  # Allow all origins for now
    ],
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Include routers
app.include_router(timetable.router)
app.include_router(institutions.router)

@app.get("/")
async def root():
    return {
        "message": "Schedulify API is running",
        "version": "1.0.0",
        "status": "healthy"
    }

@app.get("/health")
async def health_check():
    try:
        ist_timezone = pytz.timezone('Asia/Kolkata')
        current_time = datetime.now(ist_timezone)
        
        return {
            "status": "healthy",
            "service": "schedulify-backend", 
            "platform": "render",
            "firebase": "available",
            "timestamp": current_time.isoformat()
        }
    except Exception as e:
        return {
            "status": "degraded",
            "service": "schedulify-backend",
            "platform": "render", 
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }
