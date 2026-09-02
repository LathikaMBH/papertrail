import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

export default function OwnerRiders() {
  const navigate = useNavigate();
  const [riders, setRiders] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name:'', email:'', password:'' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => api.getRiders().then(setRiders);
  useEffect(() => { load(); }, []);

  const createRider = async e => {
    e.preventDefault(); setError(''); setSaving(true);
    try {
      await api.createRider(form);
      setForm({ name:'', email:'', password:'' });
      setShowForm(false); load();
    } catch (err) { setError(err.error || 'Failed to create rider'); }
    finally { setSaving(false); }
  };

  const deleteRider = async (id) => {
    if (!confirm('Remove this rider?')) return;
    await api.deleteRider(id); load();
  };

  const atLimit = riders.length >= 5;

  return (
    <div className="screen">
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate('/owner')}><i className="ti ti-arrow-left" /></button>
        <h3>Riders ({riders.length}/5)</h3>
        <button className="btn btn-sm" style={{ background: atLimit ? 'var(--el)' : 'var(--pr)', color: atLimit ? 'var(--mut)' : '#fff', padding:'8px 12px' }}
          onClick={() => !atLimit && setShowForm(!showForm)} disabled={atLimit}>
          <i className={`ti ti-${showForm?'x':'plus'}`} />
        </button>
      </div>

      <div style={{ padding:'0 22px' }}>
        {/* Limit info */}
        <div style={{ background:'var(--card)', borderRadius:14, padding:'10px 14px', marginBottom:16, border:'1px solid var(--border)', display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:12, color:'var(--mut)' }}>Rider slots used</div>
            <div style={{ height:5, background:'var(--el)', borderRadius:3, marginTop:6 }}>
              <div style={{ height:'100%', width:`${riders.length/5*100}%`, background: atLimit ? 'var(--red)' : 'var(--pr)', borderRadius:3 }} />
            </div>
          </div>
          <div style={{ color: atLimit ? 'var(--red)' : 'var(--pl)', fontWeight:700, fontSize:16 }}>{riders.length}/5</div>
        </div>

        {atLimit && (
          <div style={{ background:'#2A0808', border:'1px solid #541212', borderRadius:12, padding:'10px 14px', color:'#F87171', fontSize:13, marginBottom:16 }}>
            <i className="ti ti-alert-triangle" /> Maximum 5 riders reached. Delete a rider to add a new one.
          </div>
        )}

        {/* Create form */}
        {showForm && !atLimit && (
          <div className="card" style={{ marginBottom:20, borderColor:'var(--pr)44' }}>
            <div style={{ color:'var(--pl)', fontWeight:600, fontSize:14, marginBottom:14 }}><i className="ti ti-user-plus" /> Add rider</div>
            <form onSubmit={createRider} style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <input className="input" placeholder="Full name" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} required />
              <input className="input" type="email" placeholder="Email address" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} required />
              <input className="input" type="password" placeholder="Password" value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))} required />
              {error && <div style={{ color:'var(--red)', fontSize:13 }}>{error}</div>}
              <div style={{ display:'flex', gap:10 }}>
                <button className="btn btn-primary" type="submit" style={{ flex:2 }} disabled={saving}>{saving?'Creating...':'Create Rider'}</button>
                <button className="btn btn-ghost" type="button" style={{ flex:1 }} onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </form>
          </div>
        )}

        {/* Rider list */}
        {riders.map(r => (
          <div key={r.id} className="card" style={{ marginBottom:12, display:'flex', alignItems:'center', gap:14 }}>
            <div style={{ width:48, height:48, borderRadius:16, background:'var(--pr)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:700, fontSize:18, flexShrink:0 }}>{r.name[0]}</div>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:600, fontSize:15 }}>{r.name}</div>
              <div style={{ color:'var(--mut)', fontSize:12, marginTop:2 }}>{r.email}</div>
            </div>
            <button className="btn btn-danger btn-sm" onClick={() => deleteRider(r.id)}>
              <i className="ti ti-trash" style={{ fontSize:13 }} />
            </button>
          </div>
        ))}

        {riders.length === 0 && (
          <div style={{ textAlign:'center', color:'var(--mut)', paddingTop:60 }}>
            <i className="ti ti-bike" style={{ fontSize:48, display:'block', marginBottom:12 }} />
            No riders yet — tap + to add one
          </div>
        )}
      </div>
    </div>
  );
}
