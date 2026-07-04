const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
(async () => {
  const SQL = await initSqlJs({ locateFile: file => path.resolve(__dirname, 'node_modules', 'sql.js', 'dist', file) });
  const dbFile = path.resolve(__dirname, 'data.db');
  const buffer = fs.readFileSync(dbFile);
  const db = new SQL.Database(buffer);
  const result = db.exec('SELECT id, name, email, role, shiftStart, shiftEnd, paidLeaveBalance, sickLeaveBalance FROM users');
  console.log(JSON.stringify(result, null, 2));
})();
