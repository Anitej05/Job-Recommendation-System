# main.py

from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any # Added List, Dict, Any
from fastapi.middleware.cors import CORSMiddleware
from gemini import call_gemini_api, logger # Import logger for potential use

app = FastAPI()

# Allow CORS for the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"], # Be more specific for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class PreferenceRequest(BaseModel):
    preferences: str = Field(..., example="Remote, Full-time, San Francisco")
    skills: str = Field(..., example="React, Node.js, Python, AWS")
    detailed_expectations: Optional[str] = Field(
        None,
        example="Looking for a mid-level role in a fast-paced startup with good work-life balance. "
                "Interested in companies focused on sustainable technology or social impact. "
                "Hoping for opportunities for mentorship and career growth. "
                "Ideal salary around $90,000 - $110,000. "
                "Prefer a collaborative team environment and a role where I can take ownership of projects."
    )

class ChatRequest(BaseModel):
    message: str

class JobRecommendation(BaseModel): # Define a response model for better OpenAPI docs
    title: str
    company: Optional[str] = None
    url: Optional[str] = None
    short_description: Optional[str] = None
    skills: Optional[List[str]] = None
    relevance_notes: Optional[str] = None
    # location: Optional[str] = None # Could be added if systematically extracted

class RecommendationsResponse(BaseModel):
    recommendations: List[JobRecommendation]


@app.post("/recommendations", response_model=RecommendationsResponse)
async def get_recommendations(request: PreferenceRequest):
    try:
        logger.info(f"Received recommendation request: {request.dict(exclude_none=True)}")
        # Convert Pydantic model to dict for call_gemini_api
        payload = request.dict(exclude_none=True)
        result = call_gemini_api("recommendation", payload)
        return {"recommendations": result}
    except ValueError as ve: # Catch specific errors if call_gemini_api raises them
        logger.error(f"Validation error in recommendation request: {ve}")
        raise HTTPException(status_code=422, detail=str(ve))
    except Exception as e:
        logger.error(f"Error during recommendation generation: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="An unexpected error occurred while generating recommendations.")

@app.post("/chat")
async def chat_with_bot(request: ChatRequest):
    try:
        result = call_gemini_api("chat", {"message": request.message})
        return {"response": result}
    except Exception as e:
        logger.error(f"Error during chat processing: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="An unexpected error occurred during chat.")

@app.get("/market-trends")
async def market_trends(
    sector: Optional[str] = Query(None, description="Optional sector to filter trends by")
):
    try:
        result = call_gemini_api("market_trends", {"sector": sector})
        return {"market_trends": result}
    except Exception as e:
        logger.error(f"Error fetching market trends: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="An unexpected error occurred while fetching market trends.")

if __name__ == "__main__":
    import uvicorn
    # This is for running directly, e.g. python main.py
    # In a typical setup, you'd run: uvicorn main:app --reload
    uvicorn.run(app, host="0.0.0.0", port=8000)