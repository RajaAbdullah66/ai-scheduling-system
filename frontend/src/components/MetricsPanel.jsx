import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar } from 'recharts';

function CompareRow({ label, cspVal, optVal, unit='', higherBetter=true, fmt=v=>typeof v==='number'?v.toFixed(4):v }) {
  const max = Math.max(Number(cspVal)||0, Number(optVal)||0, 0.001);
  const cspPct = ((Number(cspVal)||0)/max)*100;
  const optPct = ((Number(optVal)||0)/max)*100;
  const cspWins = higherBetter ? Number(cspVal)>=Number(optVal) : Number(cspVal)<=Number(optVal);
  return (
    <div style={{ marginBottom:18 }}>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:7, fontSize:13 }}>
        <span style={{ fontWeight:600, color:'var(--text2)' }}>{label}</span>
        <div style={{ display:'flex', gap:20 }}>
          <span>
            <span style={{ fontSize:11, color:'var(--muted)', marginRight:5 }}>CSP</span>
            <strong style={{ color: cspWins?'var(--success)':'var(--danger)' }}>{fmt(cspVal)}{unit}</strong>
          </span>
          <span>
            <span style={{ fontSize:11, color:'var(--muted)', marginRight:5 }}>OPT</span>
            <strong style={{ color: !cspWins?'var(--success)':'var(--danger)' }}>{fmt(optVal)}{unit}</strong>
          </span>
        </div>
      </div>
      <div style={{ display:'flex', gap:4, height:10 }}>
        <div style={{ flex:1, background:'var(--bg2)', borderRadius:99, overflow:'hidden' }}>
          <div style={{ height:'100%', width:`${cspPct}%`, background: cspWins?'var(--success)':'var(--danger)', borderRadius:99, transition:'width 0.6s ease' }} />
        </div>
        <div style={{ flex:1, background:'var(--bg2)', borderRadius:99, overflow:'hidden' }}>
          <div style={{ height:'100%', width:`${optPct}%`, background: !cspWins?'var(--success)':'var(--danger)', borderRadius:99, transition:'width 0.6s ease' }} />
        </div>
      </div>
      <div style={{ display:'flex', gap:4, marginTop:3 }}>
        <div style={{ flex:1, fontSize:10, color:'var(--muted)' }}>CSP Backtracking</div>
        <div style={{ flex:1, fontSize:10, color:'var(--muted)' }}>Optimizer</div>
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, padding:'10px 14px', boxShadow:'var(--shadow-lg)', fontSize:13 }}>
      <div style={{ color:'var(--muted)', marginBottom:4 }}>Step {label}</div>
      {payload.map(p=>(
        <div key={p.name} style={{ color:p.color, fontWeight:600 }}>{p.name}: {Number(p.value).toFixed(4)}</div>
      ))}
    </div>
  );
};

