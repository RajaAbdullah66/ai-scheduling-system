import React, { useState } from 'react';

const ALGOS = [
  {
    id:'csp', icon:'🔍', color:'#1d6fa4', bg:'#e8f3fb',
    title:'CSP — Constraint Satisfaction',
    subtitle:'Backtracking + Forward Checking + MRV Heuristic',
    summary:'CSP finds a valid schedule by systematically assigning timeslots and rooms to courses, backtracking whenever a conflict is detected.',
    steps:[
      { n:1, title:'Define Variables',   body:'Each (course, teacher) pair is a variable that needs a value.' },
      { n:2, title:'Define Domain',      body:'Domain = all (timeslot, room) combinations available.' },
      { n:3, title:'Apply Constraints',  body:'No two variables share the same teacher or room in the same timeslot.' },
      { n:4, title:'MRV Heuristic',      body:'Pick the variable with the fewest remaining legal values next.' },
      { n:5, title:'Backtracking',       body:'Assign values one by one. On conflict → undo and try next value.' },
      { n:6, title:'Forward Checking',   body:'After each assignment, remove invalid values from future variables\' domains early.' },
    ],
    complexity:'O(d^n) worst case',
    formula:'is_consistent(assignment, var, value)',
    viva:'CSP is complete — it always finds a solution if one exists. Forward Checking prunes dead ends early, reducing backtracks significantly. MRV (Minimum Remaining Values) picks the hardest variable first.',
    code:`def backtrack(variables, domains, assignment):
    if len(assignment) == len(variables):
        return assignment          # complete!
    var = select_unassigned(variables, assignment, domains)
    for value in domains[var]:
        if is_consistent(assignment, var, value):
            assignment[var] = value
            result = backtrack(variables, domains, assignment)
            if result: return result
            del assignment[var]    # backtrack
    return None`,
  },
  {
    id:'ga', icon:'🧬', color:'#14a870', bg:'#e6f7f1',
    title:'Genetic Algorithm',
    subtitle:'Population-based Evolutionary Optimization',
    summary:'GA mimics biological evolution. A population of schedules evolves over generations via selection, crossover, and mutation until an optimal schedule emerges.',
    steps:[
      { n:1, title:'Initialize Population', body:'Create 50 random complete schedules (chromosomes). They may have conflicts.' },
      { n:2, title:'Evaluate Fitness',      body:'Fitness = 1 / (1 + conflicts). Perfect = 1.0, conflicts = 0.' },
      { n:3, title:'Tournament Selection',  body:'Pick 3 random individuals; the fittest becomes a parent. Simulates natural selection.' },
      { n:4, title:'Single-Point Crossover',body:'Split both parents at a random index and swap tails to make two children.' },
      { n:5, title:'Mutation',              body:'With 10% probability, randomly change a timeslot or room (maintains diversity).' },
      { n:6, title:'Elitism',               body:'Always copy the top 2 schedules unchanged to the next generation.' },
    ],
    complexity:'O(G × P × N)',
    formula:'fitness = 1 / (1 + conflicts)',
    viva:'GA explores many solutions in parallel (population-based). Crossover combines good partial solutions. Mutation prevents stagnation. Elitism guarantees we never lose the best solution found.',
    code:`for generation in range(GENERATIONS):
    scores = [fitness(c) for c in population]
    if max(scores) == 1.0: break   # perfect!
    next_gen = top_2_by_fitness()  # elitism
    while len(next_gen) < POP_SIZE:
        p1 = tournament_select(population, scores)
        p2 = tournament_select(population, scores)
        c1, c2 = crossover(p1, p2)
        next_gen += [mutate(c1), mutate(c2)]
    population = next_gen`,
  },
  {
    id:'hc', icon:'⛰️', color:'#d97706', bg:'#fef3e2',
    title:'Hill Climbing',
    subtitle:'Greedy Local Search with Random Restarts',
    summary:'Hill Climbing keeps improving a schedule one small change at a time. If it gets stuck at a local optimum, it restarts from a random point.',
    steps:[
      { n:1, title:'Initialize',         body:'Start with the CSP schedule or a random schedule.' },
      { n:2, title:'Generate Neighbor',  body:'Change ONE attribute of ONE class (different timeslot or room).' },
      { n:3, title:'Compare Fitness',    body:'If neighbor fitness ≥ current → move there. Otherwise keep current.' },
      { n:4, title:'Repeat',             body:'Continue until no improvement for many steps (local optimum).' },
      { n:5, title:'Random Restart',     body:'If stuck, start over from a new random point.' },
      { n:6, title:'Return Best',        body:'Track the global best across all restarts.' },
    ],
    complexity:'O(R × I × N)',
    formula:'if fitness(neighbor) >= fitness(current): current = neighbor',
    viva:'Hill Climbing is fast but gets stuck in local optima — it never accepts worse moves. Random restarts help escape. Steepest-ascent variant always picks the best neighbor.',
    code:`current = initial_schedule
for restart in range(RESTARTS):
    for _ in range(MAX_ITER):
        neighbor = change_one_gene(current)
        if fitness(neighbor) >= fitness(current):
            current = neighbor
        if fitness(current) == 1.0: break`,
  },
  {
    id:'sa', icon:'🌡️', color:'#e85d26', bg:'#fdf0ea',
    title:'Simulated Annealing',
    subtitle:'Probabilistic Local Search — escapes local optima',
    summary:'SA sometimes accepts worse moves, controlled by a "temperature" that decreases over time. This lets it escape local optima that Hill Climbing gets trapped in.',
    steps:[
      { n:1, title:'Initialize',      body:'Set temperature T = 100 (high). High T = more exploration.' },
      { n:2, title:'Neighbor',        body:'Make one small random change (same as Hill Climbing).' },
      { n:3, title:'Always Accept +', body:'If new fitness > current → always accept.' },
      { n:4, title:'Sometimes Accept −', body:'Accept worse solution with P = exp(Δfitness / T). Higher T = more likely.' },
      { n:5, title:'Cool Down',       body:'T = T × 0.995 after each step. As T→0, SA becomes greedy like Hill Climbing.' },
      { n:6, title:'Terminate',       body:'Stop when T < 0.01 or max iterations reached. Return best ever seen.' },
    ],
    complexity:'O(I × N)',
    formula:'P(accept) = exp( Δfitness / T )',
    viva:'SA is inspired by metallurgy — cooling metal slowly produces a better crystal structure. The Boltzmann acceptance function P=e^(ΔE/T) is key. At high T it explores; at low T it exploits.',
    code:`T = INITIAL_TEMP
while T > MIN_TEMP:
    neighbor = change_one_gene(current)
    delta = fitness(neighbor) - fitness(current)
    if delta > 0:
        current = neighbor          # always accept better
    elif random() < exp(delta / T):
        current = neighbor          # accept worse (escape!)
    T *= COOLING_RATE               # cool down`,
  },
];

