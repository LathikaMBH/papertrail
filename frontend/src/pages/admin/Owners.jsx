import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';

function OwnerForm({ onSave, onCancel }) {
  const [form, setForm] = useState({ name:'', email:'', password:'', city:'', phone:'' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const submit = async e => {
    e.preventDefault(); setError(''); setSaving(true);
    try { await onSave(form); }
    catch (err) { setError(err.error || 'Failed'); }
    finally { setSaving(false); }
  };

  return (
    <div className="card" style={{ marginBottom:20, borderColor:'var(--pr)44' }}>
      <div style={{ color:'var(--pl)', fontWeight:600, fontSize:14, marginBottom:16 }}>
        <i className="ti ti-user-plus" /> New Route Owner
      </div>
      <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:12 }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          <input className="input" placeholder="Full name *" value={form.name} onChange={f('name')} required />
          <input className="input" placeholder="City" value={form.city} onChange={f('city')} />
        </div>
        <input className="input" placeholder="Phone number" value={form.phone} onChange={f('phone')} />
        <input className="input" type="email" placeholder="Email address *" value={form.email} onChange={f('email')} required />
        <input className="input" type="password" placeholder="Password *" value={form.password} onChange={f('password')} required />
        {error && <div style={{ color:'var(--red)', fontSize:13 }}>{error}</div>}
        <div style={{ display:'flex', gap:10 }}>
          <button className="btn btn-primary" type="submit" style={{ flex:2 }} disabled={saving}>
            {saving ? 'Creating...' : 'Create Route Owner'}
          </button>
          <button className="btn btn-ghost" type="button" style={{ flex:1 }} onClick={onCancel}>Cancel</button>
        </div>
      </form>
    </div>
  );
}

export default function AdminOwners() {
  const navigate = useNavigate();
  const [owners, setOwners] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [riderMap, setRiderMap] = useState({});

  const load = () => api.getOwners().then(setOwners).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const createOwner = async (form) => {
    await api.createOwner(form);
    setShowForm(false);
    load();
  };

  const deleteOwner = async (id, e) => {
    e.stopPropagation();
    if (!confirm('Delete this route owner and all their data?')) return;
    await api.deleteOwner(id);
    load();
  };

  const toggleExpand = async (id) => {
    if (expanded === id) { setExpanded(null); return; }
    setExpanded(id);
    if (!riderMap[id]) {
      const riders = await api.getOwnerRiders(id);
      setRiderMap(p => ({ ...p, [id]: riders }));
    }
  };

  return (
    <div className="screen">
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate('/admin')}><i className="ti ti-arrow-left" /></button>
        <h3>Route Owners</h3>
        <button className="btn btn-sm" style={{ background:'var(--pr)', color:'#fff', padding:'8px 12px' }}
          onClick={() => setShowForm(!showForm)}>
          <i className={`ti ti-${showForm?'x':'plus'}`} />
        </button>
      </div>

      <div style={{ padding:'0 22px' }}>
        {showForm && <OwnerForm onSave={createOwner} onCancel={() => setShowForm(false)} />}

        {loading && <div className="spinner" />}

        {owners.map(o => (
          <div key={o.id} className="card" style={{ marginBottom:14 }}>
            {/* Owner header */}
            <div style={{ display:'flex', alignItems:'center', gap:14, cursor:'pointer' }} onClick={() => toggleExpand(o.id)}>
              <div style={{ width:48, height:48, borderRadius:16, background:'var(--pr)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:700, fontSize:18, flexShrink:0 }}>{o.name[0]}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:600, fontSize:15 }}>{o.name}</div>
                <div style={{ color:'var(--mut)', fontSize:12, marginTop:2 }}>
                  {o.email}
                </div>
                <div style={{ color:'var(--mut)', fontSize:12, marginTop:1 }}>
                  {o.city && <><i className="ti ti-map-pin" style={{ fontSize:11 }} /> {o.city} · </>}
                  {o.phone && <><i className="ti ti-phone" style={{ fontSize:11 }} /> {o.phone}</>}
                </div>
              </div>
              <div style={{ textAlign:'right', flexShrink:0 }}>
                <div style={{ color:'var(--pl)', fontWeight:700, fontSize:14 }}>{o.route_count} routes</div>
                <div style={{ color:'var(--mut)', fontSize:11 }}>{o.rider_count}/5 riders</div>
                <i className={`ti ti-chevron-${expanded===o.id?'up':'down'}`} style={{ color:'var(--mut)', fontSize:14 }} />
              </div>
            </div>

            {/* Expanded: riders */}
            {expanded === o.id && (
              <div style={{ marginTop:14, paddingTop:14, borderTop:'1px solid var(--border)' }}>
                <div className="section-label" style={{ marginBottom:8 }}>Riders</div>
                {(riderMap[o.id] || []).length === 0 && <div style={{ color:'var(--mut)', fontSize:13 }}>No riders yet</div>}
                {(riderMap[o.id] || []).map(r => (
                  <div key={r.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderBottom:'1px solid var(--border)' }}>
                    <div style={{ width:32, height:32, borderRadius:10, background:'var(--el)', border:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--pl)', fontWeight:700, fontSize:14, flexShrink:0 }}>{r.name[0]}</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13, fontWeight:500 }}>{r.name}</div>
                      <div style={{ fontSize:11, color:'var(--mut)' }}>{r.email}</div>
                    </div>
                    <span className="badge badge-mailbox" style={{ fontSize:10 }}><i className="ti ti-bike" style={{ fontSize:10 }} /> Rider</span>
                  </div>
                ))}
              </div>
            )}

            {/* Actions */}
            <div style={{ display:'flex', gap:8, marginTop:14 }}>
              <button className="btn btn-ghost btn-sm" style={{ flex:1 }} onClick={() => toggleExpand(o.id)}>
                <i className="ti ti-users" style={{ fontSize:13 }} /> {expanded===o.id?'Hide':'Riders'}
              </button>
              <button className="btn btn-ghost btn-sm" style={{ flex:1 }} onClick={() => navigate(`/admin/routes?owner=${o.id}`)}>
                <i className="ti ti-map-2" style={{ fontSize:13 }} /> Routes
              </button>
              <button className="btn btn-danger btn-sm" onClick={e => deleteOwner(o.id, e)}>
                <i className="ti ti-trash" style={{ fontSize:13 }} />
              </button>
            </div>
          </div>
        ))}

        {!loading && owners.length === 0 && !showForm && (
          <div style={{ textAlign:'center', color:'var(--mut)', paddingTop:60 }}>
            <i className="ti ti-users-group" style={{ fontSize:48, display:'block', marginBottom:12 }} />
            No route owners yet
          </div>
        )}
      </div>
    </div>
  );
}
