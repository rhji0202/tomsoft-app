from fastapi import APIRouter, HTTPException
from ..services.background_service import remove_background

router = APIRouter()

@router.get("/remove-bg/")
async def remove_bg(imageUrl: str):
    try:
        result = await remove_background(imageUrl)
        return {
            "success": 200,
            "image": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 