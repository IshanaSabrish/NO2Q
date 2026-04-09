from fastapi import APIRouter, HTTPException
from app.models import UserModel, RestaurantModel
from app.core.security import get_password_hash, verify_password, create_access_token
from app.core.database import get_db

router = APIRouter()

@router.post("/register")
async def register(payload: dict):
    role = payload.get("role")
    name = payload.get("name")

    if role not in {"customer", "owner", "admin"}:
        raise HTTPException(status_code=400, detail="Invalid role")
    if not name:
        raise HTTPException(status_code=400, detail="Name is required")

    if role == "customer":
        phone = payload.get("phone")
        if not phone:
            raise HTTPException(status_code=400, detail="Phone is required for customer")
        
        # Existing check
        existing = await UserModel.find_one(UserModel.phone == phone)
        if existing:
            # If already exists, just update the name and treat as a successful login/update
            existing.name = name
            await existing.save()
            user = existing
        else:
            user = UserModel(
                name=name,
                role="customer",
                phone=phone,
                status="approved",
            )
            await user.insert()
        
        token = create_access_token({"sub": str(user.id), "role": "customer"})
        return {
            "message": "Customer registered/updated successfully",
            "token": token,
            "role": "customer",
            "status": user.status,
            "user_id": str(user.id),
            "name": user.name,
            "phone": user.phone,
        }
    else:
        email = payload.get("email")
        password = payload.get("password")
        phone = payload.get("phone")
        if not email or not password or not phone:
            raise HTTPException(
                status_code=400,
                detail="Name, phone, email and password are required for owner/admin",
            )
            
        if await UserModel.find_one(UserModel.email == email):
            raise HTTPException(status_code=400, detail="User already exists with this email")
        if await UserModel.find_one(UserModel.phone == phone):
            raise HTTPException(status_code=400, detail="Phone number already used")

        user = UserModel(
            name=name,
            role=role,
            email=email,
            phone=phone,
            password_hash=get_password_hash(password),
            status="active" if role == "admin" else "pending",
        )
        await user.insert()

        if role == "owner":
            restaurant = RestaurantModel(
                owner_id=str(user.id),
                name=payload.get("restaurant_name", ""),
                location=payload.get("restaurant_location", ""),
                fssai=payload.get("fssai", ""),
                gst=payload.get("gst", ""),
                fssai_number=payload.get("fssai_number", ""),
                gst_number=payload.get("gst_number", ""),
                images=payload.get("images", []),
                menu_url=payload.get("menu_url", ""),
                menu_images=payload.get("menu_images", []),
            )
            await restaurant.insert()

    return {
        "message": "Registration successful",
        "user_id": str(user.id),
        "role": role,
        "status": user.status,
        "name": user.name,
    }

@router.post("/login")
async def login(payload: dict):
    identifier = str(payload.get("identifier", "")).strip()
    password = payload.get("password")
    
    print(f"DEBUG: Login attempt for identifier='{identifier}'")
    
    if not identifier:
        raise HTTPException(status_code=400, detail="Identifier is required")

    is_email = "@" in identifier
    is_digit = identifier.isdigit()
    length = len(identifier)
    
    print(f"DEBUG: is_email={is_email}, is_digit={is_digit}, length={length}")
    
    # Simplified Customer Login: 10-digit phone number
    if not is_email and is_digit and length == 10:
        print("DEBUG: Entering simplified customer login path")
        user = await UserModel.find_one(UserModel.phone == identifier)
        if not user:
            # Auto-register customer if not found
            user = UserModel(
                name=f"Customer {identifier[-4:]}",
                phone=identifier,
                role="customer",
                status="approved",
            )
            await user.insert()
        
        token = create_access_token({"sub": str(user.id), "role": "customer"})
        return {
            "token": token,
            "role": "customer",
            "status": user.status,
            "user_id": str(user.id),
            "name": user.name,
            "phone": user.phone,
        }

    # Traditional Login for Owner/Admin/Existing Email Users
    query = UserModel.email == identifier if is_email else UserModel.phone == identifier
    user = await UserModel.find_one(query)
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    import logging
    logging.info(f"LOGIN_DEBUG: {identifier} role={user.role}")

    # For customers who might have used a non-10 digit number but exist in DB
    if user.role == "customer":
        token = create_access_token({"sub": str(user.id), "role": user.role})
        return {
            "token": token,
            "role": user.role,
            "status": user.status,
            "user_id": str(user.id),
            "name": user.name,
            "phone": user.phone,
        }

    if not password:
        raise HTTPException(status_code=400, detail="Password required for owner/admin")

    hashed_password = getattr(user, "password_hash", None)
    if not hashed_password or not verify_password(password, hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token({"sub": str(user.id), "role": user.role})
    return {
        "token": token,
        "role": user.role,
        "status": user.status,
        "user_id": str(user.id),
        "name": user.name,
        "phone": user.phone,
    }
