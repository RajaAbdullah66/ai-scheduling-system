import React, { useState, useEffect } from 'react';
import InputPanel from './components/InputPanel';
import ScheduleTable from './components/ScheduleTable';
import MetricsPanel from './components/MetricsPanel';
import AlgoExplainer from './components/AlgoExplainer';
import { generateSchedule, healthCheck } from './api';

const NAV = [
  { id: 'configure', icon: '⚙️', label: 'Configure',   sub: 'Set up inputs'     },
  { id: 'schedule',  icon: '📅', label: 'Schedule',    sub: 'View timetable',   needsResult: true },
  { id: 'metrics',   icon: '📊', label: 'Metrics',     sub: 'Compare results',  needsResult: true },
  { id: 'guide',     icon: '📖', label: 'Algorithm Guide', sub: 'Explanation'     },
];

export default function App() {
  const [tab, setTab]                     = useState('configure');
  const [loading, setLoading]             = useState(false);
  const [result, setResult]               = useState(null);
  const [error, setError]                 = useState(null);
  const [backendStatus, setBackendStatus] = useState('checking');

  useEffect(() => {
    healthCheck().then(() => setBackendStatus('online')).catch(() => setBackendStatus('offline'));
  }, []);

  const handleGenerate = async (payload) => {
    setLoading(true); setError(null);
    try {
      const data = await generateSchedule(payload);
      setResult(data);
      setTab('schedule');
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to reach backend.');
    } finally {
      setLoading(false);
    }
  };

  const statusDot = { online: '#14a870', offline: '#e03e3e', checking: '#d97706' }[backendStatus];
  const statusLabel = { online: 'Backend Online', offline: 'Backend Offline', checking: 'Connecting…' }[backendStatus];

  return (
    <div style={{ display:'flex', flexDirection:'column', minHeight:'100vh' }}>

      {/* ── Sidebar + Content wrapper ── */}
      <div style={{ display:'flex', flex:1 }}>

        {/* ── Sidebar ── */}
        <aside style={{
          width: 240, flexShrink: 0, background: 'var(--navy)',
          display: 'flex', flexDirection: 'column',
          position: 'sticky', top: 0, height: '100vh', overflowY: 'auto',
        }}>
          {/* Logo */}
          <div style={{ padding: '28px 20px 20px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4 }}>
              <div style={{
                width:36, height:36, borderRadius:10, flexShrink:0,
                background:'linear-gradient(135deg,#38aed4,#1d6fa4)',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:18,
              }}>🗓</div>
              <div>
                <div style={{ fontFamily:'Sora,sans-serif', fontWeight:700, fontSize:15, color:'#e8f2ff', lineHeight:1.2 }}>AI Scheduler</div>
                <div style={{ fontSize:11, color:'#607d99', marginTop:1 }}>Timetable System</div>
              </div>
            </div>
          </div>

          <hr style={{ border:'none', borderTop:'1px solid rgba(255,255,255,0.07)', margin:'0 20px 16px' }} />

          {/* Nav */}
          <nav style={{ padding:'0 12px', flex:1 }}>
            <div style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', color:'#3d5a7a', padding:'0 8px', marginBottom:8, fontFamily:'Sora,sans-serif' }}>
              Navigation
            </div>
            {NAV.map((n, i) => {
              const disabled = n.needsResult && !result;
              return (
                <button key={n.id} className={`nav-item${tab===n.id?' active':''}`}
                  disabled={disabled}
                  onClick={() => !disabled && setTab(n.id)}
                  style={{ marginBottom:2 }}>
                  <span style={{ fontSize:15 }}>{n.icon}</span>
                  <div style={{ lineHeight:1.3 }}>
                    <div>{n.label}</div>
                    <div style={{ fontSize:11, opacity:0.6, fontWeight:400 }}>{n.sub}</div>
                  </div>
                  {n.needsResult && !result && (
                    <span style={{ marginLeft:'auto', fontSize:10, opacity:0.4 }}>🔒</span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Backend status + version */}
          <div style={{ padding:'16px 20px', borderTop:'1px solid rgba(255,255,255,0.07)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:6 }}>
              <div style={{ width:8, height:8, borderRadius:'50%', background:statusDot, flexShrink:0,
                boxShadow: backendStatus==='online'?'0 0 6px #14a870':undefined }} />
              <span style={{ fontSize:12, color:'#607d99' }}>{statusLabel}</span>
            </div>
            <div style={{ fontSize:11, color:'#3d5a7a', fontFamily:'IBM Plex Mono,monospace' }}>v1.0.0 — BS Project</div>
          </div>
        </aside>

        {/* ── Main content area ── */}
        <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0 }}>

          {/* Top header bar */}
          <header style={{
            background: 'var(--surface)', borderBottom: '1px solid var(--border)',
            padding: '0 32px', height: 60,
            display:'flex', alignItems:'center', justifyContent:'space-between',
            position:'sticky', top:0, zIndex:40,
            boxShadow:'0 1px 0 var(--border)',
          }}>
            <div>
              <div style={{ fontFamily:'Sora,sans-serif', fontWeight:700, fontSize:16, color:'var(--navy)' }}>
                {NAV.find(n=>n.id===tab)?.label}
              </div>
              <div style={{ fontSize:12, color:'var(--muted)' }}>
                {NAV.find(n=>n.id===tab)?.sub}
              </div>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              {result && (
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span className="badge badge-success">✓ Schedule Ready</span>
                  <span className="badge badge-info">
                    {result.optimization.algorithm.replace(/_/g,' ')}
                  </span>
                </div>
              )}
              {loading && (
                <div style={{ display:'flex', alignItems:'center', gap:8, color:'var(--blue)', fontSize:13, fontFamily:'Sora,sans-serif' }}>
                  <div className="spinner" style={{ borderTopColor:'var(--blue)', borderColor:'rgba(29,111,164,0.2)' }} />
                  Running algorithms…
                </div>
              )}
            </div>
          </header>

          {/* Page body */}
          <main style={{ flex:1, padding:'28px 32px', overflowY:'auto' }}>

            {/* Offline warning */}
            {backendStatus === 'offline' && (
              <div className="alert alert-warning fade-up" style={{ marginBottom:20 }}>
                <span style={{ fontSize:18 }}>⚠️</span>
                <div>
                  <strong>Backend is offline.</strong> Start the FastAPI server first:
                  <code style={{ display:'block', marginTop:4, fontSize:12, fontFamily:'IBM Plex Mono,monospace', background:'rgba(0,0,0,0.05)', padding:'4px 8px', borderRadius:4 }}>
                    cd backend &amp;&amp; uvicorn main:app --reload
                  </code>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="alert alert-error fade-up" style={{ marginBottom:20 }}>
                <span style={{ fontSize:18 }}>❌</span>
                <div style={{ flex:1 }}>{error}</div>
                <button onClick={()=>setError(null)} style={{ background:'none',border:'none',cursor:'pointer',color:'#991b1b',fontWeight:700,fontSize:16 }}>×</button>
              </div>
            )}

            {/* Tab content */}
            {tab === 'configure' && <InputPanel onSubmit={handleGenerate} loading={loading} />}
            {tab === 'schedule'  && result && <ScheduleTable result={result} />}
            {tab === 'metrics'   && result && <MetricsPanel result={result} />}
            {tab === 'guide'     && <AlgoExplainer />}
          </main>

          {/* ── Footer ── */}
          <footer style={{
            background: 'var(--navy)', color: '#607d99',
            padding: '20px 32px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexWrap: 'wrap', gap: 12,
          }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
               <div style={{ width:28, height:28, borderRadius:8, background:'linear-gradient(135deg,#38aed4,#1d6fa4)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14 }}>🗓</div>
              <div>
                <div style={{ fontFamily:'Sora,sans-serif', fontWeight:600, fontSize:13, color:'#94afc8' }}>AI-Based Scheduling System</div>
                {/*<div style={{ fontSize:11, marginTop:1 }}>BS Computer Science — Semester Project</div>*/}
              </div>
            </div>
          {/* <div style={{ display:'flex', alignItems:'center', gap:20, fontSize:12 }}>
              <span>⚙️ FastAPI + Python</span>
              <span>⚛️ React + Tailwind</span>
              <span>🧠 CSP + Genetic Algorithm</span>
            </div> */}
            <div style={{ fontSize:11, fontFamily:'IBM Plex Mono,monospace'}}>
              © {new Date().getFullYear()} — All rights reserved
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
