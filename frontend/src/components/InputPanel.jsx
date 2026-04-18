import React, { useState } from 'react';

const DEFAULTS = {
  courses:   ['Mathematics','Physics','Chemistry','English','Computer Science','Biology','History','Geography'],
  teachers:  ['Dr. Ahmed','Prof. Sara','Dr. Khalid','Ms. Fatima','Mr. Bilal','Dr. Ayesha','Mr. Hassan','Ms. Zara'],
  rooms:     ['Room-A101','Room-B202','Room-C303','Lab-101'],
  timeslots: ['Mon-8AM','Mon-9AM','Mon-10AM','Mon-11AM','Tue-8AM','Tue-9AM','Tue-10AM','Tue-11AM','Wed-8AM','Wed-9AM'],
};

const CHIP_COLORS = {
  blue:   'chip-blue',
  navy:   'chip-navy',
  sky:    'chip-sky',
  green:  'chip-green',
  orange: 'chip-orange',
};

function TagEditor({ label, items, onAdd, onRemove, placeholder, color = 'blue', icon }) {
  const [val, setVal] = useState('');
  return (
    <div>
      <label className="label">{icon} {label}
        <span style={{ marginLeft:6, background:'var(--bg2)', borderRadius:99, padding:'1px 8px', fontWeight:600, fontSize:11, color:'var(--blue)', fontFamily:'IBM Plex Mono,monospace' }}>
          {items.length}
        </span>
      </label>
      <div style={{ display:'flex', gap:8, marginBottom:10 }}>
        <input className="input" value={val}
          onChange={e=>setVal(e.target.value)}
          onKeyDown={e=>{ if(e.key==='Enter'&&val.trim()){ onAdd(val.trim()); setVal(''); }}}
          placeholder={placeholder} style={{ flex:1 }} />
        <button className="btn btn-primary btn-sm"
          onClick={()=>{ if(val.trim()){ onAdd(val.trim()); setVal(''); }}}>
          + Add
        </button>
      </div>
      <div style={{ display:'flex', flexWrap:'wrap', gap:6, minHeight:32 }}>
        {items.length === 0 && (
          <span style={{ fontSize:12, color:'var(--muted2)', fontStyle:'italic' }}>No items yet…</span>
        )}
        {items.map((item, i) => (
          <span key={i} className={`chip ${CHIP_COLORS[color]}`}
            title="Click to remove"
            onClick={() => onRemove(i)}
            style={{ cursor:'pointer' }}>
            {item}
            <span style={{ opacity:0.5, marginLeft:2, fontWeight:700 }}>×</span>
          </span>
        ))}
      </div>
    </div>
  );
}

const ALGOS = [
  { id:'genetic',             icon:'🧬', label:'Genetic Algorithm',    desc:'Evolutionary — best for large schedules',   badge:'Recommended' },
  { id:'hill_climbing',       icon:'⛰️',  label:'Hill Climbing',         desc:'Fast greedy search with random restarts',   badge:'Fast'        },
  { id:'simulated_annealing', icon:'🌡️', label:'Simulated Annealing',   desc:'Probabilistic — escapes local optima',      badge:'Robust'      },
];

