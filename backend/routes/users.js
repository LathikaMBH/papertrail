const router = require('express').Router();
const bcrypt = require('bcryptjs');
const { queries } = require('../database');
const { auth, adminOnly, ownerOrAdmin } = require('../middleware/auth');

// ── Admin: get all route owners ──────────────────────────────────────────────
router.get('/owners', auth, adminOnly, (req, res) => res.json(queries.getAllOwners()));

// ── Admin: create route owner ────────────────────────────────────────────────
router.post('/owners', auth, adminOnly, (req, res) => {
  const { name, email, password, city = '', phone = '' } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Name, email and password required' });
  try {
    const hash = bcrypt.hashSync(password, 10);
    const user = queries.createUser(name, email.toLowerCase().trim(), hash, 'route_owner', { city, phone, owner_id: null });
    res.status(201).json({ id: user.id, name, email, role: 'route_owner', city, phone });
  } catch (e) {
    if (e.message === 'EMAIL_EXISTS') return res.status(409).json({ error: 'Email already exists' });
    res.status(500).json({ error: e.message });
  }
});

// ── Admin: update / delete owner ─────────────────────────────────────────────
router.put('/owners/:id', auth, adminOnly, (req, res) => {
  const { name, city, phone, email } = req.body;
  res.json(queries.updateUser(req.params.id, { name, city, phone, email }));
});
router.delete('/owners/:id', auth, adminOnly, (req, res) => {
  queries.deleteUser(req.params.id); res.json({ success: true });
});

// ── Owner: get own riders ────────────────────────────────────────────────────
router.get('/riders', auth, ownerOrAdmin, (req, res) => {
  if (req.user.role === 'admin') return res.json(queries.getAllRiders());
  res.json(queries.getRidersByOwner(req.user.id));
});

// ── Owner: create rider (max 5) ──────────────────────────────────────────────
router.post('/riders', auth, ownerOrAdmin, (req, res) => {
  const owner_id = req.user.role === 'admin' ? req.body.owner_id : req.user.id;
  if (!owner_id) return res.status(400).json({ error: 'owner_id required' });
  const count = queries.countRidersByOwner(owner_id);
  if (count >= 5) return res.status(400).json({ error: 'Maximum 5 riders per route owner' });
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Name, email and password required' });
  try {
    const hash = bcrypt.hashSync(password, 10);
    const user = queries.createUser(name, email.toLowerCase().trim(), hash, 'rider', { owner_id: Number(owner_id), city: '', phone: '' });
    res.status(201).json({ id: user.id, name, email, role: 'rider', owner_id });
  } catch (e) {
    if (e.message === 'EMAIL_EXISTS') return res.status(409).json({ error: 'Email already exists' });
    res.status(500).json({ error: e.message });
  }
});

// ── Owner: update / delete rider ─────────────────────────────────────────────
router.put('/riders/:id', auth, ownerOrAdmin, (req, res) => {
  const { name, email } = req.body;
  res.json(queries.updateUser(req.params.id, { name, email }));
});
router.delete('/riders/:id', auth, ownerOrAdmin, (req, res) => {
  queries.deleteUser(req.params.id); res.json({ success: true });
});

// ── Owner: riders by owner (admin view) ──────────────────────────────────────
router.get('/owners/:id/riders', auth, adminOnly, (req, res) => {
  res.json(queries.getRidersByOwner(req.params.id));
});

module.exports = router;
