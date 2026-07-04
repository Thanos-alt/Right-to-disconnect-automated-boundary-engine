const express = require('express');
const bcrypt = require('bcryptjs');
const dbPromise = require('./db');

const router = express.Router();
const csvUtils = require('./csv-utils');

function saveDb(db) {
  const fs = require('fs');
  const path = require('path');
  const dbPath = path.resolve(__dirname, '..', 'data.db');
  const data = db.export();
  fs.writeFileSync(dbPath, Buffer.from(data));
}

function currentDate() {
  return new Date().toISOString().slice(0, 10);
}

function currentTime() {
  return new Date().toISOString().slice(11, 16);
}

function isOutsideShift(shiftStart, shiftEnd, time) {
  if (!shiftStart || !shiftEnd || !time) return false;
  return time < shiftStart || time > shiftEnd;
}

function applyLeaveApproval(db, leave, adminId) {
  const start = new Date(leave.startDate);
  const end = new Date(leave.endDate);
  const diffDays = Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;

  if (leave.type === 'Paid') {
    db.run('UPDATE users SET paidLeaveBalance = MAX(0, paidLeaveBalance - ?) WHERE id = ?', [diffDays, leave.userId]);
  } else if (leave.type === 'Sick') {
    db.run('UPDATE users SET sickLeaveBalance = MAX(0, sickLeaveBalance - ?) WHERE id = ?', [diffDays, leave.userId]);
  }

  db.run('UPDATE leaves SET status = ?, approvedAt = ?, approvedBy = ? WHERE id = ?', ['Approved', new Date().toISOString(), adminId, leave.id]);

  let curr = new Date(leave.startDate);
  const endDateObj = new Date(leave.endDate);
  while (curr <= endDateObj) {
    const dateStr = curr.toISOString().slice(0, 10);
    const checkStmt = db.prepare('SELECT id FROM attendance WHERE userId = ? AND date = ?');
    checkStmt.bind([leave.userId, dateStr]);
    let attendanceRow = null;
    if (checkStmt.step()) {
      attendanceRow = checkStmt.getAsObject();
    }
    checkStmt.free();

    if (attendanceRow && attendanceRow.id) {
      db.run("UPDATE attendance SET status = 'Leave' WHERE id = ?", [attendanceRow.id]);
    } else {
      db.run("INSERT INTO attendance (userId, date, status) VALUES (?, ?, 'Leave')", [leave.userId, dateStr]);
    }
    curr.setDate(curr.getDate() + 1);
  }
}

async function getUserByEmail(db, email) {
  const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
  stmt.bind([email]);
  let row = null;
  if (stmt.step()) {
    row = stmt.getAsObject();
  }
  stmt.free();
  return row && row.id ? row : null;
}

async function getUserById(db, id) {
  const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
  stmt.bind([id]);
  let row = null;
  if (stmt.step()) {
    row = stmt.getAsObject();
  }
  stmt.free();
  return row && row.id ? row : null;
}

