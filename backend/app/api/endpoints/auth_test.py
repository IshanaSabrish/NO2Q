from fastapi import APIRouter, HTTPException
from app.models import UserModel
from app.core.security import verify_password, get_password_hash

router = APIRouter()

# Hard‑coded admin credentials (same as seed)
ADMIN_EMAIL = "admin@no2q.com"
ADMIN_PASSWORD_HASH = get_password_hash("admin123")

@router.post("/register")
async def register_test(payload: dict):
    """Create a user without OTP (for testing)."""
    role = payload.get("role")
    name = payload.get("name")
    if not role or not name:
        raise HTTPException(status_code=400, detail="role and name required")
    if role == "customer":
        phone = payload.get("phone")
        if not phone:
            raise HTTPException(status_code=400, detail="phone required for customer")
        if await UserModel.exists(phone=phone):
            raise HTTPException(status_code=400, detail="Customer already exists")
        user = await UserModel.create(name=name, role="customer", phone=phone, status="active")
    else:
        email = payload.get("email")
        password = payload.get("password")
        if not email or not password:
            raise HTTPException(status_code=400, detail="email and password required")
        if await UserModel.exists(email=email):
            raise HTTPException(status_code=400, detail="User already exists")
        user = await UserModel.create(
            name=name,
            role=role,
            email=email,
            password_hash=get_password_hash(password),
            status="active" if role == "admin" else "pending",
        )
    return {"message": "Test registration successful", "user_id": user.id}

@router.post("/login")
async def login_test(payload: dict):
    """Login using hard‑coded admin or any existing user without OTP for customers."""
    identifier = payload.get("identifier")
    password = payload.get("password")
    if not identifier:
        raise HTTPException(status_code=400, detail="identifier required")

    # Admin shortcut
    if identifier == ADMIN_EMAIL:
        if not password:
            raise HTTPException(status_code=400, detail="Password required for admin")
        if not verify_password(password, ADMIN_PASSWORD_HASH):
            raise HTTPException(status_code=401, detail="Invalid credentials")
        user = await UserModel.find_one({"email": ADMIN_EMAIL})
        if not user:
            raise HTTPException(status_code=404, detail="Admin not found")
        return {"token": "test-token", "role": user.role, "status": user.status, "user_id": str(user.id)}

    # General lookup (email or phone)
    query = {"email": identifier} if "@" in identifier else {"phone": identifier}
    user = await UserModel.find_one(query)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.role == "customer":
        return {"token": "test-token", "role": user.role, "status": user.status, "user_id": str(user.id)}

    if not password:
        raise HTTPException(status_code=400, detail="Password required for owner/admin")
    if not verify_password(password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    return {"token": "test-token", "role": user.role, "status": user.status, "user_id": str(user.id)}
