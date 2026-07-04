const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

// Load the project's DB initializer
const getDb = require('../src/db');

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function fmtDate(d) {
  return d.toISOString().slice(0, 10);
}

function randomTimeAround(hourStart, hourEnd) {
  const h = randInt(parseInt(hourStart, 10), parseInt(hourEnd, 10));
  const m = randInt(0, 59);
  return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
}

async function main() {
  const args = process.argv.slice(2);
  const usersCount = parseInt((args.find(a => a.startsWith('--users=')) || '--users=20').split('=')[1], 10);
  const days = parseInt((args.find(a => a.startsWith('--days=')) || '--days=30').split('=')[1], 10);

  const db = await getDb();

  console.log('Seeding demo data: users=', usersCount, 'days=', days);

  // Simple name/email generator
  const names = ['Aarav','Vivaan','Adya','Ishaan','Diya','Rohan','Sahana','Karan','Nisha','Priyanka','Rahul','Sneha','Arjun','Kriti','Siddharth','Neha','Tanvi','Mayank','Ritu','Dev'];

  // Hash password once
  const salt = bcrypt.genSaltSync(10);
  const hashed = bcrypt.hashSync('employee123', salt);

  // Insert demo users
  for (let i = 0; i < usersCount; i++) {
    const name = names[i % names.length] + (i >= names.length ? ('_' + (i+1)) : '');
    const email = `${name.toLowerCase().replace(/[^a-z0-9]/g,'')}${i}@demo.local`;
    try {
      db.run(`INSERT INTO users (name, email, password, role, shiftStart, shiftEnd, paidLeaveBalance, sickLeaveBalance) VALUES (?, ?, ?, 'employee', '09:00', '18:00', ?, ?);`, [name, email, hashed, 12, 8]);
    } catch (e) {
      // ignore unique errors
    }
  }

  // Pull all user ids
  const stmtUsers = db.prepare('SELECT id, shiftStart, shiftEnd FROM users WHERE role = "employee";');
  const userRows = [];
  while (stmtUsers.step()) userRows.push(stmtUsers.getAsObject());
  stmtUsers.free && stmtUsers.free();

  // Seed attendance for each day for the last `days`
  const now = new Date();
  for (let d = 0; d < days; d++) {
    const date = new Date(now);
    date.setDate(now.getDate() - d);
    const dateStr = fmtDate(date);

    userRows.forEach(u => {
      // random attendance outcome
      const outcomeRoll = Math.random();
      let status = 'Present';
      let checkIn = null;
      let checkOut = null;
      if (outcomeRoll < 0.05) {
        status = 'Absent';
      } else if (outcomeRoll < 0.12) {
        status = 'Half-day';
        checkIn = randomTimeAround(u.shiftStart.split(':')[0], u.shiftStart.split(':')[0]);
        checkOut = randomTimeAround(u.shiftEnd.split(':')[0], u.shiftEnd.split(':')[0]);
      } else if (outcomeRoll < 0.18) {
        status = 'Leave';
      } else {
        checkIn = randomTimeAround(u.shiftStart.split(':')[0], String(parseInt(u.shiftStart.split(':')[0],10)+1));
        checkOut = randomTimeAround(String(parseInt(u.shiftEnd.split(':')[0],10)-1), u.shiftEnd.split(':')[0]);
      }

      try {
        db.run(`INSERT INTO attendance (userId, date, checkIn, checkOut, status) VALUES (?, ?, ?, ?, ?);`, [u.id, dateStr, checkIn, checkOut, status]);
      } catch (e) {
        // ignore
      }
    });
  }

  // Seed some leaves
  userRows.slice(0, Math.min(5, userRows.length)).forEach((u, idx) => {
    const start = new Date();
    start.setDate(start.getDate() - randInt(3, 20));
    const end = new Date(start);
    end.setDate(start.getDate() + randInt(0, 3));
    db.run(`INSERT INTO leaves (userId, startDate, endDate, type, reason, status, requestedAt) VALUES (?, ?, ?, 'Paid', ?, 'Approved', ?);`, [u.id, fmtDate(start), fmtDate(end), 'Demo leave', fmtDate(new Date())]);
  });

  // Export DB to disk
  const data = db.export();
  const outPath = path.resolve(__dirname, '..', 'data.db');
  fs.writeFileSync(outPath, Buffer.from(data));

  console.log('Demo data seeded to', outPath);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