router.post('/signup', async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'All fields (name, email, password, role) are required' });
  }

  // Email regex validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  // Password validation
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long' });
  }

  if (!['admin', 'employee'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role selection' });
  }

  const db = await dbPromise();
  const existing = await getUserByEmail(db, email);
  if (existing) {
    return res.status(400).json({ error: 'Email is already registered' });
  }

  const salt = bcrypt.genSaltSync(10);
  const hashedPassword = bcrypt.hashSync(password, salt);

  try {
    db.run('INSERT INTO users (name, email, password, role, shiftStart, shiftEnd, paidLeaveBalance, sickLeaveBalance) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [name, email, hashedPassword, role, '09:00', '18:00', 12, 8]);
    saveDb(db);
    res.json({ message: 'User registered successfully. You can now log in.' });
  } catch (err) {
    res.status(500).json({ error: 'Database error occurred during registration' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const db = await dbPromise();
  const user = await getUserByEmail(db, email);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  if (!bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  req.session.userId = user.id;
  res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

router.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) return res.status(500).json({ error: 'Logout failed' });
    res.json({ message: 'Logged out' });
  });
});

router.use(async (req, res, next) => {
  const db = await dbPromise();
  if (!req.session.userId) return res.status(401).json({ error: 'Unauthorized' });
  req.user = await getUserById(db, req.session.userId);
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  next();
});

router.get('/me', async (req, res) => {
  res.json({ user: { id: req.user.id, name: req.user.name, email: req.user.email, role: req.user.role, shiftStart: req.user.shiftStart, shiftEnd: req.user.shiftEnd } });
});

router.post('/attendance/checkin', async (req, res) => {
  const db = await dbPromise();
  const date = currentDate();
  const time = currentTime();
  const existingStmt = db.prepare('SELECT * FROM attendance WHERE userId = ? AND date = ?');
  existingStmt.bind([req.user.id, date]);
  let attendance = null;
  if (existingStmt.step()) {
    attendance = existingStmt.getAsObject();
  }
  existingStmt.free();

  if (attendance && attendance.id) {
    return res.status(400).json({ error: 'Already checked in today' });
  }

  const status = isOutsideShift(req.user.shiftStart, req.user.shiftEnd, time) ? 'Present' : 'Present';
  db.run('INSERT INTO attendance (userId, date, checkIn, status) VALUES (?, ?, ?, ?)', [req.user.id, date, time, status]);
  saveDb(db);
  res.json({ message: 'Checked in', date, checkIn: time });
});

router.post('/attendance/checkout', async (req, res) => {
  const db = await dbPromise();
  const date = currentDate();
  const time = currentTime();
  const stmt = db.prepare('SELECT * FROM attendance WHERE userId = ? AND date = ?');
  stmt.bind([req.user.id, date]);
  let attendance = null;
  if (stmt.step()) {
    attendance = stmt.getAsObject();
  }
  stmt.free();

  if (!attendance || !attendance.id) return res.status(400).json({ error: 'No check-in found for today' });
  if (attendance.checkOut) return res.status(400).json({ error: 'Already checked out today' });

  db.run('UPDATE attendance SET checkOut = ?, status = ? WHERE id = ?', [time, 'Present', attendance.id]);
  saveDb(db);
  res.json({ message: 'Checked out', date, checkOut: time });
});

router.get('/attendance', async (req, res) => {
  const db = await dbPromise();
  let rows;
  if (req.user.role === 'admin') {
    rows = db.exec('SELECT * FROM attendance ORDER BY date DESC');
  } else {
    const stmt = db.prepare('SELECT * FROM attendance WHERE userId = ? ORDER BY date DESC');
    stmt.bind([req.user.id]);
    rows = [{ columns: stmt.getColumnNames(), values: [] }];
    while (stmt.step()) {
      const row = stmt.getAsObject();
      rows[0].values.push([row.id, row.userId, row.date, row.checkIn, row.checkOut, row.status]);
    }
    stmt.free();
  }
  res.json({ attendance: rows });
});

router.post('/leaves/apply', async (req, res) => {
  const { startDate, endDate, type, reason } = req.body;
  if (!startDate || !endDate || !type) return res.status(400).json({ error: 'Start date, end date, and type are required' });

  const start = new Date(startDate);
  const end = new Date(endDate);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return res.status(400).json({ error: 'Invalid date format' });
  }

  if (end < start) return res.status(400).json({ error: 'End date cannot be before start date' });
  if (!['Paid', 'Sick', 'Unpaid'].includes(type)) return res.status(400).json({ error: 'Invalid leave type' });

  const diffDays = Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;

  if (type === 'Paid' && diffDays > req.user.paidLeaveBalance) {
    return res.status(400).json({ error: `Insufficient paid leave balance. Remaining: ${req.user.paidLeaveBalance}, Requested: ${diffDays} days` });
  }
  if (type === 'Sick' && diffDays > req.user.sickLeaveBalance) {
    return res.status(400).json({ error: `Insufficient sick leave balance. Remaining: ${req.user.sickLeaveBalance}, Requested: ${diffDays} days` });
  }

  const db = await dbPromise();
  db.run('INSERT INTO leaves (userId, startDate, endDate, type, reason, status, requestedAt) VALUES (?, ?, ?, ?, ?, ?, ?)', [req.user.id, startDate, endDate, type, reason || '', 'Pending', new Date().toISOString()]);
  saveDb(db);
  res.json({ message: 'Leave request submitted' });
});

