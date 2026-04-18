# 🗓️ AI-Based Scheduling System

A complete timetable scheduling system using **Constraint Satisfaction Problem (CSP)** and **Genetic Algorithm / Hill Climbing / Simulated Annealing** optimization.

Built with **Python + FastAPI** backend and **React + Tailwind CSS** frontend.

---

## 📁 Project Structure

```
scheduler-project/
├── backend/
│   ├── main.py               # FastAPI app — all API routes
│   ├── scheduler.py          # Orchestrator: CSP → Optimization pipeline
│   ├── csp_solver.py         # CSP: Backtracking + Forward Checking + MRV
│   ├── genetic_algorithm.py  # GA: Selection, Crossover, Mutation, Elitism
│   ├── local_search.py       # Hill Climbing + Simulated Annealing
│   └── requirements.txt      # Python dependencies
│
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── InputPanel.jsx      # Course/teacher/room/slot input form
│   │   │   ├── ScheduleTable.jsx   # Grid timetable with conflict highlighting
│   │   │   ├── MetricsPanel.jsx    # Comparison charts & stats
│   │   │   └── AlgoExplainer.jsx   # Algorithm guide for viva prep
│   │   ├── App.jsx                 # Root component + routing
│   │   ├── api.js                  # Axios API calls to backend
│   │   ├── index.js                # React entry point
│   │   └── index.css               # Global styles + CSS variables
│   ├── package.json
│   ├── tailwind.config.js
│   └── postcss.config.js
│
└── README.md
```

---

## 🚀 How to Run Locally

### Step 1 — Clone / Download the project

```bash
# If using git
git clone <your-repo-url>
cd scheduler-project
```

### Step 2 — Set up the Backend

```bash
cd backend

# Create a virtual environment (recommended)
python -m venv venv

# Activate it
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the FastAPI server
uvicorn main:app --reload --port 8000
```

The backend will be running at: **http://localhost:8000**

You can test it at: **http://localhost:8000/docs** (Swagger UI — auto-generated!)

### Step 3 — Set up the Frontend

Open a **new terminal**:

```bash
cd frontend

# Install Node dependencies
npm install

# Start the React dev server
npm start
```

The frontend will open at: **http://localhost:3000**

---

## 🌐 How to Deploy

### Frontend → Vercel (Free)

