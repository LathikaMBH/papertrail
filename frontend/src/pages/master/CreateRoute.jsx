import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import api from '../../services/api';

// Fix Leaflet default icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom marker icons
const makeIcon = (color, label) => L.divIcon({
  className: '',
  html: `<div style="width:32px;height:32px;border-radius:50%;background:${color};border:2.5px solid white;display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:12px;box-shadow:0 2px 8px rgba(0,0,0,0.35)">${label}</div>`,
  iconSize: [32,32], iconAnchor: [16,16],
});

const mailboxIcon = (n) => makeIcon('#7C5CEA', n);
const aptIcon     = (n) => makeIcon('#F59E0B', n);
const gpsIcon = L.divIcon({
  className: '',
  html: `<div style="width:22px;height:22px;border-radius:50%;background:#4285F4;border:3px solid white;box-shadow:0 0 0 3px rgba(66,133,244,0.3)"></div>`,
  iconSize: [22,22], iconAnchor: [11,11],
});

// Component that re-centres map when GPS pos changes
function MapCenterer({ pos }) {
  const map = useMap();
  useEffect(() => { if (pos) map.flyTo(pos, map.getZoom(), { duration:0.8 }); }, [pos]);
  return null;
}

// Click handler
function MapClickHandler({ onMapClick }) {
  useMapEvents({ click: e => onMapClick(e.latlng) });
  return null;
}

