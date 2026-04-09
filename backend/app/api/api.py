from fastapi import APIRouter
from app.api.endpoints import auth, restaurant, queue, upload, admin, table, auth_test

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(restaurant.router, prefix="/restaurants", tags=["restaurants"])
api_router.include_router(queue.router, prefix="/queue", tags=["queue"])
api_router.include_router(upload.router, prefix="/upload", tags=["upload"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
api_router.include_router(table.router, prefix="/tables", tags=["tables"])
api_router.include_router(auth_test.router, prefix="/auth_test", tags=["auth_test"])