router.get('/leaves', async (req, res) => {
  const db = await dbPromise();
  let rows;
  if (req.user.role === 'admin') {
    rows = db.exec('SELECT * FROM leaves ORDER BY requestedAt DESC');
  } else {
    const stmt = db.prepare('SELECT * FROM leaves WHERE userId = ? ORDER BY requestedAt DESC');
    stmt.bind([req.user.id]);
    rows = [{ columns: stmt.getColumnNames(), values: [] }];
    while (stmt.step()) {
      const row = stmt.getAsObject();
      rows[0].values.push([row.id, row.userId, row.startDate, row.endDate, row.type, row.reason, row.status, row.requestedAt, row.approvedAt, row.approvedBy]);
    }
    stmt.free();
  }
  res.json({ leaves: rows });
});

router.post('/admin/leaves/:id/approve', async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  const leaveId = Number(req.params.id);
  const db = await dbPromise();
  const stmt = db.prepare('SELECT * FROM leaves WHERE id = ?');
  stmt.bind([leaveId]);
  let leave = null;
  if (stmt.step()) {
    leave = stmt.getAsObject();
  }
  stmt.free();

  if (!leave || !leave.id) return res.status(404).json({ error: 'Leave not found' });
  if (leave.status !== 'Pending') return res.status(400).json({ error: 'Leave already processed' });

  const targetUserStmt = db.prepare('SELECT * FROM users WHERE id = ?');
  targetUserStmt.bind([leave.userId]);
  let targetUser = null;
  if (targetUserStmt.step()) {
    targetUser = targetUserStmt.getAsObject();
  }
  targetUserStmt.free();

  const time = currentTime();
  const outside = isOutsideShift(targetUser.shiftStart, targetUser.shiftEnd, time);
  const bypass = req.body.emergencyBypass || false;

  if (outside && !bypass) {
    const deliverAt = `${currentDate()} ${targetUser.shiftStart}`;
    db.run('INSERT INTO queued_actions (targetUserId, actionType, payload, requestedBy, requestedAt, deliverAt, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [targetUser.id, 'approve_leave', JSON.stringify({ leaveId }), req.user.id, new Date().toISOString(), deliverAt, 'Queued']);
    db.run('INSERT INTO compliance_logs (userId, action, actionAt, allowedAt, outsideShift) VALUES (?, ?, ?, ?, ?)',
      [targetUser.id, `Queued leave approval ${leaveId}`, new Date().toISOString(), `${currentDate()} ${targetUser.shiftStart}`, 1]);
    saveDb(db);
    return res.json({ message: 'Leave approval queued until next shift start due to out-of-hours action.' });
  }

  applyLeaveApproval(db, leave, req.user.id);
  db.run('INSERT INTO compliance_logs (userId, action, actionAt, allowedAt, outsideShift) VALUES (?, ?, ?, ?, ?)',
    [targetUser.id, `Approved leave ${leaveId}${bypass ? ' (Emergency Bypass)' : ''}`, new Date().toISOString(), time, outside ? 1 : 0]);
  saveDb(db);
  res.json({ message: bypass ? 'Leave approved via Emergency Bypass.' : 'Leave approved' });
});

router.post('/admin/leaves/:id/reject', async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  const leaveId = Number(req.params.id);
  const db = await dbPromise();
  const stmt = db.prepare('SELECT * FROM leaves WHERE id = ?');
  stmt.bind([leaveId]);
  let leave = null;
  if (stmt.step()) {
    leave = stmt.getAsObject();
  }
  stmt.free();

  if (!leave || !leave.id) return res.status(404).json({ error: 'Leave not found' });
  if (leave.status !== 'Pending') return res.status(400).json({ error: 'Leave already processed' });

  const targetUserStmt = db.prepare('SELECT * FROM users WHERE id = ?');
  targetUserStmt.bind([leave.userId]);
  let targetUser = null;
  if (targetUserStmt.step()) {
    targetUser = targetUserStmt.getAsObject();
  }
  targetUserStmt.free();

  const time = currentTime();
  const outside = isOutsideShift(targetUser.shiftStart, targetUser.shiftEnd, time);
  const bypass = req.body.emergencyBypass || false;

  if (outside && !bypass) {
    const deliverAt = `${currentDate()} ${targetUser.shiftStart}`;
    db.run('INSERT INTO queued_actions (targetUserId, actionType, payload, requestedBy, requestedAt, deliverAt, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [targetUser.id, 'reject_leave', JSON.stringify({ leaveId }), req.user.id, new Date().toISOString(), deliverAt, 'Queued']);
    db.run('INSERT INTO compliance_logs (userId, action, actionAt, allowedAt, outsideShift) VALUES (?, ?, ?, ?, ?)',
      [targetUser.id, `Queued leave rejection ${leaveId}`, new Date().toISOString(), `${currentDate()} ${targetUser.shiftStart}`, 1]);
    saveDb(db);
    return res.json({ message: 'Leave rejection queued until next shift start due to out-of-hours action.' });
  }

  db.run("UPDATE leaves SET status = 'Rejected', approvedAt = ?, approvedBy = ? WHERE id = ?", [new Date().toISOString(), req.user.id, leaveId]);
  db.run('INSERT INTO compliance_logs (userId, action, actionAt, allowedAt, outsideShift) VALUES (?, ?, ?, ?, ?)',
    [targetUser.id, `Rejected leave ${leaveId}${bypass ? ' (Emergency Bypass)' : ''}`, new Date().toISOString(), time, outside ? 1 : 0]);
  saveDb(db);
  res.json({ message: bypass ? 'Leave rejected via Emergency Bypass.' : 'Leave rejected' });
});