export default function CreateRoute() {
  const navigate = useNavigate();
  const { id } = useParams(); // present when editing
  const isEdit = Boolean(id);

  const [routeName, setRouteName] = useState('');
  const [stops, setStops] = useState([]);
  const [gpsPos, setGpsPos] = useState(null);
  const [gpsAccuracy, setGpsAccuracy] = useState(null);
  const [nextType, setNextType] = useState('mailbox');
  const [saving, setSaving] = useState(false);
  const [routeId, setRouteId] = useState(id || null);
  const [mapCenter, setMapCenter] = useState([61.1282, 21.5117]); // Rauma default
  const watchRef = useRef(null);

  // Load existing route if editing
  useEffect(() => {
    if (!isEdit) return;
    api.getRoute(id).then(r => {
      setRouteName(r.name);
      setStops(r.stops || []);
    });
  }, [id]);

  // Start GPS watch
  useEffect(() => {
    if (!navigator.geolocation) return;
    watchRef.current = navigator.geolocation.watchPosition(
      pos => {
        const p = [pos.coords.latitude, pos.coords.longitude];
        setGpsPos(p);
        setGpsAccuracy(Math.round(pos.coords.accuracy));
        if (!stops.length && !isEdit) setMapCenter(p);
      },
      null,
      { enableHighAccuracy: true, maximumAge: 3000 }
    );
    return () => { if (watchRef.current) navigator.geolocation.clearWatch(watchRef.current); };
  }, []);

  // Ensure route exists in DB before adding stops
  const ensureRoute = async () => {
    if (routeId) return routeId;
    const r = await api.createRoute({ name: routeName || 'New Route' });
    setRouteId(r.id);
    return r.id;
  };

  const saveGPS = async () => {
    if (!gpsPos) return alert('GPS not ready yet. Please wait for a location fix.');
    const rId = await ensureRoute();
    const stop = await api.createStop(rId, {
      lat: gpsPos[0], lng: gpsPos[1],
      address: `Stop ${stops.length + 1}`,
      type: nextType,
    });
    setStops(prev => [...prev, stop]);
  };

  const handleMapClick = async (latlng) => {
    const rId = await ensureRoute();
    const stop = await api.createStop(rId, {
      lat: latlng.lat, lng: latlng.lng,
      address: `Stop ${stops.length + 1}`,
      type: nextType,
    });
    setStops(prev => [...prev, stop]);
  };

  const toggleStopType = async (stop) => {
    const newType = stop.type === 'mailbox' ? 'apartment' : 'mailbox';
    await api.updateStop(stop.id, { ...stop, type: newType });
    setStops(prev => prev.map(s => s.id === stop.id ? { ...s, type: newType } : s));
  };

  const deleteStop = async (stop) => {
    await api.deleteStop(stop.id);
    setStops(prev => prev.filter(s => s.id !== stop.id));
  };

  const updateAddress = async (stop, address) => {
    await api.updateStop(stop.id, { ...stop, address });
    setStops(prev => prev.map(s => s.id === stop.id ? { ...s, address } : s));
  };

  const saveRoute = async () => {
    if (!routeName.trim()) return alert('Please enter a route name');
    if (stops.length === 0) return alert('Please add at least one stop');
    setSaving(true);
    try {
      const rId = await ensureRoute();
      await api.updateRoute(rId, { name: routeName });
      navigate('/master/routes');
    } catch (e) {
      alert('Save failed: ' + (e.error || e.message));
    } finally { setSaving(false); }
  };

  const polylinePoints = stops.map(s => [s.lat, s.lng]);
  const mboxCount = stops.filter(s => s.type === 'mailbox').length;
  const aptCount  = stops.filter(s => s.type === 'apartment').length;

  return (
    <div className="screen-full" style={{ display:'flex', flexDirection:'column' }}>
      {/* Header */}
      <div style={{ padding:'56px 22px 12px', display:'flex', alignItems:'center', gap:12, flexShrink:0 }}>
        <button className="back-btn" onClick={() => navigate('/master/routes')}><i className="ti ti-arrow-left" /></button>
        <input className="input" style={{ flex:1, borderColor:'var(--pr)' }}
          placeholder="Route name e.g. Rauma North" value={routeName} onChange={e => setRouteName(e.target.value)} />
      </div>

      {/* Map */}
      <div style={{ flex:'0 0 46%', margin:'0 22px', borderRadius:16, overflow:'hidden', border:'2px solid #C8C4BC' }}>
        <MapContainer center={mapCenter} zoom={16} style={{ height:'100%', width:'100%' }} zoomControl={false}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <MapClickHandler onMapClick={handleMapClick} />
          {gpsPos && <MapCenterer pos={null} />}

          {/* Route polyline */}
          {polylinePoints.length > 1 && <Polyline positions={polylinePoints} color="#7C5CEA" weight={3} opacity={0.7} dashArray="8 5" />}

          {/* Stop markers */}
          {stops.map((s, i) => (
            <Marker key={s.id} position={[s.lat, s.lng]} icon={s.type === 'apartment' ? aptIcon(i+1) : mailboxIcon(i+1)}>
              <Popup>
                <div style={{ fontSize:13, minWidth:160 }}>
                  <strong>Stop {i+1}</strong><br/>
                  <input style={{ border:'1px solid #ccc', borderRadius:6, padding:'4px 8px', width:'100%', marginTop:6, fontSize:12 }}
                    defaultValue={s.address} onBlur={e => updateAddress(s, e.target.value)} />
                  <div style={{ marginTop:8, display:'flex', gap:6 }}>
                    <button onClick={() => toggleStopType(s)} style={{ flex:1, padding:'5px 8px', borderRadius:8, border:'1px solid #ccc', cursor:'pointer', fontSize:11, background: s.type==='apartment'?'#FEF3C7':'#D1FAE5' }}>
                      {s.type === 'mailbox' ? '📬 Mailbox' : '🏢 Apartment'}
                    </button>
                    <button onClick={() => deleteStop(s)} style={{ padding:'5px 8px', borderRadius:8, border:'1px solid #f99', cursor:'pointer', fontSize:11, background:'#FEE2E2' }}>🗑</button>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* GPS dot */}
          {gpsPos && <Marker position={gpsPos} icon={gpsIcon}><Popup>📍 You are here{gpsAccuracy ? ` (±${gpsAccuracy}m)` : ''}</Popup></Marker>}
        </MapContainer>
      </div>

      {/* GPS status bar */}
      <div style={{ margin:'0 22px', padding:'7px 12px', background:'#F2EFE8', borderRadius:'0 0 12px 12px', borderTop:'none', display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
        <div style={{ width:9, height:9, borderRadius:'50%', background: gpsPos ? '#22A05B' : '#F59E0B', flexShrink:0 }} />
        <span style={{ fontSize:11, color:'#5F5A55', flex:1 }}>
          {gpsPos ? `GPS locked ±${gpsAccuracy}m · Tap map or press button to pin` : 'Searching for GPS signal...'}
        </span>
        {stops.length > 0 && (
          <button onClick={() => { setStops(prev => prev.slice(0,-1)); }}
            style={{ fontSize:11, background:'none', border:'1px solid #C0BAB2', borderRadius:7, padding:'3px 8px', cursor:'pointer', color:'#6E6860' }}>
            ↩ Undo
          </button>
        )}
      </div>

      {/* Controls */}
      <div style={{ padding:'12px 22px 0', flexShrink:0 }}>
        {/* Type toggle */}
        <div className="label" style={{ marginBottom:8 }}>Next pin type</div>
        <div style={{ display:'flex', gap:10, marginBottom:12 }}>
          <button onClick={() => setNextType('mailbox')}
            style={{ flex:1, padding:11, borderRadius:12, border:`1.5px solid ${nextType==='mailbox'?'var(--grn)':'var(--border)'}`,
              cursor:'pointer', background:nextType==='mailbox'?'#082E20':'var(--el)',
              color:nextType==='mailbox'?'var(--grn)':'var(--mut)', fontWeight:600, fontSize:13, fontFamily:'inherit' }}>
            <i className="ti ti-mailbox" /> Mailbox (auto-detect)
          </button>
          <button onClick={() => setNextType('apartment')}
            style={{ flex:1, padding:11, borderRadius:12, border:`1.5px solid ${nextType==='apartment'?'var(--apt)':'var(--border)'}`,
              cursor:'pointer', background:nextType==='apartment'?'#2D1A00':'var(--el)',
              color:nextType==='apartment'?'var(--apt)':'var(--mut)', fontWeight:600, fontSize:13, fontFamily:'inherit' }}>
            <i className="ti ti-building" /> Apartment (manual)
          </button>
        </div>

        {/* GPS save button */}
        <button onClick={saveGPS} className="btn"
          style={{ width:'100%', padding:16, borderRadius:16, border:'none', cursor:'pointer',
            background: gpsPos ? '#4285F4' : 'var(--mut)', color:'white', fontSize:15, fontWeight:700,
            display:'flex', alignItems:'center', justifyContent:'center', gap:10, marginBottom:8 }}>
          <i className="ti ti-current-location" style={{ fontSize:22 }} />
          Save GPS Location — Stop {stops.length + 1}
        </button>
        <p style={{ textAlign:'center', fontSize:11, marginBottom:10 }}>
          {gpsPos ? 'Standing at the mailbox? Press to capture your exact location' : 'Or tap anywhere on the map to pin a stop'}
        </p>

        {/* Stop count */}
        {stops.length > 0 && (
          <div style={{ background:'var(--card)', borderRadius:14, padding:'10px 14px', border:'1px solid var(--border)', display:'flex', gap:20, marginBottom:12 }}>
            <span style={{ fontSize:13 }}><i className="ti ti-mailbox" style={{ color:'var(--grn)' }} /> <span style={{ color:'var(--grn)', fontWeight:700 }}>{mboxCount}</span> <span style={{ color:'var(--mut)' }}>mailbox</span></span>
            <span style={{ fontSize:13 }}><i className="ti ti-building" style={{ color:'var(--apt)' }} /> <span style={{ color:'var(--apt)', fontWeight:700 }}>{aptCount}</span> <span style={{ color:'var(--mut)' }}>apartment</span></span>
            <span style={{ fontSize:13, color:'var(--mut)' }}>= <span style={{ color:'var(--tx)', fontWeight:700 }}>{stops.length}</span> total</span>
          </div>
        )}

        <button className="btn btn-primary" onClick={saveRoute} disabled={saving}>
          {saving ? 'Saving...' : <><i className="ti ti-device-floppy" /> Save Route</>}
        </button>
      </div>
    </div>
  );
}
