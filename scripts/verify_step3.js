const base = process.env.BASE_URL || 'http://localhost:4002';

async function request(path, options = {}) {
  const url = `${base}${path}`;
  const res = await fetch(url, options);
  let body;
  const contentType = res.headers.get('content-type') || '';
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
  return { res, body, cookie: res.headers.get('set-cookie')?.split(';')[0] };
}

(async () => {
  console.log('Running Step 3 verification on', base);

  const root = await request('/');
  if (root.res.status !== 200 || typeof root.body !== 'string' || !root.body.includes('Antigravity HRMS')) {
    console.error('Root page fetch failed or missing expected HTML content', root.res.status, root.contentType);
    process.exitCode = 1;
    return;
  }
  console.log('Root SPA loaded successfully.');

  const appJs = await request('/app.js');
  if (appJs.res.status !== 200 || typeof appJs.body !== 'string' || !appJs.body.includes('switchTab')) {
    console.error('app.js fetch failed or content missing', appJs.res.status, appJs.contentType);
    process.exitCode = 2;
    return;
  }
  console.log('Frontend JS asset loaded.');

  const admin = await login('admin@boundaryhrms.com', 'admin123');
  if (admin.res.status !== 200) {
    console.error('Admin login failed', admin.res.status, admin.body);
    process.exitCode = 3;
    return;
  }
  console.log('Admin login success.');

  const employee = await login('employee@boundaryhrms.com', 'employee123');
  if (employee.res.status !== 200) {
    console.error('Employee login failed', employee.res.status, employee.body);
    process.exitCode = 4;
    return;
  }
  console.log('Employee login success.');

  const adminMe = await request('/api/me', { headers: { cookie: admin.cookie } });
  if (adminMe.res.status !== 200 || adminMe.body.user?.role !== 'admin') {
    console.error('Admin /api/me failed', adminMe.res.status, adminMe.body);
    process.exitCode = 5;
    return;
  }

  const employeeMe = await request('/api/me', { headers: { cookie: employee.cookie } });
  if (employeeMe.res.status !== 200 || employeeMe.body.user?.role !== 'employee') {
    console.error('Employee /api/me failed', employeeMe.res.status, employeeMe.body);
    process.exitCode = 6;
    return;
  }

  const adminAnalytics = await request('/api/dashboard/analytics', { headers: { cookie: admin.cookie } });
  if (adminAnalytics.res.status !== 200 || !Array.isArray(adminAnalytics.body.attendance?.labels)) {
    console.error('Admin analytics failed', adminAnalytics.res.status, adminAnalytics.body);
    process.exitCode = 7;
    return;
  }
  console.log('Admin analytics OK.');

  const empAnalytics = await request('/api/dashboard/analytics', { headers: { cookie: employee.cookie } });
  if (empAnalytics.res.status !== 200 || !Array.isArray(empAnalytics.body.attendance?.labels)) {
    console.error('Employee analytics failed', empAnalytics.res.status, empAnalytics.body);
    process.exitCode = 8;
    return;
  }
  console.log('Employee analytics OK.');

  const attAdmin = await request('/api/attendance', { headers: { cookie: admin.cookie } });
  if (attAdmin.res.status !== 200 || !Array.isArray(parseSqlResult(attAdmin.body.attendance))) {
    console.error('Admin attendance fetch failed', attAdmin.res.status, attAdmin.body);
    process.exitCode = 9;
    return;
  }
  console.log('Admin attendance endpoint OK.');

  const attEmp = await request('/api/attendance', { headers: { cookie: employee.cookie } });
  if (attEmp.res.status !== 200 || !Array.isArray(parseSqlResult(attEmp.body.attendance))) {
    console.error('Employee attendance fetch failed', attEmp.res.status, attEmp.body);
    process.exitCode = 10;
    return;
  }
  console.log('Employee attendance endpoint OK.');

  const leavesAdmin = await request('/api/leaves', { headers: { cookie: admin.cookie } });
  if (leavesAdmin.res.status !== 200 || !Array.isArray(parseSqlResult(leavesAdmin.body.leaves))) {
    console.error('Admin leaves fetch failed', leavesAdmin.res.status, leavesAdmin.body);
    process.exitCode = 11;
    return;
  }
  console.log('Admin leaves endpoint OK.');

  const leavesEmp = await request('/api/leaves', { headers: { cookie: employee.cookie } });
  if (leavesEmp.res.status !== 200 || !Array.isArray(parseSqlResult(leavesEmp.body.leaves))) {
    console.error('Employee leaves fetch failed', leavesEmp.res.status, leavesEmp.body);
    process.exitCode = 12;
    return;
  }
  console.log('Employee leaves endpoint OK.');

  const empList = await request('/api/admin/employees', { headers: { cookie: admin.cookie } });
  if (empList.res.status !== 200 || !Array.isArray(empList.body.employees)) {
    console.error('Admin employees endpoint failed', empList.res.status, empList.body);
    process.exitCode = 13;
    return;
  }
  console.log('Admin employees endpoint OK.');

  const compliance = await request('/api/admin/compliance', { headers: { cookie: admin.cookie } });
  if (compliance.res.status !== 200 || !compliance.body.score) {
    console.error('Admin compliance endpoint failed', compliance.res.status, compliance.body);
    process.exitCode = 14;
    return;
  }
  console.log('Admin compliance endpoint OK.');

  const exportEmployees = await request('/api/admin/export/employees', { headers: { cookie: admin.cookie } });
  if (exportEmployees.res.status !== 200 || typeof exportEmployees.body !== 'string' || !exportEmployees.body.includes('email')) {
    console.error('Employees export failed', exportEmployees.res.status, exportEmployees.body);
    process.exitCode = 15;
    return;
  }
  console.log('Employees CSV export OK.');

  console.log('Step 3 verification passed: UI/dashboard APIs are healthy.');
  process.exitCode = 0;
})();