router.get('/admin/employees', async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  const db = await dbPromise();
  const stmt = db.prepare('SELECT id, name, email, role, shiftStart, shiftEnd, paidLeaveBalance, sickLeaveBalance FROM users ORDER BY id ASC');
  const employees = [];
  while (stmt.step()) {
    employees.push(stmt.getAsObject());
  }
  stmt.free();
  res.json({ employees });
});

// CSV export endpoints
router.get('/admin/export/:what', async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  const what = req.params.what;
  const db = await dbPromise();
  try {
    if (what === 'attendance') {
      const execRes = db.exec('SELECT id, userId, date, checkIn, checkOut, status FROM attendance ORDER BY date DESC');
      const csv = csvUtils.toCsvFromExec(execRes[0] || { columns: [], values: [] });
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="attendance.csv"');
      return res.send(csv);
    } else if (what === 'leaves') {
      const execRes = db.exec('SELECT id, userId, startDate, endDate, type, reason, status, requestedAt, approvedAt, approvedBy FROM leaves ORDER BY requestedAt DESC');
      const csv = csvUtils.toCsvFromExec(execRes[0] || { columns: [], values: [] });
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="leaves.csv"');
      return res.send(csv);
    } else if (what === 'compliance') {
      const execRes = db.exec('SELECT id, userId, action, actionAt, allowedAt, outsideShift FROM compliance_logs ORDER BY actionAt DESC');
      const csv = csvUtils.toCsvFromExec(execRes[0] || { columns: [], values: [] });
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="compliance.csv"');
      return res.send(csv);
    } else if (what === 'employees') {
      const execRes = db.exec('SELECT id, name, email, role, shiftStart, shiftEnd, paidLeaveBalance, sickLeaveBalance FROM users ORDER BY id ASC');
      const csv = csvUtils.toCsvFromExec(execRes[0] || { columns: [], values: [] });
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="employees.csv"');
      return res.send(csv);
    }
    return res.status(400).json({ error: 'Unknown export target' });
  } catch (e) {
    return res.status(500).json({ error: 'Export failed' });
  }
});

