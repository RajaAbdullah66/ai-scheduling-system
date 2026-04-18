"""
local_search.py
===============
Local Search algorithms for Schedule Optimization.

Algorithms:
  A. Hill Climbing  - always move to a better neighbor; stops at local optimum
  B. Simulated Annealing - sometimes accept worse moves (escape local optima)

Key concepts for viva:
  - Neighbor   : a schedule that differs by ONE gene (one changed timeslot/room)
  - Local Opt  : a point where no neighbor is better (Hill Climbing gets stuck here)
  - Temperature: SA parameter; high T = accept bad moves freely; low T = almost greedy
  - Cooling    : temperature drops each iteration (geometric: T = T * cooling_rate)
"""

import random
import math
import time
import copy
from csp_solver import count_conflicts, fitness_score


# ---------------------------------------------------------------------------
# Neighbor Generation
# ---------------------------------------------------------------------------

def generate_neighbor(schedule, rooms, timeslots):
    """
    Generate a neighbor by randomly changing ONE attribute of ONE class.
    Either swap the timeslot or the room of a randomly selected entry.
    """
    neighbor = copy.deepcopy(schedule)
    if not neighbor:
        return neighbor

    # Pick a random class entry to modify
    idx = random.randint(0, len(neighbor) - 1)
    change = random.choice(["timeslot", "room"])

    if change == "timeslot":
        neighbor[idx]["timeslot"] = random.choice(timeslots)
    else:
        neighbor[idx]["room"] = random.choice(rooms)

    return neighbor


# ---------------------------------------------------------------------------
# Hill Climbing
# ---------------------------------------------------------------------------

def hill_climbing(
    courses, teachers, rooms, timeslots,
    initial_schedule=None,
    max_iterations=1000,
    restarts=5,
):
    """
    Steepest-Ascent Hill Climbing with random restarts.

    - At each step, generate a neighbor
    - If neighbor is better (higher fitness), move to it
    - If no improvement found for many steps, restart from a new random point
    - Random restarts help escape local optima

    Parameters
    ----------
    max_iterations : steps per restart
    restarts       : number of random restarts
    """
    start = time.time()
    fitness_history = []

    best_overall = None
    best_overall_fitness = -1

    for restart in range(restarts):
        # Initialize current solution
        if restart == 0 and initial_schedule:
            current = copy.deepcopy(initial_schedule)
        else:
            current = [
                {"course": courses[i], "teacher": teachers[i],
                 "room": random.choice(rooms), "timeslot": random.choice(timeslots)}
                for i in range(len(courses))
            ]

        current_fitness = fitness_score(current)

        for iteration in range(max_iterations):
            neighbor = generate_neighbor(current, rooms, timeslots)
            neighbor_fitness = fitness_score(neighbor)

            # Move to neighbor if it's better or equal (greedy ascent)
            if neighbor_fitness >= current_fitness:
                current = neighbor
                current_fitness = neighbor_fitness

            fitness_history.append(round(current_fitness, 4))

            # Perfect solution found
            if current_fitness == 1.0:
                break

        # Track global best across all restarts
        if current_fitness > best_overall_fitness:
            best_overall_fitness = current_fitness
            best_overall = copy.deepcopy(current)

        if best_overall_fitness == 1.0:
            break

    elapsed = round(time.time() - start, 4)
    conflicts = count_conflicts(best_overall)

    return {
        "success": True,
        "schedule": best_overall,
        "stats": {
            "restarts": restarts,
            "max_iterations_per_restart": max_iterations,
            "final_best_fitness": round(best_overall_fitness, 4),
        },
        "execution_time": elapsed,
        "conflicts": conflicts,
        "fitness": round(best_overall_fitness, 4),
        "fitness_history": fitness_history[-200:],  # last 200 for chart
        "message": f"Hill Climbing done. Best fitness: {best_overall_fitness:.4f}, Conflicts: {conflicts}"
    }


# ---------------------------------------------------------------------------
# Simulated Annealing
# ---------------------------------------------------------------------------

def simulated_annealing(
    courses, teachers, rooms, timeslots,
    initial_schedule=None,
    initial_temperature=100.0,
    cooling_rate=0.995,
    min_temperature=0.01,
    max_iterations=5000,
):
    """
    Simulated Annealing (SA) for schedule optimization.

    SA mimics the physical process of slowly cooling a material:
      - At high temperature: accepts both better AND worse moves (exploration)
      - At low temperature:  mostly accepts only better moves (exploitation)

    Acceptance probability for a worse move:
      P(accept) = exp( (new_fitness - current_fitness) / temperature )

    Parameters
    ----------
    initial_temperature : starting temperature (high = more random exploration)
    cooling_rate        : temperature multiplier per step (e.g. 0.995 → slow cooling)
    min_temperature     : stop when temperature drops below this
    max_iterations      : hard cap on iterations
    """
    start = time.time()

    # Initialize solution
    if initial_schedule:
        current = copy.deepcopy(initial_schedule)
    else:
        current = [
            {"course": courses[i], "teacher": teachers[i],
             "room": random.choice(rooms), "timeslot": random.choice(timeslots)}
            for i in range(len(courses))
        ]

    current_fitness = fitness_score(current)
    best = copy.deepcopy(current)
    best_fitness = current_fitness

    temperature = initial_temperature
    fitness_history = []
    iteration = 0

    while temperature > min_temperature and iteration < max_iterations:
        neighbor = generate_neighbor(current, rooms, timeslots)
        neighbor_fitness = fitness_score(neighbor)

        delta = neighbor_fitness - current_fitness

        # Always accept improvements; sometimes accept worse moves
        if delta > 0:
            current = neighbor
            current_fitness = neighbor_fitness
        else:
            # Boltzmann acceptance criterion
            prob = math.exp(delta / temperature)
            if random.random() < prob:
                current = neighbor
                current_fitness = neighbor_fitness

        # Track global best
        if current_fitness > best_fitness:
            best_fitness = current_fitness
            best = copy.deepcopy(current)

        # Cool down
        temperature *= cooling_rate
        iteration += 1

        fitness_history.append(round(best_fitness, 4))

        if best_fitness == 1.0:
            break

    elapsed = round(time.time() - start, 4)
    conflicts = count_conflicts(best)

    return {
        "success": True,
        "schedule": best,
        "stats": {
            "iterations_run": iteration,
            "initial_temperature": initial_temperature,
            "cooling_rate": cooling_rate,
            "final_temperature": round(temperature, 4),
            "final_best_fitness": round(best_fitness, 4),
        },
        "execution_time": elapsed,
        "conflicts": conflicts,
        "fitness": round(best_fitness, 4),
        "fitness_history": fitness_history[-200:],
        "message": f"SA done in {iteration} iterations. Best fitness: {best_fitness:.4f}, Conflicts: {conflicts}"
    }
