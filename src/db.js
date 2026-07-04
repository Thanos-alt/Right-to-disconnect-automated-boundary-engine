const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');
const bcrypt = require('bcryptjs');

const dbPath = path.resolve(__dirname, '..', 'data.db');

async function initDb() {
  const SQL = await initSqlJs({ locateFile: file => require('path').resolve(__dirname, '..', 'node_modules', 'sql.js', 'dist', file) });
  let db;
  if (fs.existsSync(dbPath)) {
    const filebuffer = fs.readFileSync(dbPath);
    db = new SQL.Database(filebuffer);
  } else {
    db = new SQL.Database();
    createSchema(db);
    saveDb(db);
  }
  return db;
}

function createSchema(db) {
  db.run(`
    CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin','employee')),
      shiftStart TEXT NOT NULL DEFAULT '09:00',
      shiftEnd TEXT NOT NULL DEFAULT '18:00',
      paidLeaveBalance INTEGER NOT NULL DEFAULT 12,
      sickLeaveBalance INTEGER NOT NULL DEFAULT 8
    );

    CREATE TABLE attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      date TEXT NOT NULL,
      checkIn TEXT,
      checkOut TEXT,
      status TEXT NOT NULL CHECK(status IN ('Present','Absent','Half-day','Leave')),
      FOREIGN KEY(userId) REFERENCES users(id)
    );

    CREATE TABLE leaves (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      startDate TEXT NOT NULL,
      endDate TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('Paid','Sick','Unpaid')),
      reason TEXT,
      status TEXT NOT NULL CHECK(status IN ('Pending','Approved','Rejected')),
      requestedAt TEXT NOT NULL,
      approvedAt TEXT,
      approvedBy INTEGER,
      FOREIGN KEY(userId) REFERENCES users(id),
      FOREIGN KEY(approvedBy) REFERENCES users(id)
    );

    CREATE TABLE queued_actions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      targetUserId INTEGER NOT NULL,
      actionType TEXT NOT NULL,
      payload TEXT NOT NULL,
      requestedBy INTEGER NOT NULL,
      requestedAt TEXT NOT NULL,
      deliverAt TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('Queued','Delivered','Cancelled')),
      FOREIGN KEY(targetUserId) REFERENCES users(id),
      FOREIGN KEY(requestedBy) REFERENCES users(id)
    );

    CREATE TABLE compliance_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      action TEXT NOT NULL,
      actionAt TEXT NOT NULL,
      allowedAt TEXT NOT NULL,
      outsideShift INTEGER NOT NULL CHECK(outsideShift IN (0,1)),
      FOREIGN KEY(userId) REFERENCES users(id)
    );
  `);

  const salt = bcrypt.genSaltSync(10);
  const adminPassword = bcrypt.hashSync('admin123', salt);
  const employeePassword = bcrypt.hashSync('employee123', salt);

  db.run(`INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?);`, ['Admin User', 'admin@boundaryhrms.com', adminPassword, 'admin']);
  db.run(`INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?);`, ['Employee User', 'employee@boundaryhrms.com', employeePassword, 'employee']);
}

function saveDb(db) {
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbPath, buffer);
}

module.exports = async function getDb() {
  if (!global.boundaryDb) {
    global.boundaryDb = await initDb();
  }
  return global.boundaryDb;
};