// Simple admin CSV import endpoint - accepts JSON { csv: '...' }
router.post('/admin/import/users', async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  const { csv } = req.body;
  if (!csv) return res.status(400).json({ error: 'CSV content required in body as { csv: "..." }' });
  const rows = csvUtils.parseSimpleCsv(csv);
  const db = await dbPromise();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const salt = bcrypt.genSaltSync(10);
  const report = { added: 0, skipped: 0, errors: [] };
  const maxRows = 2000;
  if (!Array.isArray(rows) || rows.length === 0) return res.status(400).json({ error: 'No rows parsed from CSV' });
  if (rows.length > maxRows) return res.status(400).json({ error: `CSV too large; max ${maxRows} rows allowed` });

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const lineNo = i + 1;
    const name = (r.name || r.fullname || r.username || '').trim() || `User${Date.now()}${i}`;
    const email = (r.email || '').trim().toLowerCase();
    const role = (r.role || 'employee').trim().toLowerCase();
    const rawPassword = r.password && r.password.trim() ? r.password.trim() : 'employee123';

    if (!email || !emailRegex.test(email)) {
      report.skipped++;
      report.errors.push({ line: lineNo, reason: 'Invalid or missing email', row: r });
      continue;
    }
    if (!['admin', 'employee'].includes(role)) {
      report.skipped++;
      report.errors.push({ line: lineNo, reason: `Invalid role '${role}'`, row: r });
      continue;
    }

    const existingStmt = db.prepare('SELECT id FROM users WHERE email = ?');
    existingStmt.bind([email]);
    let exists = false;
    if (existingStmt.step()) exists = true;
    existingStmt.free();
    if (exists) {
      report.skipped++;
      report.errors.push({ line: lineNo, reason: 'Email already exists', email });
      continue;
    }

    const hashed = bcrypt.hashSync(rawPassword, salt);
    try {
      db.run('INSERT INTO users (name, email, password, role, shiftStart, shiftEnd, paidLeaveBalance, sickLeaveBalance) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [name, email, hashed, role === 'admin' ? 'admin' : 'employee', String(r.shiftStart || '09:00'), String(r.shiftEnd || '18:00'), Number(r.paidLeaveBalance || 12), Number(r.sickLeaveBalance || 8)]);
      report.added++;
    } catch (e) {
      report.skipped++;
      report.errors.push({ line: lineNo, reason: 'Database insert error', error: e && e.message });
    }
  }
  if (report.added > 0) saveDb(db);
  res.json({ message: `Imported ${report.added} users, skipped ${report.skipped}`, report });
});

router.post('/admin/employees/update', async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  const { userId, shiftStart, shiftEnd, paidLeaveBalance, sickLeaveBalance } = req.body;
  if (!userId || !shiftStart || !shiftEnd) {
    return res.status(400).json({ error: 'User ID, shift start, and shift end are required' });
  }

  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  if (!timeRegex.test(shiftStart) || !timeRegex.test(shiftEnd)) {
    return res.status(400).json({ error: 'Shift times must be in HH:MM format' });
  }

  const db = await dbPromise();
  db.run('UPDATE users SET shiftStart = ?, shiftEnd = ?, paidLeaveBalance = ?, sickLeaveBalance = ? WHERE id = ?',
    [shiftStart, shiftEnd, Number(paidLeaveBalance || 0), Number(sickLeaveBalance || 0), Number(userId)]);
  saveDb(db);
  res.json({ message: 'Employee configuration updated successfully' });
});

router.post('/admin/compliance/simulate', async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  const db = await dbPromise();

  const stmt = db.prepare("SELECT * FROM queued_actions WHERE status = 'Queued'");
  const actions = [];
  while (stmt.step()) {
    actions.push(stmt.getAsObject());
  }
  stmt.free();

  let processedCount = 0;
  for (const action of actions) {
    const payload = JSON.parse(action.payload);
    
    if (action.actionType === 'approve_leave') {
      const leaveStmt = db.prepare('SELECT * FROM leaves WHERE id = ?');
      leaveStmt.bind([payload.leaveId]);
      let leave = null;
      if (leaveStmt.step()) {
        leave = leaveStmt.getAsObject();
      }
      leaveStmt.free();

      if (leave && leave.id && leave.status === 'Pending') {
        applyLeaveApproval(db, leave, action.requestedBy);
        processedCount++;
      }
    } else if (action.actionType === 'reject_leave') {
      db.run("UPDATE leaves SET status = 'Rejected', approvedAt = ?, approvedBy = ? WHERE id = ?", [new Date().toISOString(), action.requestedBy, payload.leaveId]);
      processedCount++;
    }

    db.run("UPDATE queued_actions SET status = 'Delivered' WHERE id = ?", [action.id]);
    db.run('INSERT INTO compliance_logs (userId, action, actionAt, allowedAt, outsideShift) VALUES (?, ?, ?, ?, ?)',
      [action.targetUserId, `Delivered queued action: ${action.actionType}`, new Date().toISOString(), new Date().toISOString(), 0]);
  }

  if (processedCount > 0) {
    saveDb(db);
  }

  res.json({ message: `Successfully simulated shift start and delivered ${processedCount} queued action(s).` });
});

router.get('/admin/compliance', async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  const db = await dbPromise();
  const queued = db.exec('SELECT * FROM queued_actions ORDER BY requestedAt DESC');
  const logs = db.exec('SELECT * FROM compliance_logs ORDER BY actionAt DESC');
  const total = logs[0] ? logs[0].values.length : 0;
  const outside = logs[0] ? logs[0].values.filter(row => row[4] === 1).length : 0;
  const score = total ? Math.round(((total - outside) / total) * 100) : 100;
  res.json({ queued: queued[0] || { columns: [], values: [] }, logs: logs[0] || { columns: [], values: [] }, score });
});

