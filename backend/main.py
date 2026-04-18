"""
main.py
=======
FastAPI backend for the AI-Based Scheduling System.

Endpoints:
  POST /api/schedule       - Run full CSP + optimization pipeline
  POST /api/csp-only       - Run CSP solver only
  GET  /api/sample-data    - Return sample input data for testing
  GET  /api/health         - Health check
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional
import uvicorn

from scheduler import run_full_pipeline, validate_inputs

# ---------------------------------------------------------------------------
# App Setup
# ---------------------------------------------------------------------------

app = FastAPI(
    title="AI Scheduling System API",
    description="CSP + Genetic Algorithm timetable scheduler",
    version="1.0.0"
)

# Allow React frontend to call this API (CORS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],           # In production, set to your Vercel URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Request Models (Pydantic validates JSON body automatically)
# ---------------------------------------------------------------------------

class ScheduleRequest(BaseModel):
    courses: List[str] = Field(..., description="List of course names")
    teachers: List[str] = Field(..., description="Teacher for each course (same length as courses)")
    rooms: List[str] = Field(..., description="Available room names")
    timeslots: List[str] = Field(..., description="Available timeslots e.g. 'Mon-8AM'")
    optimization_algorithm: Optional[str] = Field(
        "genetic",
        description="'genetic' | 'hill_climbing' | 'simulated_annealing'"
    )
    csp_forward_checking: Optional[bool] = Field(True, description="Use forward checking in CSP")
    ga_population_size: Optional[int] = Field(50, ge=10, le=500)
    ga_generations: Optional[int] = Field(150, ge=10, le=1000)
    ga_mutation_rate: Optional[float] = Field(0.1, ge=0.0, le=1.0)


class CSPOnlyRequest(BaseModel):
    courses: List[str]
    teachers: List[str]
    rooms: List[str]
    timeslots: List[str]
    use_forward_checking: Optional[bool] = True


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.get("/api/health")
def health_check():
    """Simple health check endpoint."""
    return {"status": "ok", "message": "AI Scheduling System is running 🚀"}


@app.get("/api/sample-data")
def get_sample_data():
    """Return sample input data for quick testing in the frontend."""
    return {
        "courses": [
            "Mathematics", "Physics", "Chemistry",
            "English", "Computer Science", "Biology",
            "History", "Geography"
        ],
        "teachers": [
            "Dr. Ahmed", "Prof. Sara", "Dr. Khalid",
            "Ms. Fatima", "Mr. Bilal", "Dr. Ayesha",
            "Mr. Hassan", "Ms. Zara"
        ],
        "rooms": ["Room-A101", "Room-B202", "Room-C303", "Lab-101"],
        "timeslots": [
            "Mon-8AM", "Mon-9AM", "Mon-10AM", "Mon-11AM",
            "Tue-8AM", "Tue-9AM", "Tue-10AM", "Tue-11AM",
            "Wed-8AM", "Wed-9AM"
        ]
    }


@app.post("/api/schedule")
def generate_schedule(req: ScheduleRequest):
    """
    Main endpoint: Run CSP → Optimization pipeline.
    Returns both CSP result and optimized result with comparison metrics.
    """
    # Validate
    valid, msg = validate_inputs(req.courses, req.teachers, req.rooms, req.timeslots)
    if not valid:
        raise HTTPException(status_code=400, detail=msg)

    allowed_algorithms = ["genetic", "hill_climbing", "simulated_annealing"]
    if req.optimization_algorithm not in allowed_algorithms:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown algorithm '{req.optimization_algorithm}'. Choose from: {allowed_algorithms}"
        )

    result = run_full_pipeline(
        courses=req.courses,
        teachers=req.teachers,
        rooms=req.rooms,
        timeslots=req.timeslots,
        optimization_algorithm=req.optimization_algorithm,
        csp_forward_checking=req.csp_forward_checking,
        ga_population_size=req.ga_population_size,
        ga_generations=req.ga_generations,
        ga_mutation_rate=req.ga_mutation_rate,
    )

    return result


@app.post("/api/csp-only")
def csp_only(req: CSPOnlyRequest):
    """Run only the CSP solver (no optimization). Useful for comparison."""
    from csp_solver import solve_csp

    valid, msg = validate_inputs(req.courses, req.teachers, req.rooms, req.timeslots)
    if not valid:
        raise HTTPException(status_code=400, detail=msg)

    return solve_csp(
        courses=req.courses,
        teachers=req.teachers,
        rooms=req.rooms,
        timeslots=req.timeslots,
        use_forward_checking=req.use_forward_checking,
    )


# ---------------------------------------------------------------------------
# Run server
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
