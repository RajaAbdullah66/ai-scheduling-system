"""
genetic_algorithm.py
====================
Genetic Algorithm (GA) for Timetable Schedule Optimization.

Biological analogy (for viva):
  - Chromosome  : one complete schedule (list of class assignments)
  - Gene        : one class assignment {course, teacher, room, timeslot}
  - Population  : collection of chromosomes (candidate schedules)
  - Fitness     : how good a schedule is (fewer conflicts = higher fitness)
  - Selection   : pick best chromosomes to reproduce (tournament selection)
  - Crossover   : combine two parent schedules to create children
  - Mutation    : randomly change a gene to explore new solutions

Algorithm Flow:
  1. Initialize random population
  2. Evaluate fitness of each chromosome
  3. Repeat for N generations:
       a. Select parents (tournament)
       b. Crossover → offspring
       c. Mutate offspring
       d. Evaluate fitness
       e. Replace worst with offspring (elitism: keep best)
  4. Return best chromosome found
"""

import random
import time
import copy
from csp_solver import count_conflicts, fitness_score


# ---------------------------------------------------------------------------
# Chromosome Representation
# ---------------------------------------------------------------------------

def random_chromosome(courses, teachers, rooms, timeslots):
    """
    Create one random schedule (chromosome).
    Each course-teacher pair is randomly assigned a room and timeslot.
    May have conflicts — GA will evolve to fix them.
    """
    chromosome = []
    for i in range(len(courses)):
        chromosome.append({
            "course": courses[i],
            "teacher": teachers[i],
            "room": random.choice(rooms),
            "timeslot": random.choice(timeslots),
        })
    return chromosome


# ---------------------------------------------------------------------------
# Fitness Function
# ---------------------------------------------------------------------------

def evaluate_fitness(chromosome):
    """
    Compute fitness of a chromosome.
    Fitness = 1 / (1 + total_conflicts)

    Perfect schedule → 0 conflicts → fitness = 1.0
    """
    return fitness_score(chromosome)


# ---------------------------------------------------------------------------
# Selection: Tournament Selection
# ---------------------------------------------------------------------------

def tournament_selection(population, fitness_scores, tournament_size=3):
    """
    Pick `tournament_size` random individuals, return the one with best fitness.
    Simulates natural selection: strong individuals are more likely to reproduce.
    """
    selected_indices = random.sample(range(len(population)), min(tournament_size, len(population)))
    best_idx = max(selected_indices, key=lambda i: fitness_scores[i])
    return copy.deepcopy(population[best_idx])


# ---------------------------------------------------------------------------
# Crossover: Single-Point Crossover
# ---------------------------------------------------------------------------

def crossover(parent1, parent2, crossover_rate=0.8):
    """
    Single-point crossover:
      - Pick a random split point
      - Child1 = parent1[:point] + parent2[point:]
      - Child2 = parent2[:point] + parent1[point:]

    Only applied with probability `crossover_rate` (default 80%).
    """
    if random.random() > crossover_rate or len(parent1) <= 1:
        return copy.deepcopy(parent1), copy.deepcopy(parent2)

    point = random.randint(1, len(parent1) - 1)
    child1 = copy.deepcopy(parent1[:point]) + copy.deepcopy(parent2[point:])
    child2 = copy.deepcopy(parent2[:point]) + copy.deepcopy(parent1[point:])
    return child1, child2


# ---------------------------------------------------------------------------
# Mutation: Random Gene Mutation
# ---------------------------------------------------------------------------

def mutate(chromosome, rooms, timeslots, mutation_rate=0.1):
    """
    For each gene (class assignment), with probability `mutation_rate`:
      - Randomly change the room OR the timeslot (or both)

    This ensures diversity and helps escape local optima.
    """
    mutated = copy.deepcopy(chromosome)
    for gene in mutated:
        if random.random() < mutation_rate:
            # Mutate timeslot
            gene["timeslot"] = random.choice(timeslots)
        if random.random() < mutation_rate:
            # Mutate room
            gene["room"] = random.choice(rooms)
    return mutated


# ---------------------------------------------------------------------------
# Core GA Loop
# ---------------------------------------------------------------------------

def genetic_algorithm(
    courses, teachers, rooms, timeslots,
    initial_schedule=None,
    population_size=50,
    generations=200,
    mutation_rate=0.1,
    crossover_rate=0.8,
    elitism_count=2,
):
    """
    Main Genetic Algorithm for schedule optimization.

    Parameters
    ----------
    courses, teachers, rooms, timeslots : input data
    initial_schedule : optional starting schedule (from CSP), seeded into population
    population_size  : number of candidate schedules per generation
    generations      : number of evolutionary cycles
    mutation_rate    : probability of mutating each gene (0.0–1.0)
    crossover_rate   : probability of performing crossover (0.0–1.0)
    elitism_count    : number of best individuals carried unchanged to next gen

    Returns dict with schedule, stats, execution_time, etc.
    """
    start = time.time()

    # ---- Step 1: Initialize Population ----
    population = []

    # Seed with the CSP solution if provided (gives GA a head start)
    if initial_schedule:
        population.append(initial_schedule)

    while len(population) < population_size:
        population.append(random_chromosome(courses, teachers, rooms, timeslots))

    # ---- Tracking ----
    best_fitness_history = []
    avg_fitness_history = []
    best_chromosome = None
    best_fitness = -1

    # ---- Step 2: Evolve ----
    for gen in range(generations):
        # Evaluate fitness for all chromosomes
        fitness_scores = [evaluate_fitness(chrom) for chrom in population]

        # Track best
        gen_best_idx = max(range(len(population)), key=lambda i: fitness_scores[i])
        gen_best_fitness = fitness_scores[gen_best_idx]

        if gen_best_fitness > best_fitness:
            best_fitness = gen_best_fitness
            best_chromosome = copy.deepcopy(population[gen_best_idx])

        avg_fit = round(sum(fitness_scores) / len(fitness_scores), 4)
        best_fitness_history.append(round(best_fitness, 4))
        avg_fitness_history.append(avg_fit)

        # Early exit if perfect solution found
        if best_fitness == 1.0:
            break

        # ---- Step 3: Create New Generation ----
        # Sort by fitness descending (for elitism)
        sorted_pop = sorted(
            zip(fitness_scores, population),
            key=lambda x: x[0],
            reverse=True
        )

        new_population = []

        # Elitism: carry over top N chromosomes unchanged
        for i in range(elitism_count):
            new_population.append(copy.deepcopy(sorted_pop[i][1]))

        # Fill rest with crossover + mutation offspring
        while len(new_population) < population_size:
            parent1 = tournament_selection(population, fitness_scores)
            parent2 = tournament_selection(population, fitness_scores)
            child1, child2 = crossover(parent1, parent2, crossover_rate)
            child1 = mutate(child1, rooms, timeslots, mutation_rate)
            child2 = mutate(child2, rooms, timeslots, mutation_rate)
            new_population.append(child1)
            if len(new_population) < population_size:
                new_population.append(child2)

        population = new_population

    elapsed = round(time.time() - start, 4)
    conflicts = count_conflicts(best_chromosome)

    return {
        "success": True,
        "schedule": best_chromosome,
        "stats": {
            "generations_run": len(best_fitness_history),
            "population_size": population_size,
            "final_best_fitness": round(best_fitness, 4),
        },
        "execution_time": elapsed,
        "conflicts": conflicts,
        "fitness": round(best_fitness, 4),
        "fitness_history": best_fitness_history,
        "avg_fitness_history": avg_fitness_history,
        "message": f"GA completed in {len(best_fitness_history)} generations. Conflicts: {conflicts}"
    }