// Dashboard analytics endpoint (admin or employee - scoped)
router.get('/dashboard/analytics', async (req, res) => {
  const db = await dbPromise();
  try {
    // Attendance trend - last 14 days
    const days = 14;
    const now = new Date();
    const labels = [];
    const attendanceCounts = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const ds = d.toISOString().slice(0, 10);
      labels.push(ds);
      const stmt = db.prepare('SELECT COUNT(*) as c FROM attendance WHERE date = ?');
      stmt.bind([ds]);
      let cnt = 0;
      if (stmt.step()) cnt = stmt.getAsObject().c || 0;
      stmt.free();
      attendanceCounts.push(cnt);
    }

    // Leave type breakdown (approved)
    const leaves = db.exec("SELECT type, COUNT(*) as cnt FROM leaves WHERE status = 'Approved' GROUP BY type");
    const leaveBreakdown = {};
    if (leaves && leaves[0]) {
      const cols = leaves[0].columns;
      leaves[0].values.forEach(r => {
        const obj = {};
        cols.forEach((c, i) => obj[c] = r[i]);
        leaveBreakdown[obj.type] = Number(obj.cnt);
      });
    }

    // Leave balances sample (for employees)
    let balances = [];
    if (req.user.role === 'admin') {
      const stmt = db.prepare('SELECT id, name, paidLeaveBalance, sickLeaveBalance FROM users ORDER BY id LIMIT 200');
      while (stmt.step()) balances.push(stmt.getAsObject());
      stmt.free();
    } else {
      balances = [{ id: req.user.id, name: req.user.name, paidLeaveBalance: req.user.paidLeaveBalance, sickLeaveBalance: req.user.sickLeaveBalance }];
    }

    res.json({ attendance: { labels, counts: attendanceCounts }, leaveBreakdown, balances });
  } catch (e) {
    res.status(500).json({ error: 'Failed to compute analytics' });
  }
});

module.exports = router;

// Background processing for queued actions (can be called by server)
async function processQueuedActions() {
  const db = await dbPromise();
  const now = new Date();
  const stmt = db.prepare("SELECT * FROM queued_actions WHERE status = 'Queued'");
  const actions = [];
  while (stmt.step()) actions.push(stmt.getAsObject());
  stmt.free();

  let processed = 0;
  for (const action of actions) {
    try {
      // parse deliverAt like 'YYYY-MM-DD HH:MM'
      const deliverAt = action.deliverAt;
      const deliverDate = new Date((deliverAt || '').replace(' ', 'T') + ':00');
      if (isNaN(deliverDate.getTime())) {
        // if invalid, treat as due
      }
      if (deliverDate > now) continue; // not yet due

      const payload = JSON.parse(action.payload);
      if (action.actionType === 'approve_leave') {
        const leaveStmt = db.prepare('SELECT * FROM leaves WHERE id = ?');
        leaveStmt.bind([payload.leaveId]);
        let leave = null;
        if (leaveStmt.step()) leave = leaveStmt.getAsObject();
        leaveStmt.free();
        if (leave && leave.id && leave.status === 'Pending') {
          applyLeaveApproval(db, leave, action.requestedBy);
          processed++;
        }
      } else if (action.actionType === 'reject_leave') {
        db.run("UPDATE leaves SET status = 'Rejected', approvedAt = ?, approvedBy = ? WHERE id = ?", [new Date().toISOString(), action.requestedBy, payload.leaveId]);
        processed++;
      }

      db.run("UPDATE queued_actions SET status = 'Delivered' WHERE id = ?", [action.id]);
      db.run('INSERT INTO compliance_logs (userId, action, actionAt, allowedAt, outsideShift) VALUES (?, ?, ?, ?, ?)',
        [action.targetUserId, `Delivered queued action: ${action.actionType}`, new Date().toISOString(), new Date().toISOString(), 0]);
    } catch (e) {
      // ignore individual action errors and continue
      console.error('Error processing queued action', action.id, e && e.message);
    }
  }

  if (processed > 0) saveDb(db);
  return processed;
}

// attach to exported router for server use
module.exports.processQueuedActions = processQueuedActions;
