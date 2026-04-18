"""
scheduler.py
============
High-level Scheduler that orchestrates the full pipeline:
  1. Run CSP solver  →  get initial valid (or partial) schedule
  2. Run optimization (GA / Hill Climbing / SA) →  improve it
  3. Return comparison metrics

This module is the brain that connects the API to the algorithms.
"""

from csp_solver import solve_csp
from genetic_algorithm import genetic_algorithm
from local_search import hill_climbing, simulated_annealing


def run_full_pipeline(
    courses: list,
    teachers: list,
    rooms: list,
    timeslots: list,
    optimization_algorithm: str = "genetic",   # "genetic" | "hill_climbing" | "simulated_annealing"
    csp_forward_checking: bool = True,
    ga_population_size: int = 50,
    ga_generations: int = 150,
    ga_mutation_rate: float = 0.1,
):
    """
    Full scheduling pipeline.

    Step 1: CSP generates a conflict-free (or best-effort) schedule.
    Step 2: Optimization algorithm refines it.
    Step 3: Return both results + comparison metrics.

    Parameters
    ----------
    courses, teachers, rooms, timeslots : data from user
    optimization_algorithm : which optimizer to use after CSP
    csp_forward_checking   : whether CSP uses forward checking
    ga_*                   : GA hyperparameters

    Returns complete result dict ready to send to the frontend.
    """

    # =========================================================
    # PHASE 1: CSP Solver
    # =========================================================
    csp_result = solve_csp(
        courses=courses,
        teachers=teachers,
        rooms=rooms,
        timeslots=timeslots,
        use_forward_checking=csp_forward_checking,
    )

    initial_schedule = csp_result["schedule"] if csp_result["success"] else None

    # =========================================================
    # PHASE 2: Optimization
    # =========================================================
    opt_result = None

    if optimization_algorithm == "genetic":
        opt_result = genetic_algorithm(
            courses=courses,
            teachers=teachers,
            rooms=rooms,
            timeslots=timeslots,
            initial_schedule=initial_schedule,
            population_size=ga_population_size,
            generations=ga_generations,
            mutation_rate=ga_mutation_rate,
        )

    elif optimization_algorithm == "hill_climbing":
        opt_result = hill_climbing(
            courses=courses,
            teachers=teachers,
            rooms=rooms,
            timeslots=timeslots,
            initial_schedule=initial_schedule,
        )

    elif optimization_algorithm == "simulated_annealing":
        opt_result = simulated_annealing(
            courses=courses,
            teachers=teachers,
            rooms=rooms,
            timeslots=timeslots,
            initial_schedule=initial_schedule,
        )

    # =========================================================
    # PHASE 3: Build Response
    # =========================================================

    # Best schedule is from optimizer (usually better); fallback to CSP
    final_schedule = opt_result["schedule"] if opt_result else initial_schedule or []

    return {
        "csp": {
            "schedule": csp_result.get("schedule", []),
            "execution_time": csp_result.get("execution_time", 0),
            "conflicts": csp_result.get("conflicts", 0),
            "fitness": csp_result.get("fitness", 0),
            "stats": csp_result.get("stats", {}),
            "message": csp_result.get("message", ""),
        },
        "optimization": {
            "algorithm": optimization_algorithm,
            "schedule": opt_result.get("schedule", []) if opt_result else [],
            "execution_time": opt_result.get("execution_time", 0) if opt_result else 0,
            "conflicts": opt_result.get("conflicts", 0) if opt_result else 0,
            "fitness": opt_result.get("fitness", 0) if opt_result else 0,
            "fitness_history": opt_result.get("fitness_history", []) if opt_result else [],
            "stats": opt_result.get("stats", {}) if opt_result else {},
            "message": opt_result.get("message", "") if opt_result else "",
        },
        "final_schedule": final_schedule,
        "comparison": {
            "csp_time": csp_result.get("execution_time", 0),
            "opt_time": opt_result.get("execution_time", 0) if opt_result else 0,
            "csp_conflicts": csp_result.get("conflicts", 0),
            "opt_conflicts": opt_result.get("conflicts", 0) if opt_result else 0,
            "csp_fitness": csp_result.get("fitness", 0),
            "opt_fitness": opt_result.get("fitness", 0) if opt_result else 0,
        }
    }


def validate_inputs(courses, teachers, rooms, timeslots):
    """
    Validate that inputs are sufficient to produce a valid schedule.
    Returns (valid: bool, message: str)
    """
    if len(courses) == 0:
        return False, "At least one course is required."
    if len(courses) != len(teachers):
        return False, "Each course must have exactly one teacher assigned."
    if len(rooms) == 0:
        return False, "At least one room is required."
    if len(timeslots) == 0:
        return False, "At least one timeslot is required."
    if len(rooms) * len(timeslots) < len(courses):
        return False, (
            f"Not enough capacity: {len(courses)} courses but only "
            f"{len(rooms) * len(timeslots)} room-timeslot combinations available."
        )
    # Check for duplicate teacher assignments in same timeslot — warn if impossible
    unique_teachers = set(teachers)
    if len(timeslots) < max(teachers.count(t) for t in unique_teachers):
        return False, "A teacher is assigned too many courses for the available timeslots."
    return True, "OK"
