from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os
from dotenv import load_dotenv

from routers import users, articles, sessions, websocket

# Load environment variables
load_dotenv()

app = FastAPI(
    title="Jarvis Backend API",
    description="Backend service for S9 Reading Classroom",
    version="1.0.0"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(users.router)
app.include_router(articles.router)
app.include_router(sessions.router)
app.include_router(websocket.router)

@app.get("/")
async def root():
    return {"message": "Welcome to Jarvis Backend API", "status": "running"}

@app.get("/health")
async def health_check():
    return {"status": "ok"}

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    # Use SSL for WSS (secure WebSocket) support
    # Note: reload=False because reload mode is incompatible with SSL
    uvicorn.run(
        "main:app", 
        host="0.0.0.0", 
        port=port, 
        reload=False,  # SSL requires reload=False
        ssl_keyfile="server.key",
        ssl_certfile="server.crt"
    )


