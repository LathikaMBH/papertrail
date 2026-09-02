const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const bcrypt = require('bcryptjs');
const path = require('path');

const adapter = new FileSync(path.join(__dirname, 'papertrail.json'));
const db = low(adapter);

db.defaults({
  users: [], routes: [], stops: [], location_pings: [],
  _seq: { users: 1, routes: 1, stops: 1, pings: 1 }
}).write();

function nextId(table) {
  const id = db.get(`_seq.${table}`).value();
  db.set(`_seq.${table}`, id + 1).write();
  return id;
}
function now() { return new Date().toISOString(); }
function safe(u) { if (!u) return null; const c = { ...u }; delete c.password_hash; return c; }

// Seed admin
if (!db.get('users').find({ email: 'admin@papertrail.com' }).value()) {
  db.get('users').push({
    id: nextId('users'), name: 'Admin', email: 'admin@papertrail.com',
    password_hash: bcrypt.hashSync('admin123', 10),
    role: 'admin', city: 'HQ', phone: '', owner_id: null, created_at: now()
  }).write();
  console.log('✅ Seed: admin@papertrail.com / admin123');
}

const queries = {
  // ── Users ────────────────────────────────────────────────────────────────
  getUserByEmail: (email) => db.get('users').find({ email }).value(),
  getUserById:    (id)    => safe(db.get('users').find({ id: Number(id) }).value()),
  getRawUserById: (id)    => db.get('users').find({ id: Number(id) }).value(),

  getAllOwners: () => db.get('users').filter({ role: 'route_owner' }).value().map(u => {
    const riders = db.get('users').filter({ role: 'rider', owner_id: u.id }).value().length;
    const routes = db.get('routes').filter({ owner_id: u.id }).value().length;
    return { ...safe(u), rider_count: riders, route_count: routes };
  }),

  getOwnerById: (id) => safe(db.get('users').find({ id: Number(id), role: 'route_owner' }).value()),

  getRidersByOwner: (owner_id) => db.get('users')
    .filter({ role: 'rider', owner_id: Number(owner_id) }).value().map(safe),

  countRidersByOwner: (owner_id) => db.get('users')
    .filter({ role: 'rider', owner_id: Number(owner_id) }).value().length,

  getAllRiders: () => db.get('users').filter({ role: 'rider' }).value().map(safe),

  createUser: (name, email, password_hash, role, extra = {}) => {
    const existing = db.get('users').find({ email }).value();
    if (existing) throw new Error('EMAIL_EXISTS');
    const user = { id: nextId('users'), name, email, password_hash, role, ...extra, created_at: now() };
    db.get('users').push(user).write();
    return user;
  },

  updateUser: (id, data) => {
    id = Number(id);
    db.get('users').find({ id }).assign(data).write();
    return safe(db.get('users').find({ id }).value());
  },

  deleteUser: (id) => {
    id = Number(id);
    db.get('users').remove({ id }).write();
    // Unassign their routes
    db.get('routes').filter({ rider_id: id }).each(r => { r.rider_id = null; }).write();
  },

  // ── Routes ───────────────────────────────────────────────────────────────
  getAllRoutes: () => db.get('routes').value().map(r => enrichRoute(r)).sort((a, b) => b.id - a.id),

  getRoutesByOwner: (owner_id) => db.get('routes')
    .filter({ owner_id: Number(owner_id) }).value()
    .map(r => enrichRoute(r)).sort((a, b) => b.id - a.id),

  getRoutesForRider: (rider_id) => db.get('routes')
    .filter({ rider_id: Number(rider_id) }).value()
    .map(r => enrichRoute(r)),

  getRouteById: (id) => enrichRoute(db.get('routes').find({ id: Number(id) }).value()),

  createRoute: (name, owner_id) => {
    const r = { id: nextId('routes'), name, owner_id: Number(owner_id), status: 'not_started', rider_id: null, started_at: null, completed_at: null, paused_at: null, created_at: now() };
    db.get('routes').push(r).write(); return r;
  },

  updateRoute: (id, data) => {
    id = Number(id);
    db.get('routes').find({ id }).assign(data).write();
    return enrichRoute(db.get('routes').find({ id }).value());
  },

  deleteRoute: (id) => {
    id = Number(id);
    db.get('routes').remove({ id }).write();
    db.get('stops').remove({ route_id: id }).write();
  },

  assignRoute: (rider_id, route_id) => {
    db.get('routes').find({ id: Number(route_id) }).assign({ rider_id: rider_id ? Number(rider_id) : null }).write();
  },

  // ── Stops ────────────────────────────────────────────────────────────────
  getStopsByRoute: (route_id) => db.get('stops').filter({ route_id: Number(route_id) }).value().sort((a, b) => a.order_num - b.order_num),
  getStopById:     (id)       => db.get('stops').find({ id: Number(id) }).value(),
  getMaxOrder:     (route_id) => db.get('stops').filter({ route_id: Number(route_id) }).value().reduce((m, s) => Math.max(m, s.order_num || 0), 0),

  createStop: (route_id, order_num, address, lat, lng, type) => {
    const s = { id: nextId('stops'), route_id: Number(route_id), order_num, address, lat, lng, type, delivered: false, delivered_at: null, delivered_method: null, created_at: now() };
    db.get('stops').push(s).write(); return s;
  },

  updateStop: (id, address, lat, lng, type, order_num) => {
    id = Number(id);
    db.get('stops').find({ id }).assign({ address, lat, lng, type, order_num }).write();
    return db.get('stops').find({ id }).value();
  },

  deleteStop:   (id)          => db.get('stops').remove({ id: Number(id) }).write(),

  deliverStop:  (method, id)  => {
    id = Number(id);
    db.get('stops').find({ id }).assign({ delivered: true, delivered_at: now(), delivered_method: method }).write();
    return db.get('stops').find({ id }).value();
  },

  resetStops: (route_id) => {
    route_id = Number(route_id);
    db.get('stops').value().filter(s => s.route_id === route_id).forEach(s => {
      Object.assign(s, { delivered: false, delivered_at: null, delivered_method: null });
    });
    db.write();
  },

  // ── Location ─────────────────────────────────────────────────────────────
  insertPing: (route_id, rider_id, lat, lng) =>
    db.get('location_pings').push({ id: nextId('pings'), route_id: Number(route_id), rider_id: Number(rider_id), lat, lng, recorded_at: now() }).write(),
};

function enrichRoute(r) {
  if (!r) return null;
  const rider  = r.rider_id  ? safe(db.get('users').find({ id: r.rider_id  }).value()) : null;
  const owner  = r.owner_id  ? safe(db.get('users').find({ id: r.owner_id  }).value()) : null;
  const stops  = db.get('stops').filter({ route_id: r.id }).value();
  return { ...r, rider_name: rider?.name || null, owner_name: owner?.name || null, stop_count: stops.length, delivered_count: stops.filter(s => s.delivered).length };
}

function setRouteStatus(id, status) {
  id = Number(id);
  const update = { status };
  if (status === 'ongoing')   update.started_at  = now();
  if (status === 'paused')    update.paused_at   = now();
  if (status === 'completed') update.completed_at = now();
  db.get('routes').find({ id }).assign(update).write();
}

module.exports = { db, queries, setRouteStatus };
