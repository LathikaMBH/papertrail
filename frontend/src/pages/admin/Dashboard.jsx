import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [owners, setOwners] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getOwners(), api.getRoutes()])
      .then(([o, r]) => { setOwners(o); setRoutes(r); })
      .finally(() => setLoading(false));
  }, []);

  const stats = {
    owners:    owners.length,
    riders:    owners.reduce((s, o) => s + (o.rider_count || 0), 0),
    routes:    routes.length,
    ongoing:   routes.filter(r => r.status === 'ongoing').length,
    completed: routes.filter(r => r.status === 'completed').length,
  };

  return (
    <div className="screen" style={{ padding:'0 22px 20px' }}>
      <div style={{ paddingTop:52, display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
        <div>
          <p style={{ fontSize:11, color:'var(--mut)', margin:0, textTransform:'uppercase', letterSpacing:'0.06em' }}>Admin Panel</p>
          <h2 style={{ fontSize:20 }}>Welcome, {user?.name}</h2>
        </div>
        <button onClick={() => { logout(); navigate('/login'); }} className="btn btn-ghost btn-sm">
          <i className="ti ti-logout" style={{ fontSize:16 }} />
        </button>
      </div>

      {/* Stats row */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:24 }}>
        {[
          { label:'Owners',    val:stats.owners,    color:'var(--pl)' },
          { label:'Riders',    val:stats.riders,    color:'var(--sub)' },
          { label:'Routes',    val:stats.routes,    color:'var(--tx)' },
          { label:'Ongoing',   val:stats.ongoing,   color:'var(--amb)' },
          { label:'Completed', val:stats.completed, color:'var(--grn)' },
          { label:'Total',     val:stats.routes,    color:'var(--mut)' },
        ].slice(0,3).map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-val" style={{ color:s.color, fontSize:24 }}>{s.val}</div>
            <div className="stat-lbl">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="section-label">Actions</div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:28 }}>
        <button onClick={() => navigate('/admin/owners')} style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:18, padding:'16px 14px', textAlign:'left', cursor:'pointer' }}>
          <i className="ti ti-users" style={{ fontSize:26, color:'var(--pl)', display:'block', marginBottom:8 }} />
          <div style={{ color:'var(--tx)', fontSize:13, fontWeight:600 }}>Route Owners</div>
          <div style={{ color:'var(--mut)', fontSize:11, marginTop:2 }}>{stats.owners} accounts</div>
        </button>
        <button onClick={() => navigate('/admin/routes')} style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:18, padding:'16px 14px', textAlign:'left', cursor:'pointer' }}>
          <i className="ti ti-map-2" style={{ fontSize:26, color:'var(--pl)', display:'block', marginBottom:8 }} />
          <div style={{ color:'var(--tx)', fontSize:13, fontWeight:600 }}>All Routes</div>
          <div style={{ color:'var(--mut)', fontSize:11, marginTop:2 }}>{stats.routes} total</div>
        </button>
      </div>

      {/* Owner list */}
      <div className="section-label">Route Owners</div>
      {loading && <div className="spinner" />}
      {owners.map(o => (
        <div key={o.id} className="card" style={{ marginBottom:12, cursor:'pointer' }} onClick={() => navigate(`/admin/owners/${o.id}`)}>
          <div style={{ display:'flex', alignItems:'center', gap:14 }}>
            <div style={{ width:46, height:46, borderRadius:16, background:'var(--pr)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:700, fontSize:18, flexShrink:0 }}>{o.name[0]}</div>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:600, fontSize:15 }}>{o.name}</div>
              <div style={{ color:'var(--mut)', fontSize:12, marginTop:2 }}>
                <i className="ti ti-map-pin" style={{ fontSize:11 }} /> {o.city || '—'}
                {o.phone && <> · <i className="ti ti-phone" style={{ fontSize:11 }} /> {o.phone}</>}
              </div>
            </div>
            <div style={{ textAlign:'right' }}>
              <div style={{ color:'var(--pl)', fontSize:13, fontWeight:600 }}>{o.route_count} routes</div>
              <div style={{ color:'var(--mut)', fontSize:11 }}>{o.rider_count}/5 riders</div>
            </div>
          </div>
        </div>
      ))}
      {!loading && owners.length === 0 && (
        <div style={{ textAlign:'center', color:'var(--mut)', paddingTop:40 }}>
          <i className="ti ti-users-group" style={{ fontSize:48, display:'block', marginBottom:12 }} />
          No route owners yet<br/>
          <button className="btn btn-primary" style={{ marginTop:16, width:'auto', padding:'12px 24px' }} onClick={() => navigate('/admin/owners')}>
            Create first owner
          </button>
        </div>
      )}
    </div>
  );
}