export default function AlgoExplainer() {
  const [active, setActive] = useState('csp');
  const algo = ALGOS.find(a=>a.id===active);

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20, maxWidth:1000 }}>
      {/* Tab bar */}
      <div className="card fade-up" style={{ padding:'6px', display:'flex', gap:4 }}>
        {ALGOS.map(a=>(
          <button key={a.id} onClick={()=>setActive(a.id)}
            style={{
              flex:1, padding:'10px 8px', borderRadius:10, border:`2px solid ${active===a.id?a.color:'transparent'}`,
              background: active===a.id?a.bg:'transparent',
              cursor:'pointer', transition:'all 0.15s', textAlign:'center',
            }}>
            <div style={{ fontSize:20 }}>{a.icon}</div>
            <div style={{ fontFamily:'Sora,sans-serif', fontWeight:700, fontSize:12, color:active===a.id?a.color:'var(--muted)', marginTop:3 }}>
              {a.id==='csp'?'CSP':a.id==='ga'?'Genetic':a.id==='hc'?'Hill Climb':'Sim. Anneal.'}
            </div>
          </button>
        ))}
      </div>

      {algo && (
        <div key={algo.id} className="fade-up">
          {/* Header */}
          <div className="card" style={{ padding:'24px 28px', borderLeft:`4px solid ${algo.color}`, marginBottom:16 }}>
            <div style={{ display:'flex', alignItems:'flex-start', gap:16 }}>
              <div style={{ fontSize:40 }}>{algo.icon}</div>
              <div style={{ flex:1 }}>
                <h2 style={{ fontSize:20, color:algo.color, marginBottom:2 }}>{algo.title}</h2>
                <div style={{ fontSize:13, color:'var(--muted)', marginBottom:10, fontFamily:'Sora,sans-serif' }}>{algo.subtitle}</div>
                <p style={{ fontSize:14, color:'var(--text2)', lineHeight:1.6 }}>{algo.summary}</p>
                <div style={{ marginTop:12, display:'flex', gap:10, flexWrap:'wrap' }}>
                  <span className="chip chip-navy">⏱ {algo.complexity}</span>
                  <code style={{ background:algo.bg, color:algo.color, padding:'3px 10px', borderRadius:6, fontSize:12.5, fontFamily:'IBM Plex Mono,monospace', border:`1px solid ${algo.color}33` }}>{algo.formula}</code>
                </div>
              </div>
            </div>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
            {/* Steps */}
            <div className="card" style={{ padding:'22px 24px' }}>
              <div className="section-title" style={{ marginBottom:16, fontSize:15 }}>🔢 Step-by-Step</div>
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {algo.steps.map(s=>(
                  <div key={s.n} style={{ display:'flex', gap:12, alignItems:'flex-start' }}>
                    <div style={{
                      width:28, height:28, borderRadius:8, flexShrink:0,
                      background:algo.bg, color:algo.color,
                      display:'flex', alignItems:'center', justifyContent:'center',
                      fontFamily:'Sora,sans-serif', fontWeight:700, fontSize:13,
                      border:`1px solid ${algo.color}44`,
                    }}>{s.n}</div>
                    <div>
                      <div style={{ fontWeight:700, fontSize:13.5, color:'var(--navy)', marginBottom:2 }}>{s.title}</div>
                      <div style={{ fontSize:13, color:'var(--text2)', lineHeight:1.5 }}>{s.body}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Code + Viva */}
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              {/* Code snippet */}
              <div className="card" style={{ padding:'18px 20px' }}>
                <div className="section-title" style={{ marginBottom:12, fontSize:15 }}>💻 Pseudocode</div>
                <pre style={{
                  background:'var(--navy)', color:'#a8d8f0',
                  borderRadius:10, padding:'16px', fontSize:12,
                  fontFamily:'IBM Plex Mono,monospace', lineHeight:1.7,
                  overflowX:'auto', margin:0,
                }}><code>{algo.code}</code></pre>
              </div>
              {/* Viva tip */}
              <div style={{ padding:'18px 20px', borderRadius:14, background:algo.bg, border:`1px solid ${algo.color}44` }}>
                <div style={{ fontFamily:'Sora,sans-serif', fontWeight:700, fontSize:13, color:algo.color, marginBottom:8 }}>🎓 Key Viva Point</div>
                <p style={{ fontSize:13.5, color:'var(--text2)', lineHeight:1.6 }}>{algo.viva}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick reference table */}
      <div className="card fade-up" style={{ padding:'22px 24px' }}>
        <div className="section-title" style={{ marginBottom:16 }}>📋 Quick Reference Table</div>
        <table className="data-table">
          <thead><tr>
            <th>Algorithm</th><th>Type</th><th>Complete?</th><th>Complexity</th><th>Best For</th>
          </tr></thead>
          <tbody>
            {[
              ['🔍 CSP Backtracking', 'Systematic Search','Yes — always finds solution if exists','O(d^n)','Small-medium, guaranteed solution'],
              ['🧬 Genetic Algorithm','Evolutionary', 'No — probabilistic','O(G×P×N)','Large schedules, multi-objective'],
              ['⛰️ Hill Climbing',    'Local Search',  'No — local optima','O(R×I×N)','Quick improvement, restarts help'],
              ['🌡️ Simulated Annealing','Probabilistic','No — probabilistic','O(I×N)','Escaping local optima'],
            ].map(([alg,type,comp,cx,best],i)=>(
              <tr key={i}>
                <td><strong style={{fontFamily:'Sora,sans-serif'}}>{alg}</strong></td>
                <td><span className="chip chip-navy">{type}</span></td>
                <td style={{color: comp.startsWith('Yes')?'var(--success)':'var(--muted)'}}>{comp}</td>
                <td><code style={{fontFamily:'IBM Plex Mono,monospace',fontSize:12,color:'var(--blue)'}}>{cx}</code></td>
                <td style={{fontSize:13,color:'var(--text2)'}}>{best}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
