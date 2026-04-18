import React, { useMemo, useState } from 'react';

function teacherHue(name) {
  let h = 0;
  for (let c of name) h = c.charCodeAt(0) + ((h << 5) - h);
  return Math.abs(h) % 360;
}
function teacherBg(name)     { return `hsl(${teacherHue(name)},60%,94%)`; }
function teacherBorder(name) { return `hsl(${teacherHue(name)},55%,60%)`; }
function teacherText(name)   { return `hsl(${teacherHue(name)},55%,28%)`; }

function conflictSet(schedule) {
  const ids = new Set();
  for (let i = 0; i < schedule.length; i++)
    for (let j = i+1; j < schedule.length; j++) {
      const a = schedule[i], b = schedule[j];
      if (a.timeslot===b.timeslot && (a.teacher===b.teacher || a.room===b.room)) {
        ids.add(i); ids.add(j);
      }
    }
  return ids;
}

function GridView({ schedule }) {
  const conflicts  = useMemo(()=>conflictSet(schedule),[schedule]);
  const timeslots  = useMemo(()=>[...new Set(schedule.map(s=>s.timeslot))].sort(),[schedule]);
  const rooms      = useMemo(()=>[...new Set(schedule.map(s=>s.room))].sort(),[schedule]);

  const grid = useMemo(()=>{
    const g = {};
    timeslots.forEach(ts=>{ g[ts]={}; rooms.forEach(r=>{ g[ts][r]=[]; }); });
    schedule.forEach((e,i)=>{ if(g[e.timeslot]?.[e.room]!==undefined) g[e.timeslot][e.room].push({...e,_i:i}); });
    return g;
  },[schedule,timeslots,rooms]);

  return (
    <div style={{ overflowX:'auto', borderRadius:12, border:'1px solid var(--border)' }}>
      <table className="data-table" style={{ minWidth: 600 }}>
        <thead>
          <tr>
            <th style={{ minWidth:110 }}>Timeslot</th>
            {rooms.map(r=><th key={r}>{r}</th>)}
          </tr>
        </thead>
        <tbody>
          {timeslots.map((ts,ti)=>(
            <tr key={ts} style={{ background: ti%2===0?'var(--surface)':'var(--surface2)' }}>
              <td>
                <span style={{ fontFamily:'IBM Plex Mono,monospace', fontSize:12, fontWeight:500, color:'var(--muted)', background:'var(--bg2)', padding:'2px 8px', borderRadius:6 }}>
                  {ts}
                </span>
              </td>
              {rooms.map(r=>{
                const cells = grid[ts]?.[r] || [];
                return (
                  <td key={r} style={{ verticalAlign:'top', padding:'8px' }}>
                    {cells.length===0
                      ? <span style={{ color:'var(--border)', fontSize:13 }}>—</span>
                      : cells.map((e,ei)=>{
                          const isC = conflicts.has(e._i);
                          return (
                            <div key={ei} className="cell-entry" style={{
                              marginBottom: ei<cells.length-1?4:0,
                              background: isC?'#fef2f2':teacherBg(e.teacher),
                              borderLeftColor: isC?'var(--danger)':teacherBorder(e.teacher),
                            }}>
                              <div style={{ fontWeight:700, fontSize:12.5, color: isC?'var(--danger)':teacherText(e.teacher) }}>{e.course}</div>
                              <div style={{ fontSize:11.5, color:'var(--muted)', marginTop:1 }}>{e.teacher}</div>
                              {isC && <div style={{ fontSize:11, color:'var(--danger)', fontWeight:700, marginTop:2 }}>⚠ Conflict</div>}
                            </div>
                          );
                        })}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ListView({ schedule }) {
  const conflicts = useMemo(()=>conflictSet(schedule),[schedule]);
  return (
    <table className="data-table">
      <thead><tr>
        <th>#</th><th>Course</th><th>Teacher</th><th>Room</th><th>Timeslot</th><th>Status</th>
      </tr></thead>
      <tbody>
        {schedule.map((e,i)=>{
          const isC = conflicts.has(i);
          return (
            <tr key={i} className={isC?'conflict':''}>
              <td><span style={{ fontFamily:'IBM Plex Mono,monospace', color:'var(--muted2)', fontSize:12 }}>{String(i+1).padStart(2,'0')}</span></td>
              <td><strong style={{ color:'var(--navy)' }}>{e.course}</strong></td>
              <td style={{ color:'var(--text2)' }}>{e.teacher}</td>
              <td><span className="chip chip-sky">{e.room}</span></td>
              <td><span className="chip chip-green">{e.timeslot}</span></td>
              <td>{isC
                ? <span className="badge badge-danger">⚠ Conflict</span>
                : <span className="badge badge-success">✓ OK</span>}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export default function ScheduleTable({ result }) {
  const [activeTab, setActiveTab] = useState('final');
  const [viewMode,  setViewMode]  = useState('grid');

  const scheduleMap = {
    final: result.final_schedule,
    csp:   result.csp.schedule,
  };
  const schedule = scheduleMap[activeTab] || [];
  const conflicts = useMemo(()=>conflictSet(schedule).size/2,[schedule]);

  const tabs = [
    { id:'final', label:'Optimized Schedule', badge:'badge-info',    badgeText: result.optimization.algorithm.replace(/_/g,' ') },
    { id:'csp',   label:'CSP Baseline',       badge:'badge-success', badgeText: 'CSP Backtracking' },
  ];

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20, maxWidth:1100 }}>

      {/* Summary row */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16 }} className="fade-up">
        {[
          { icon:'📋', label:'Total Classes', val:schedule.length, color:'var(--navy)' },
          { icon:'🏆', label:'Fitness Score',  val:(result.optimization.fitness||0).toFixed(3), color: result.optimization.fitness===1?'var(--success)':'var(--warning)' },
          { icon:'⚠️', label:'Conflicts',      val:conflicts, color: conflicts===0?'var(--success)':'var(--danger)' },
          { icon:'⏱️', label:'Total Time',     val:`${((result.csp.execution_time||0)+(result.optimization.execution_time||0)).toFixed(3)}s`, color:'var(--blue)' },
        ].map((s,i)=>(
          <div key={s.label} className={`card fade-up delay-${i+1}`} style={{ padding:'18px 20px' }}>
            <div style={{ fontSize:22, marginBottom:6 }}>{s.icon}</div>
            <div className="stat-value" style={{ color:s.color, fontSize:22 }}>{s.val}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Schedule card */}
      <div className="card fade-up delay-2" style={{ padding:'20px 24px' }}>
        {/* Header row */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16, flexWrap:'wrap', gap:12 }}>
          {/* Sub-tabs: Optimized vs CSP */}
          <div style={{ display:'flex', gap:4, background:'var(--bg2)', borderRadius:10, padding:4 }}>
            {tabs.map(t=>(
              <button key={t.id} onClick={()=>setActiveTab(t.id)}
                style={{
                  padding:'6px 14px', borderRadius:8, border:'none', cursor:'pointer',
                  background: activeTab===t.id?'var(--surface)':'transparent',
                  fontFamily:'Sora,sans-serif', fontWeight:600, fontSize:13,
                  color: activeTab===t.id?'var(--navy)':'var(--muted)',
                  boxShadow: activeTab===t.id?'var(--shadow)':'none',
                  transition:'all 0.15s',
                }}>
                {t.label}
              </button>
            ))}
          </div>

          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <span className={`badge ${tabs.find(t=>t.id===activeTab)?.badge}`}>
              {tabs.find(t=>t.id===activeTab)?.badgeText}
            </span>
            {conflicts===0
              ? <span className="badge badge-success">✓ No Conflicts</span>
              : <span className="badge badge-danger">⚠ {conflicts} Conflict{conflicts!==1?'s':''}</span>}
            {/* View toggle */}
            <div style={{ display:'flex', gap:2, background:'var(--bg2)', borderRadius:8, padding:3 }}>
              {[{id:'grid',icon:'⊞'},{id:'list',icon:'☰'}].map(v=>(
                <button key={v.id} onClick={()=>setViewMode(v.id)}
                  style={{ padding:'4px 10px', borderRadius:6, border:'none', cursor:'pointer', fontSize:14,
                    background: viewMode===v.id?'var(--surface)':'transparent',
                    color: viewMode===v.id?'var(--navy)':'var(--muted)',
                    boxShadow: viewMode===v.id?'var(--shadow)':'none', transition:'all 0.15s' }}>
                  {v.icon}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table */}
        {viewMode==='grid' ? <GridView schedule={schedule} /> : <ListView schedule={schedule} />}
      </div>
    </div>
  );
}