export default function MetricsPanel({ result }) {
  const { csp, optimization, comparison } = result;
  const algoLabel = { genetic:'Genetic Algorithm', hill_climbing:'Hill Climbing', simulated_annealing:'Simulated Annealing' }[optimization.algorithm] || optimization.algorithm;

  const sample = (arr, n=60) => {
    if (arr.length<=n) return arr.map((v,i)=>({ step:i+1, fitness:v }));
    const step = Math.floor(arr.length/n);
    return arr.filter((_,i)=>i%step===0).map((v,i)=>({ step:(i+1)*step, fitness:v }));
  };
  const chartData = sample(optimization.fitness_history||[]);

  const barData = [
    { name:'Execution Time', CSP: csp.execution_time, Optimizer: optimization.execution_time },
    { name:'Conflicts',      CSP: csp.conflicts,      Optimizer: optimization.conflicts      },
    { name:'Fitness × 10',   CSP: +(csp.fitness*10).toFixed(3), Optimizer: +(optimization.fitness*10).toFixed(3) },
  ];

  const statItems = [
    { icon:'🏆', label:'CSP Fitness',        val:(csp.fitness||0).toFixed(3),         color: csp.fitness===1?'var(--success)':'var(--warning)' },
    { icon:'⚡', label:'CSP Time',            val:`${csp.execution_time}s`,            color:'var(--blue)'   },
    { icon:'🔄', label:'CSP Backtracks',      val: csp.stats?.backtracks??0,           color:'var(--muted)'  },
    { icon:'🧬', label:`${algoLabel} Fitness`,val:(optimization.fitness||0).toFixed(3),color: optimization.fitness===1?'var(--success)': optimization.fitness>csp.fitness?'var(--blue)':'var(--warning)' },
    { icon:'⏱️', label:'Optimizer Time',      val:`${optimization.execution_time}s`,   color:'var(--navy)'   },
    { icon:'📈', label:'Iterations',          val: optimization.stats?.generations_run ?? optimization.stats?.iterations_run ?? '—', color:'var(--muted)' },
  ];

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:24, maxWidth:1050 }}>

      {/* Stat cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14 }} className="fade-up">
        {statItems.map((s,i)=>(
          <div key={s.label} className={`card fade-up delay-${i%3+1}`} style={{ padding:'18px 20px' }}>
            <div style={{ fontSize:22, marginBottom:6 }}>{s.icon}</div>
            <div className="stat-value" style={{ color:s.color, fontSize:22 }}>{s.val}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Comparison bars */}
      <div className="card fade-up delay-2" style={{ padding:'24px 28px' }}>
        <div className="section-title" style={{ marginBottom:4 }}>📊 Side-by-Side Comparison</div>
        <p className="section-sub" style={{ marginBottom:20 }}>Green = better result for that algorithm.</p>
        <CompareRow label="Fitness Score (higher = better)" cspVal={comparison.csp_fitness} optVal={comparison.opt_fitness} higherBetter={true} />
        <CompareRow label="Execution Time in seconds (lower = better)" cspVal={comparison.csp_time} optVal={comparison.opt_time} higherBetter={false} unit="s" fmt={v=>Number(v).toFixed(4)} />
        <CompareRow label="Conflicts (lower = better)" cspVal={comparison.csp_conflicts} optVal={comparison.opt_conflicts} higherBetter={false} fmt={v=>String(v)} />
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }} className="fade-up delay-3">
        {/* Bar chart */}
        <div className="card" style={{ padding:'22px 24px' }}>
          <div className="section-title" style={{ marginBottom:16, fontSize:15 }}>📊 Bar Comparison</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={barData} margin={{ top:0, right:10, left:-20, bottom:0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" tick={{ fill:'var(--muted)', fontSize:11 }} />
              <YAxis tick={{ fill:'var(--muted)', fontSize:11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize:12 }} />
              <Bar dataKey="CSP" fill="var(--blue)" radius={[4,4,0,0]} />
              <Bar dataKey="Optimizer" fill="var(--sky)" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Stats table */}
        <div className="card" style={{ padding:'22px 24px' }}>
          <div className="section-title" style={{ marginBottom:16, fontSize:15 }}>🔬 Algorithm Stats</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div style={{ background:'var(--bg2)', borderRadius:10, padding:'14px 16px' }}>
              <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.07em', color:'var(--muted)', marginBottom:10, fontFamily:'Sora,sans-serif' }}>CSP Stats</div>
              {[
                ['Nodes explored', csp.stats?.nodes??'N/A'],
                ['Backtracks', csp.stats?.backtracks??'N/A'],
                ['Fitness', (csp.fitness||0).toFixed(4)],
                ['Conflicts', csp.conflicts],
              ].map(([k,v])=>(
                <div key={k} style={{ display:'flex', justifyContent:'space-between', fontSize:12.5, padding:'4px 0', borderBottom:'1px solid var(--border)' }}>
                  <span style={{ color:'var(--muted)' }}>{k}</span>
                  <span style={{ fontFamily:'IBM Plex Mono,monospace', fontWeight:600, color:'var(--navy)' }}>{String(v)}</span>
                </div>
              ))}
            </div>
            <div style={{ background:'var(--bg2)', borderRadius:10, padding:'14px 16px' }}>
              <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.07em', color:'var(--muted)', marginBottom:10, fontFamily:'Sora,sans-serif' }}>Optimizer Stats</div>
              {Object.entries(optimization.stats||{}).slice(0,4).map(([k,v])=>(
                <div key={k} style={{ display:'flex', justifyContent:'space-between', fontSize:12.5, padding:'4px 0', borderBottom:'1px solid var(--border)' }}>
                  <span style={{ color:'var(--muted)' }}>{k.replace(/_/g,' ')}</span>
                  <span style={{ fontFamily:'IBM Plex Mono,monospace', fontWeight:600, color:'var(--navy)' }}>{String(v)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Fitness evolution */}
      {chartData.length > 2 && (
        <div className="card fade-up delay-4" style={{ padding:'24px 28px' }}>
          <div className="section-title" style={{ marginBottom:4 }}>📈 Fitness Evolution — {algoLabel}</div>
          <p className="section-sub" style={{ marginBottom:20 }}>How the best fitness score improved over iterations. A flat line = converged early.</p>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={chartData} margin={{ top:5, right:10, left:-20, bottom:10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="step" tick={{ fill:'var(--muted)', fontSize:11 }} label={{ value:'Iteration', position:'insideBottom', offset:-5, fill:'var(--muted)', fontSize:11 }} />
              <YAxis tick={{ fill:'var(--muted)', fontSize:11 }} domain={[0,1]} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize:12 }} />
              <Line type="monotone" dataKey="fitness" stroke="var(--blue)" strokeWidth={2.5} dot={false} activeDot={{ r:5, fill:'var(--sky)' }} name="Best Fitness" />
            </LineChart>
          </ResponsiveContainer>
          <div style={{ marginTop:12, padding:'10px 16px', background:'var(--bg2)', borderRadius:10, fontSize:13, color:'var(--muted)', fontStyle:'italic' }}>
            {optimization.message}
          </div>
        </div>
      )}
    </div>
  );
}