export default function InputPanel({ onSubmit, loading }) {
  const [courses,   setCourses]   = useState(DEFAULTS.courses);
  const [teachers,  setTeachers]  = useState(DEFAULTS.teachers);
  const [rooms,     setRooms]     = useState(DEFAULTS.rooms);
  const [timeslots, setTs]        = useState(DEFAULTS.timeslots);
  const [algo,      setAlgo]      = useState('genetic');
  const [fwd,       setFwd]       = useState(true);
  const [popSize,   setPop]       = useState(50);
  const [gens,      setGens]      = useState(150);
  const [mutRate,   setMut]       = useState(0.1);
  const [showAdv,   setShowAdv]   = useState(false);

  const mismatch = courses.length !== teachers.length;
  const canSubmit = !mismatch && courses.length > 0 && rooms.length > 0 && timeslots.length > 0;

  const capacity = rooms.length * timeslots.length;
  const capacityOk = capacity >= courses.length;

  const submit = () => {
    if (!canSubmit) return;
    onSubmit({ courses, teachers, rooms, timeslots,
      optimization_algorithm: algo, csp_forward_checking: fwd,
      ga_population_size: popSize, ga_generations: gens, ga_mutation_rate: mutRate });
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:24, maxWidth:900 }}>

      {/* Hero banner */}
      <div className="card fade-up" style={{
        background:'linear-gradient(135deg,var(--navy) 0%,var(--navy2) 60%,#1d5c8a 100%)',
        border:'none', padding:'28px 32px', position:'relative', overflow:'hidden',
      }}>
        <div style={{ position:'absolute', right:-20, top:-20, width:200, height:200, borderRadius:'50%', background:'rgba(56,174,212,0.08)' }} />
        <div style={{ position:'absolute', right:60, bottom:-40, width:130, height:130, borderRadius:'50%', background:'rgba(56,174,212,0.06)' }} />
        <div style={{ position:'relative' }}>
          <h1 style={{ color:'#fff', fontSize:24, fontWeight:800, marginBottom:6 }}>
            AI-Based Scheduling System
          </h1>
          <p style={{ color:'#7eaecf', fontSize:14, maxWidth:520 }}>
            Generate conflict-free timetables automatically using <strong style={{color:'#7dd4f0'}}>CSP Backtracking</strong> to find valid schedules, then <strong style={{color:'#7dd4f0'}}>Genetic Algorithm</strong> or local search to optimize them.
          </p>
          <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginTop:16 }}>
            {['🔍 CSP Backtracking','⚡ Forward Checking','🧬 Genetic Algorithm','⛰️ Hill Climbing','🌡️ Simulated Annealing'].map(t=>(
              <span key={t} style={{ background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:99, padding:'3px 12px', fontSize:12, color:'#a8cfe8', fontFamily:'Sora,sans-serif', fontWeight:500 }}>{t}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Capacity status bar */}
      <div className="card fade-up delay-1" style={{ padding:'14px 20px' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
          <div style={{ display:'flex', alignItems:'center', gap:20 }}>
            {[
              { label:'Courses',   val:courses.length,   icon:'📚' },
              { label:'Teachers',  val:teachers.length,  icon:'👩‍🏫' },
              { label:'Rooms',     val:rooms.length,     icon:'🏫' },
              { label:'Timeslots', val:timeslots.length, icon:'🕐' },
              { label:'Capacity',  val:capacity,         icon:'📦' },
            ].map(s=>(
              <div key={s.label} style={{ textAlign:'center' }}>
                <div style={{ fontSize:18, fontFamily:'Sora,sans-serif', fontWeight:700, color:'var(--navy)' }}>{s.val}</div>
                <div style={{ fontSize:11, color:'var(--muted)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em' }}>{s.icon} {s.label}</div>
              </div>
            ))}
          </div>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            {mismatch && <span className="badge badge-danger">⚠ Courses ≠ Teachers</span>}
            {!capacityOk && !mismatch && <span className="badge badge-warning">⚠ Low capacity</span>}
            {canSubmit && capacityOk && <span className="badge badge-success">✓ Ready to schedule</span>}
          </div>
        </div>
      </div>

      {/* Courses & Teachers */}
      <div className="card fade-up delay-2" style={{ padding:'24px 28px' }}>
        <div className="section-title" style={{ marginBottom:4 }}>
          📚 Courses &amp; Teachers
        </div>
        <p className="section-sub" style={{ marginBottom:20 }}>
          Each course must have exactly one teacher. The order must match — Course[0] is taught by Teacher[0].
          <span style={{ color:'var(--muted2)' }}> Click any chip to remove it.</span>
        </p>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24 }}>
          <TagEditor label="Courses" items={courses} onAdd={v=>setCourses(p=>[...p,v])}
            onRemove={i=>{ setCourses(p=>p.filter((_,j)=>j!==i)); setTeachers(p=>p.filter((_,j)=>j!==i)); }}
            placeholder="e.g. Mathematics" color="blue" icon="📚" />
          <TagEditor label="Teachers (same order)" items={teachers} onAdd={v=>setTeachers(p=>[...p,v])}
            onRemove={i=>setTeachers(p=>p.filter((_,j)=>j!==i))}
            placeholder="e.g. Dr. Smith" color="navy" icon="👩‍🏫" />
        </div>
        {mismatch && (
          <div className="alert alert-error" style={{ marginTop:16 }}>
            <span>❌</span>
            <span>You have <strong>{courses.length}</strong> courses and <strong>{teachers.length}</strong> teachers. They must be equal — one teacher per course.</span>
          </div>
        )}
      </div>

      {/* Rooms & Timeslots */}
      <div className="card fade-up delay-3" style={{ padding:'24px 28px' }}>
        <div className="section-title" style={{ marginBottom:4 }}>🏫 Rooms &amp; Timeslots</div>
        <p className="section-sub" style={{ marginBottom:20 }}>
          You need at least <strong>{courses.length}</strong> room-timeslot combinations for {courses.length} courses.
          Currently: <strong style={{ color: capacityOk?'var(--success)':'var(--danger)' }}>{capacity}</strong> combinations.
        </p>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24 }}>
          <TagEditor label="Rooms" items={rooms} onAdd={v=>setRooms(p=>[...p,v])}
            onRemove={i=>setRooms(p=>p.filter((_,j)=>j!==i))}
            placeholder="e.g. Room-101" color="sky" icon="🏫" />
          <TagEditor label="Timeslots" items={timeslots} onAdd={v=>setTs(p=>[...p,v])}
            onRemove={i=>setTs(p=>p.filter((_,j)=>j!==i))}
            placeholder="e.g. Mon-8AM" color="green" icon="🕐" />
        </div>
      </div>

      {/* Algorithm picker */}
      <div className="card fade-up delay-4" style={{ padding:'24px 28px' }}>
        <div className="section-title" style={{ marginBottom:4 }}>🤖 Optimization Algorithm</div>
        <p className="section-sub" style={{ marginBottom:20 }}>Runs after CSP to further improve the schedule quality.</p>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:16 }}>
          {ALGOS.map(a=>(
            <button key={a.id} onClick={()=>setAlgo(a.id)}
              style={{
                padding:'16px', borderRadius:12, border:`2px solid ${algo===a.id?'var(--blue)':'var(--border)'}`,
                background: algo===a.id ? 'linear-gradient(135deg,#e8f3fb,#f0f8ff)' : 'var(--surface2)',
                cursor:'pointer', textAlign:'left', transition:'all 0.15s',
                boxShadow: algo===a.id ? '0 0 0 3px rgba(29,111,164,0.1)' : 'none',
              }}>
              <div style={{ fontSize:22, marginBottom:6 }}>{a.icon}</div>
              <div style={{ fontFamily:'Sora,sans-serif', fontWeight:700, fontSize:13, color:'var(--navy)', marginBottom:3 }}>{a.label}</div>
              <div style={{ fontSize:12, color:'var(--muted)', lineHeight:1.4 }}>{a.desc}</div>
              <div style={{ marginTop:8 }}>
                <span className={`badge ${algo===a.id?'badge-info':'badge-neutral'}`}>{a.badge}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Advanced toggle */}
        <button className="btn btn-ghost btn-sm" onClick={()=>setShowAdv(p=>!p)}
          style={{ color:'var(--muted)', marginBottom: showAdv?12:0 }}>
          {showAdv?'▾':'▸'} Advanced Settings
        </button>

        {showAdv && (
          <div className="fade-up" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, padding:'16px', background:'var(--bg2)', borderRadius:12, border:'1px solid var(--border)' }}>
            <div>
              <label className="label">CSP Forward Checking</label>
              <button onClick={()=>setFwd(p=>!p)}
                className={`btn btn-sm ${fwd?'btn-primary':'btn-secondary'}`} style={{ width:'100%' }}>
                {fwd ? '✓ Enabled' : '✗ Disabled'}
              </button>
            </div>
            <div>
              <label className="label">Population Size</label>
              <input className="input" type="number" value={popSize} min={10} max={500}
                onChange={e=>setPop(Number(e.target.value))} />
            </div>
            <div>
              <label className="label">Generations</label>
              <input className="input" type="number" value={gens} min={10} max={1000}
                onChange={e=>setGens(Number(e.target.value))} />
            </div>
            <div>
              <label className="label">Mutation Rate</label>
              <input className="input" type="number" value={mutRate} min={0} max={1} step={0.01}
                onChange={e=>setMut(Number(e.target.value))} />
            </div>
          </div>
        )}
      </div>

      {/* Submit */}
      <div className="fade-up delay-4" style={{ display:'flex', gap:12, alignItems:'center' }}>
        <button className="btn btn-primary btn-lg" onClick={submit}
          disabled={loading || !canSubmit || !capacityOk}
          style={{ minWidth:220 }}>
          {loading ? <><div className="spinner" /> Running Algorithms…</> : '🚀 Generate Schedule'}
        </button>
        {!canSubmit && !loading && (
          <span style={{ fontSize:13, color:'var(--muted)' }}>
            {mismatch ? 'Fix course/teacher mismatch first.' : 'Add required data first.'}
          </span>
        )}
      </div>
    </div>
  );
}
