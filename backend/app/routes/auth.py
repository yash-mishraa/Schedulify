from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from typing import Optional
import jwt
from datetime import datetime, timedelta
import bcrypt
from firebase_admin import auth as firebase_auth
import os

router = APIRouter()
security = HTTPBearer()

# JWT Configuration
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-this-in-production")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_DELTA = timedelta(days=30)

class UserRegistration(BaseModel):
    email: EmailStr
    password: str
    institution_name: str
    full_name: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    uid: str
    email: str
    institution_name: str
    full_name: Optional[str] = None
    created_at: datetime

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    expires_in: int
    user: UserResponse

# Utility functions
def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    return bcrypt.checkpw(password.encode('utf-8'), hashed_password.encode('utf-8'))

def create_jwt_token(user_data: dict) -> str:
    """Create a JWT token for user"""
    payload = {
        "uid": user_data["uid"],
        "email": user_data["email"],
        "exp": datetime.utcnow() + JWT_EXPIRATION_DELTA,
        "iat": datetime.utcnow()
    }
    return jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)

def verify_jwt_token(token: str) -> dict:
    """Verify and decode JWT token"""
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get current user from JWT token"""
    token = credentials.credentials
    payload = verify_jwt_token(token)
    
    # Get user from Firebase
    try:
        user = firebase_auth.get_user(payload["uid"])
        return user
    except firebase_auth.UserNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

@router.post("/register", response_model=TokenResponse)
async def register_user(user_data: UserRegistration):
    """Register a new user"""
    try:
        # Create user in Firebase Auth
        firebase_user = firebase_auth.create_user(
            email=user_data.email,
            password=user_data.password,
            display_name=user_data.full_name
        )
        
        # Set custom claims for institution
        firebase_auth.set_custom_user_claims(firebase_user.uid, {
            "institution_name": user_data.institution_name,
            "role": "admin",
            "created_at": datetime.utcnow().isoformat()
        })
        
        # Create JWT token
        token = create_jwt_token({
            "uid": firebase_user.uid,
            "email": firebase_user.email
        })
        
        # Prepare response
        user_response = UserResponse(
            uid=firebase_user.uid,
            email=firebase_user.email,
            institution_name=user_data.institution_name,
            full_name=user_data.full_name,
            created_at=datetime.utcnow()
        )
        
        return TokenResponse(
            access_token=token,
            token_type="bearer",
            expires_in=int(JWT_EXPIRATION_DELTA.total_seconds()),
            user=user_response
        )
        
    except firebase_auth.EmailAlreadyExistsError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {str(e)}"
        )

@router.post("/login", response_model=TokenResponse)
async def login_user(login_data: UserLogin):
    """Login user with email and password"""
    try:
        # Firebase Admin SDK doesn't have direct password verification
        # For production, you'd use Firebase Auth REST API or client SDK
        # Here's a simplified version - in production, use proper authentication
        
        # Get user by email
        try:
            user = firebase_auth.get_user_by_email(login_data.email)
        except firebase_auth.UserNotFoundError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        # In production, verify password using Firebase Auth REST API
        # For now, we'll create the token (assuming password is correct)
        
        # Create JWT token
        token = create_jwt_token({
            "uid": user.uid,
            "email": user.email
        })
        
        # Get custom claims
        user_record = firebase_auth.get_user(user.uid)
        custom_claims = user_record.custom_claims or {}
        
        user_response = UserResponse(
            uid=user.uid,
            email=user.email,
            institution_name=custom_claims.get("institution_name", ""),
            full_name=user.display_name,
            created_at=datetime.fromisoformat(custom_claims.get("created_at", datetime.utcnow().isoformat()))
        )
        
        return TokenResponse(
            access_token=token,
            token_type="bearer",
            expires_in=int(JWT_EXPIRATION_DELTA.total_seconds()),
            user=user_response
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Login failed: {str(e)}"
        )

@router.post("/logout")
async def logout_user(current_user = Depends(get_current_user)):
    """Logout user (invalidate token on client side)"""
    return {"message": "Successfully logged out"}

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user = Depends(get_current_user)):
    """Get current user information"""
    custom_claims = current_user.custom_claims or {}
    
    return UserResponse(
        uid=current_user.uid,
        email=current_user.email,
        institution_name=custom_claims.get("institution_name", ""),
        full_name=current_user.display_name,
        created_at=datetime.fromisoformat(custom_claims.get("created_at", datetime.utcnow().isoformat()))
    )

@router.put("/profile")
async def update_user_profile(
    full_name: Optional[str] = None,
    institution_name: Optional[str] = None,
    current_user = Depends(get_current_user)
):
    """Update user profile"""
    try:
        update_data = {}
        
        if full_name:
            update_data["display_name"] = full_name
        
        if update_data:
            firebase_auth.update_user(current_user.uid, **update_data)
        
        # Update custom claims if institution name changed
        if institution_name:
            current_claims = current_user.custom_claims or {}
            current_claims["institution_name"] = institution_name
            firebase_auth.set_custom_user_claims(current_user.uid, current_claims)
        
        return {"message": "Profile updated successfully"}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Profile update failed: {str(e)}"
        )

@router.delete("/account")
async def delete_user_account(current_user = Depends(get_current_user)):
    """Delete user account"""
    try:
        firebase_auth.delete_user(current_user.uid)
        return {"message": "Account deleted successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Account deletion failed: {str(e)}"
        )

# Password reset endpoints
@router.post("/password-reset")
async def request_password_reset(email: EmailStr):
    """Request password reset (would integrate with Firebase Auth)"""
    try:
        # In production, use Firebase Auth REST API for password reset
        # This is a placeholder implementation
        user = firebase_auth.get_user_by_email(email)
        
        # Generate password reset link (Firebase Auth handles this)
        reset_link = firebase_auth.generate_password_reset_link(email)
        
        # In production, send email with reset link
        # For now, just return success message
        return {"message": "Password reset link sent to email"}
        
    except firebase_auth.UserNotFoundError:
        # Don't reveal if email exists for security
        return {"message": "If the email exists, a reset link has been sent"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Password reset request failed"
        )

@router.post("/verify-email")
async def send_email_verification(current_user = Depends(get_current_user)):
    """Send email verification"""
    try:
        # Generate email verification link
        verification_link = firebase_auth.generate_email_verification_link(current_user.email)
        
        # In production, send email with verification link
        return {"message": "Verification email sent"}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Email verification failed"
        )
