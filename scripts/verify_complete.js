const base = process.env.BASE_URL || 'http://localhost:4002';

async function request(path, options = {}) {
  const url = `${base}${path}`;
  const res = await fetch(url, options);
  const contentType = res.headers.get('content-type') || '';
  let body = null;
  if (contentType.includes('application/json')) {
    body = await res.json().catch(() => null);
  } else {
    body = await res.text().catch(() => null);
  }
  return { res, body, contentType };
}

function parseSqlResult(resultArray) {
  if (!Array.isArray(resultArray) || resultArray.length === 0) return [];
  const first = resultArray[0];
  if (!first || !Array.isArray(first.columns) || !Array.isArray(first.values)) return [];
  return first.values.map(row => {
    const obj = {};
    first.columns.forEach((col, idx) => {
      obj[col] = row[idx];
    });
    return obj;
  });
}

async function login(email, password) {
  const { res, body } = await request('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  return { res, body, cookie: res.headers.get('set-cookie')?.split(';')[0] || '' };
}

function assert(condition, code, message) {
  if (!condition) {
    console.error(`FAIL [${code}] ${message}`);
    process.exitCode = code;
    throw new Error(message);
  }
}

(async () => {
  console.log('Running full verification on', base);

  const root = await request('/');
  assert(root.res.status === 200, 1, `Root page failed (${root.res.status})`);
  assert(typeof root.body === 'string' && root.body.includes('Antigravity HRMS'), 2, 'Root page HTML missing expected content');
  console.log('Root SPA loaded.');

  const appJs = await request('/app.js');
  assert(appJs.res.status === 200, 3, `app.js fetch failed (${appJs.res.status})`);
  assert(typeof appJs.body === 'string' && appJs.body.includes('switchTab'), 4, 'app.js content check failed');
  console.log('Frontend JS asset loaded.');

  const invalidLogin = await request('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'invalid@example.com', password: 'wrongpass' })
  });
  assert(invalidLogin.res.status === 401, 5, 'Invalid login did not return 401');
  console.log('Invalid login rejected.');

  const admin = await login('admin@boundaryhrms.com', 'admin123');
  assert(admin.res.status === 200 && admin.body.user?.role === 'admin', 6, 'Admin login failed');
  console.log('Admin login success.');

  const employee = await login('employee@boundaryhrms.com', 'employee123');
  assert(employee.res.status === 200 && employee.body.user?.role === 'employee', 7, 'Employee login failed');
  console.log('Employee login success.');

  const adminMe = await request('/api/me', { headers: { cookie: admin.cookie } });
  assert(adminMe.res.status === 200 && adminMe.body.user?.role === 'admin', 8, '/api/me admin failed');
  const employeeMe = await request('/api/me', { headers: { cookie: employee.cookie } });
  assert(employeeMe.res.status === 200 && employeeMe.body.user?.role === 'employee', 9, '/api/me employee failed');
  console.log('/api/me OK for both roles.');

  const adminAnalytics = await request('/api/dashboard/analytics', { headers: { cookie: admin.cookie } });
  assert(adminAnalytics.res.status === 200 && Array.isArray(adminAnalytics.body.attendance?.labels), 10, 'Admin analytics failed');
  const empAnalytics = await request('/api/dashboard/analytics', { headers: { cookie: employee.cookie } });
  assert(empAnalytics.res.status === 200 && Array.isArray(empAnalytics.body.attendance?.labels), 11, 'Employee analytics failed');
  console.log('Dashboard analytics OK.');

  const adminAttendance = await request('/api/attendance', { headers: { cookie: admin.cookie } });
  assert(adminAttendance.res.status === 200 && Array.isArray(parseSqlResult(adminAttendance.body.attendance)), 12, 'Admin attendance failed');
  const empAttendance = await request('/api/attendance', { headers: { cookie: employee.cookie } });
  assert(empAttendance.res.status === 200 && Array.isArray(parseSqlResult(empAttendance.body.attendance)), 13, 'Employee attendance failed');
  console.log('Attendance endpoints OK.');

  const adminLeaves = await request('/api/leaves', { headers: { cookie: admin.cookie } });
  assert(adminLeaves.res.status === 200 && Array.isArray(parseSqlResult(adminLeaves.body.leaves)), 14, 'Admin leaves fetch failed');
  const empLeaves = await request('/api/leaves', { headers: { cookie: employee.cookie } });
  assert(empLeaves.res.status === 200 && Array.isArray(parseSqlResult(empLeaves.body.leaves)), 15, 'Employee leaves fetch failed');
  console.log('Leaves listing OK.');

  const pendingLeaveResp = await request('/api/leaves/apply', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', cookie: employee.cookie },
    body: JSON.stringify({ startDate: '2026-12-01', endDate: '2026-12-02', type: 'Paid', reason: 'Complete verification leave' })
  });
  assert(pendingLeaveResp.res.status === 200, 16, 'Employee leave apply failed');
  console.log('Employee leave applied.');

  const updatedAdminLeaves = await request('/api/leaves', { headers: { cookie: admin.cookie } });
  const adminLeavesArray = parseSqlResult(updatedAdminLeaves.body.leaves);
  const newLeave = adminLeavesArray.find(l => l.reason === 'Complete verification leave' && l.status === 'Pending');
  assert(newLeave, 17, 'New pending leave not found for admin');
  console.log('Pending leave entry found.');

  const approveResp = await request(`/api/admin/leaves/${newLeave.id}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', cookie: admin.cookie },
    body: JSON.stringify({ emergencyBypass: false })
  });
  assert(approveResp.res.status === 200, 18, 'Leave approval endpoint failed');
  console.log('Leave approval endpoint OK.');

  if (approveResp.body.message?.includes('queued')) {
    const simulateResp = await request('/api/admin/compliance/simulate', {
      method: 'POST',
      headers: { cookie: admin.cookie }
    });
    assert(simulateResp.res.status === 200, 19, 'Queue simulation failed');
    console.log('Queued approval simulation processed.');
  }

  const adminEmployees = await request('/api/admin/employees', { headers: { cookie: admin.cookie } });
  assert(adminEmployees.res.status === 200 && Array.isArray(adminEmployees.body.employees), 20, '/api/admin/employees failed');
  console.log('Admin employees endpoint OK.');

  const importEmail = `imported-${Date.now()}@boundaryhrms.com`;
  const importCsv = `name,email,role,password,shiftStart,shiftEnd,paidLeaveBalance,sickLeaveBalance\nImported User,${importEmail},employee,imported123,09:00,18:00,10,5`;
  const importResp = await request('/api/admin/import/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', cookie: admin.cookie },
    body: JSON.stringify({ csv: importCsv })
  });
  assert(importResp.res.status === 200 && importResp.body.report?.added >= 1, 21, 'Import users failed');
  console.log('Admin import users endpoint OK.');

  const employeesAfterImport = await request('/api/admin/employees', { headers: { cookie: admin.cookie } });
  const importedUser = employeesAfterImport.body.employees.find(u => u.email === importEmail);
  assert(importedUser, 22, 'Imported user not found in employees list');
  console.log('Imported employee appears in listing.');

  const updateResp = await request('/api/admin/employees/update', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', cookie: admin.cookie },
    body: JSON.stringify({ userId: importedUser.id, shiftStart: '10:00', shiftEnd: '19:00', paidLeaveBalance: 14, sickLeaveBalance: 9 })
  });
  assert(updateResp.res.status === 200, 23, 'Admin employee update failed');
  console.log('Admin employee update endpoint OK.');

  const exportEmployees = await request('/api/admin/export/employees', { headers: { cookie: admin.cookie } });
  assert(exportEmployees.res.status === 200 && typeof exportEmployees.body === 'string' && exportEmployees.body.includes('email'), 24, 'Export employees failed');
  console.log('Employees export OK.');

  const exportAttendance = await request('/api/admin/export/attendance', { headers: { cookie: admin.cookie } });
  assert(exportAttendance.res.status === 200 && exportAttendance.body.includes('id,'), 25, 'Export attendance failed');
  const exportLeaves = await request('/api/admin/export/leaves', { headers: { cookie: admin.cookie } });
  assert(exportLeaves.res.status === 200 && exportLeaves.body.includes('id,'), 26, 'Export leaves failed');
  const exportCompliance = await request('/api/admin/export/compliance', { headers: { cookie: admin.cookie } });
  assert(exportCompliance.res.status === 200 && exportCompliance.body.includes('id,'), 27, 'Export compliance failed');
  console.log('CSV export endpoints OK.');

  const complianceResp = await request('/api/admin/compliance', { headers: { cookie: admin.cookie } });
  assert(complianceResp.res.status === 200 && typeof complianceResp.body.score === 'number', 28, 'Admin compliance endpoint failed');
  console.log('Admin compliance endpoint OK.');

  const queueProcessResp = await request('/api/admin/queued-actions/process', {
    method: 'POST',
    headers: { cookie: admin.cookie }
  });
  assert(queueProcessResp.res.status === 200, 29, 'Queued actions process endpoint failed');
  console.log('Queued actions process endpoint OK.');

  const logoutResp = await request('/api/logout', { method: 'POST', headers: { cookie: admin.cookie } });
  assert(logoutResp.res.status === 200, 30, 'Logout failed');
  console.log('Logout endpoint OK.');

  console.log('Full verification passed. All remaining steps completed.');
  process.exitCode = 0;
})().catch(() => {
  process.exit(process.exitCode || 1);
});