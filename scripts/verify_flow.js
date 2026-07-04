const base = process.env.BASE_URL || 'http://localhost:4002';

async function requestJson(path, options = {}) {
  const url = `${base}${path}`;
  const response = await fetch(url, options);
  let body = null;
  try {
    body = await response.json();
  } catch (e) {
    body = null;
  }
  return { res: response, body };
}

async function login(email, password) {
  const { res, body } = await requestJson('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  return { res, body, cookie: res.headers.get('set-cookie')?.split(';')[0] };
}

(async () => {
  console.log('Verifying Boundary HRMS on', base);

  const admin = await login('admin@boundaryhrms.com', 'admin123');
  console.log('Admin login', admin.res.status, admin.body.error || admin.body.user?.email || admin.body.message);
  if (admin.res.status !== 200) {
    process.exitCode = 1;
    return;
  }

  const employee = await login('employee@boundaryhrms.com', 'employee123');
  console.log('Employee login', employee.res.status, employee.body.error || employee.body.user?.email || employee.body.message);
  if (employee.res.status !== 200) {
    process.exitCode = 2;
    return;
  }

  const empLeave = await requestJson('/api/leaves/apply', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', cookie: employee.cookie },
    body: JSON.stringify({ startDate: '2026-09-01', endDate: '2026-09-02', type: 'Paid', reason: 'Validation leave request' })
  });
  console.log('Employee leave apply', empLeave.res.status, empLeave.body);
  if (empLeave.res.status !== 200) {
    process.exitCode = 3;
    return;
  }

  const empLeaves = await requestJson('/api/leaves', { headers: { cookie: employee.cookie } });
  console.log('Employee leaves fetched', empLeaves.res.status, Array.isArray(empLeaves.body.leaves) ? empLeaves.body.leaves.length : 0);
  if (empLeaves.res.status !== 200) {
    process.exitCode = 4;
    return;
  }

  const adminLeaves = await requestJson('/api/leaves', { headers: { cookie: admin.cookie } });
  console.log('Admin leaves fetched', adminLeaves.res.status, Array.isArray(adminLeaves.body.leaves) ? adminLeaves.body.leaves.length : 0);
  if (adminLeaves.res.status !== 200) {
    process.exitCode = 5;
    return;
  }

  const employees = await requestJson('/api/admin/employees', { headers: { cookie: admin.cookie } });
  console.log('Admin employees fetched', employees.res.status, Array.isArray(employees.body.employees) ? employees.body.employees.length : 0);
  if (employees.res.status !== 200) {
    process.exitCode = 6;
    return;
  }

  const analytics = await requestJson('/api/dashboard/analytics', { headers: { cookie: admin.cookie } });
  console.log('Analytics fetched', analytics.res.status, analytics.body.attendance?.labels?.length);
  if (analytics.res.status !== 200) {
    process.exitCode = 7;
    return;
  }

  console.log('All checks passed.');
  process.exit(0);
})();