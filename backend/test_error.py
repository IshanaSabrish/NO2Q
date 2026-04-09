import asyncio
import sys
from app.api.endpoints.queue import update_status
from fastapi import BackgroundTasks
import traceback

async def test():
    try:
        bt = BackgroundTasks()
        await update_status('69d3ddec70337e0f11b4c830', 'called', bt)
    except Exception as e:
        traceback.print_exc()

asyncio.run(test())