1. Push your project to GitHub.
2. Go to [vercel.com](https://vercel.com) → **New Project** → Import your repo.
3. Set **Root Directory** to `frontend`.
4. Add environment variable:
   ```
   REACT_APP_API_URL = https://your-backend-url.railway.app
   ```
5. Click **Deploy**. Done!

### Backend → Railway (Free Tier)

1. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub**.
2. Select your repo, set **Root Directory** to `backend`.
3. Railway auto-detects Python. Add a start command:
   ```
   uvicorn main:app --host 0.0.0.0 --port $PORT
   ```
4. Your backend URL will be something like `https://scheduler-production.railway.app`.
5. Update the `REACT_APP_API_URL` in Vercel with this URL.

### Backend → Render (Free Tier Alternative)

1. Go to [render.com](https://render.com) → **New Web Service**.
2. Connect GitHub repo, set root to `backend`.
3. Build command: `pip install -r requirements.txt`
4. Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

---

## 🧠 Algorithm Explanations (Viva Guide)

### A. Constraint Satisfaction Problem (CSP)

**What it solves:** Assigns timeslots and rooms to courses without any conflicts.

**Variables:** Each (course, teacher) pair that needs scheduling.

**Domain:** All possible (timeslot, room) combinations.

**Constraints:**
- No two courses can have the same teacher in the same timeslot
- No two courses can be in the same room at the same time

**Backtracking Algorithm:**
```
function BACKTRACK(assignment, variables, domains):
    if assignment is complete → return assignment
    var = select_unassigned_variable(MRV heuristic)
    for each value in domain[var]:
        if is_consistent(assignment, var, value):
            assignment[var] = value
            result = BACKTRACK(assignment, variables, domains)
            if result ≠ failure → return result
            remove assignment[var]   ← BACKTRACK
    return failure
```

**Forward Checking:** After assigning a value, immediately remove incompatible values from domains of unassigned variables. If any domain becomes empty → backtrack early (saves time).

**MRV Heuristic:** Always pick the variable with the fewest legal values remaining. Fails fast → less wasted work.

---

### B. Genetic Algorithm (GA)

**Inspired by:** Darwin's theory of natural selection.

**Key Terms:**
| Term | Meaning in Scheduling |
|------|----------------------|
| Chromosome | One complete schedule |
| Gene | One class assignment (course, teacher, room, timeslot) |
| Population | Set of 50 candidate schedules |
| Fitness | 1 / (1 + conflicts) |
| Selection | Pick best parents using tournament |
| Crossover | Combine two schedules to make children |
| Mutation | Randomly change one room/timeslot |
| Elitism | Always keep the top 2 schedules |

**Algorithm Flow:**
```
Initialize population (50 random schedules)
for generation in 1..N:
    evaluate fitness of all chromosomes
    if best_fitness == 1.0 → STOP (perfect schedule)
    new_population = top 2 (elitism)
    while new_population not full:
        parent1 = tournament_select(population)
        parent2 = tournament_select(population)
        child1, child2 = crossover(parent1, parent2)
        child1 = mutate(child1)
        child2 = mutate(child2)
        add to new_population
    population = new_population
return best chromosome ever seen
```

---

### C. Hill Climbing

**Strategy:** Always move to a better neighbor. Stop when stuck.

```
current = initial_schedule
loop:
    neighbor = change ONE gene of current
    if fitness(neighbor) >= fitness(current):
        current = neighbor
    else:
        keep current (no worse moves accepted)
    if no improvement for K steps → stop
restart from random point (up to R times)
return best found
```

**Weakness:** Gets stuck at local optima (no worse moves allowed).
**Fix:** Random restarts.

---

### D. Simulated Annealing (SA)

**Strategy:** Like Hill Climbing, but sometimes accepts WORSE moves to escape local optima.

**Key Formula — Acceptance Probability:**
```
P(accept worse move) = exp( (new_fitness - current_fitness) / Temperature )
```

**Temperature Schedule:**
```
T_start = 100
T = T * 0.995  (after each step)
Stop when T < 0.01
```

- High T (early): accepts many bad moves → wide exploration
- Low T (late): rarely accepts bad moves → focused exploitation

---

## 📊 Sample Input Data

```json
{
  "courses": ["Mathematics", "Physics", "Chemistry", "English", "Computer Science", "Biology"],
  "teachers": ["Dr. Ahmed", "Prof. Sara", "Dr. Khalid", "Ms. Fatima", "Mr. Bilal", "Dr. Ayesha"],
  "rooms": ["Room-A101", "Room-B202", "Lab-101"],
  "timeslots": ["Mon-8AM", "Mon-9AM", "Mon-10AM", "Tue-8AM", "Tue-9AM", "Tue-10AM", "Wed-8AM", "Wed-9AM"],
  "optimization_algorithm": "genetic",
  "csp_forward_checking": true,
  "ga_population_size": 50,
  "ga_generations": 150,
  "ga_mutation_rate": 0.1
}
```

**Rule of thumb:** You need at least `(number of courses)` room-timeslot combinations.
- 6 courses, 3 rooms, 8 timeslots → 24 combinations ✓ (enough for 6)

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Check if server is running |
| GET | `/api/sample-data` | Get sample input data |
| POST | `/api/schedule` | Run CSP + optimization pipeline |
| POST | `/api/csp-only` | Run CSP solver only |

Visit **http://localhost:8000/docs** for interactive API documentation.

---

## 📈 Output Metrics

| Metric | Description |
|--------|-------------|
| **Fitness Score** | 1/(1+conflicts). Perfect = 1.0 |
| **Conflicts** | Count of hard constraint violations |
| **Execution Time** | Seconds taken by each algorithm |
| **Backtracks** | How many times CSP had to undo assignments |
| **Generations** | How many GA evolutionary cycles ran |

---

## ⚡ Tips for Best Results

1. **More timeslots than courses** → CSP finds solution faster
2. **Start with GA** for large schedules (8+ courses)
3. **Use Hill Climbing** for quick runs when time matters
4. **Use SA** when GA and Hill Climbing get stuck
5. **Enable Forward Checking** (default) for faster CSP

---

## 🎓 Viva Preparation Summary

| Question | Answer |
|----------|--------|
| What is CSP? | A problem where variables must be assigned values satisfying all constraints |
| What is backtracking? | Try a value; if conflict → undo and try next value |
| What is forward checking? | After assignment, prune domains of future variables early |
| What is MRV? | Minimum Remaining Values — pick the most constrained variable first |
| What is GA fitness? | 1/(1+conflicts) — measures schedule quality |
| What is crossover? | Combining two parent schedules at a split point to create children |
| What is mutation? | Randomly changing one gene to maintain diversity |
| What is elitism? | Keeping the best N individuals unchanged across generations |
| Why SA over Hill Climbing? | SA escapes local optima by sometimes accepting worse solutions |
| What is temperature in SA? | Controls exploration vs exploitation trade-off |

---

## 👨‍💻 Tech Stack

- **Backend:** Python 3.10+, FastAPI, Uvicorn, Pydantic
- **Frontend:** React 18, Tailwind CSS, Recharts, Axios
- **Algorithms:** Pure Python (no AI/ML libraries used)
- **Deployment:** Vercel (frontend) + Railway/Render (backend)
