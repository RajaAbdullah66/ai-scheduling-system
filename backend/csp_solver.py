"""
csp_solver.py
=============
Constraint Satisfaction Problem (CSP) Solver for Timetable Scheduling.

Algorithms implemented:
  1. Backtracking Search  - assigns variables one by one, backtracks on conflict
  2. Forward Checking     - after each assignment, prune domains of unassigned vars

Key concepts for viva:
  - Variable  : a (course, teacher) pair that needs a timeslot + room
  - Domain    : all possible (timeslot, room) combinations
  - Constraint: no two variables share the same teacher, room, OR timeslot
"""

import time
import copy
from typing import Optional


# ---------------------------------------------------------------------------
# Data Structures
# ---------------------------------------------------------------------------

class ScheduleEntry:
    """Represents one scheduled class."""
    def __init__(self, course, teacher, room, timeslot):
        self.course = course
        self.teacher = teacher
        self.room = room
        self.timeslot = timeslot

    def to_dict(self):
        return {
            "course": self.course,
            "teacher": self.teacher,
            "room": self.room,
            "timeslot": self.timeslot,
        }


# ---------------------------------------------------------------------------
# Constraint Checker
# ---------------------------------------------------------------------------

def is_consistent(assignment: dict, variable: tuple, value: tuple) -> bool:
    """
    Check whether assigning `value` = (timeslot, room) to `variable` = (course, teacher)
    violates any hard constraint with the current partial assignment.

    Hard constraints:
      C1 - No teacher can be in two places at the same time
      C2 - No room can host two classes at the same time
      C3 - No course can appear twice in the same timeslot
    """
    new_course, new_teacher = variable
    new_timeslot, new_room = value

    for (course, teacher), (timeslot, room) in assignment.items():
        if timeslot == new_timeslot:
            # C1: teacher conflict
            if teacher == new_teacher:
                return False
            # C2: room conflict
            if room == new_room:
                return False
            # C3: same course twice in one slot (shouldn't happen, but safety check)
            if course == new_course:
                return False
    return True


# ---------------------------------------------------------------------------
# Forward Checking Helper
# ---------------------------------------------------------------------------

def forward_check(domains: dict, assignment: dict, variable: tuple, value: tuple) -> Optional[dict]:
    """
    After assigning `value` to `variable`, remove from other variables' domains
    any values that would immediately violate a constraint.

    Returns pruned domains dict, or None if any domain becomes empty (dead-end).
    """
    pruned = copy.deepcopy(domains)
    new_course, new_teacher = variable
    new_timeslot, new_room = value

    for var in pruned:
        if var in assignment:
            continue  # already assigned
        course, teacher = var
        to_remove = []
        for val in pruned[var]:
            ts, room = val
            if ts == new_timeslot:
                if teacher == new_teacher or room == new_room or course == new_course:
                    to_remove.append(val)
        for v in to_remove:
            pruned[var].remove(v)
        if len(pruned[var]) == 0:
            return None  # domain wipe-out → dead end
    return pruned


# ---------------------------------------------------------------------------
# Variable Ordering Heuristic  (MRV – Minimum Remaining Values)
# ---------------------------------------------------------------------------

def select_unassigned_variable(variables: list, assignment: dict, domains: dict) -> tuple:
    """
    MRV heuristic: pick the variable with the fewest remaining legal values.
    Fewer choices = higher chance of conflict → tackle it first.
    """
    unassigned = [v for v in variables if v not in assignment]
    # Sort by domain size (ascending); ties broken by position
    return min(unassigned, key=lambda var: len(domains[var]))


# ---------------------------------------------------------------------------
# Core Backtracking Search
# ---------------------------------------------------------------------------

def backtrack(variables, domains, assignment, use_forward_checking=True, stats=None):
    """
    Recursive backtracking search.

    Parameters
    ----------
    variables           : list of (course, teacher) tuples
    domains             : dict mapping each variable to list of (timeslot, room) values
    assignment          : dict of already-made assignments  {variable: value}
    use_forward_checking: if True, prune domains after each assignment
    stats               : dict to track nodes explored, backtracks

    Returns complete assignment dict or None if unsatisfiable.
    """
    if stats is None:
        stats = {"nodes": 0, "backtracks": 0}

    # Base case: all variables assigned
    if len(assignment) == len(variables):
        return assignment

    # Choose next variable (MRV heuristic)
    var = select_unassigned_variable(variables, assignment, domains)
    stats["nodes"] += 1

    for value in domains[var]:
        if is_consistent(assignment, var, value):
            assignment[var] = value

            if use_forward_checking:
                new_domains = forward_check(domains, assignment, var, value)
                if new_domains is not None:
                    result = backtrack(variables, new_domains, assignment, use_forward_checking, stats)
                    if result is not None:
                        return result
            else:
                result = backtrack(variables, domains, assignment, use_forward_checking, stats)
                if result is not None:
                    return result

            # Backtrack
            del assignment[var]
            stats["backtracks"] += 1

    return None  # No valid assignment found


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def solve_csp(courses, teachers, rooms, timeslots, use_forward_checking=True):
    """
    Main entry point for CSP scheduling.

    Parameters
    ----------
    courses    : list of str   e.g. ["Math", "Physics", ...]
    teachers   : list of str   e.g. ["Dr. Ali", "Ms. Sara", ...]
    rooms      : list of str   e.g. ["R101", "R102", ...]
    timeslots  : list of str   e.g. ["Mon-8AM", "Mon-9AM", ...]

    Assumes courses[i] is taught by teachers[i] (1:1 mapping).

    Returns dict with keys: schedule, stats, execution_time, conflicts
    """
    start = time.time()

    # Build variables: one per course-teacher pair
    variables = [(courses[i], teachers[i]) for i in range(len(courses))]

    # Build domains: each variable can go in any (timeslot, room) combo
    full_domain = [(ts, room) for ts in timeslots for room in rooms]
    domains = {var: list(full_domain) for var in variables}

    stats = {"nodes": 0, "backtracks": 0}
    assignment = backtrack(variables, domains, {}, use_forward_checking, stats)

    elapsed = round(time.time() - start, 4)

    if assignment is None:
        return {
            "success": False,
            "schedule": [],
            "stats": stats,
            "execution_time": elapsed,
            "conflicts": 0,
            "fitness": 0,
            "message": "No valid schedule found. Try adding more rooms or timeslots."
        }

    # Convert to list of dicts
    schedule = []
    for (course, teacher), (timeslot, room) in assignment.items():
        schedule.append(ScheduleEntry(course, teacher, room, timeslot).to_dict())

    # Count conflicts (should be 0 for CSP solution)
    conflicts = count_conflicts(schedule)

    return {
        "success": True,
        "schedule": schedule,
        "stats": stats,
        "execution_time": elapsed,
        "conflicts": conflicts,
        "fitness": fitness_score(schedule),
        "message": "Schedule generated successfully using CSP!"
    }


# ---------------------------------------------------------------------------
# Utility: Conflict Counter & Fitness Score
# ---------------------------------------------------------------------------

def count_conflicts(schedule: list) -> int:
    """Count hard constraint violations in a schedule."""
    conflicts = 0
    n = len(schedule)
    for i in range(n):
        for j in range(i + 1, n):
            a, b = schedule[i], schedule[j]
            if a["timeslot"] == b["timeslot"]:
                if a["teacher"] == b["teacher"]:
                    conflicts += 1
                if a["room"] == b["room"]:
                    conflicts += 1
    return conflicts


def fitness_score(schedule: list) -> float:
    """
    Fitness = 1 / (1 + number_of_conflicts).
    Perfect schedule (0 conflicts) → fitness = 1.0
    """
    c = count_conflicts(schedule)
    return round(1.0 / (1 + c), 4)
