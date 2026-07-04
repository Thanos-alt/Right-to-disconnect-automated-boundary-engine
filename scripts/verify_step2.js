const base = process.env.BASE_URL || 'http://localhost:4002';

async function requestJson(path, options = {}) {
  const url = `${base}${path}`;
  const res = await fetch(url, options);
  let body = null;
  try {
    body = await res.json();
  } catch (e) {
    body = null;
  }
  return { res, body };
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
  const { res, body } = await requestJson('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  return { res, body, cookie: res.headers.get('set-cookie')?.split(';')[0] };
}

function outsideShiftTimes() {
  const now = new Date();
  const hour = now.getHours();

  if (hour >= 0 && hour < 4) {
    return { start: '10:00', end: '11:00' };
  }
  return { start: '00:00', end: '01:00' };
}

(async () => {
  console.log('Running Step 2 verification on', base);

  const admin = await login('admin@boundaryhrms.com', 'admin123');
  if (admin.res.status !== 200) {
    console.error('Admin login failed', admin.res.status, admin.body);
    process.exitCode = 1;
    return;
  }

  const employee = await login('employee@boundaryhrms.com', 'employee123');
  if (employee.res.status !== 200) {
    console.error('Employee login failed', employee.res.status, employee.body);
    process.exitCode = 2;
    return;
  }

  const shift = outsideShiftTimes();
  const updateEmp = await requestJson('/api/admin/employees/update', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', cookie: admin.cookie },
    body: JSON.stringify({ userId: employee.body.user.id, shiftStart: shift.start, shiftEnd: shift.end, paidLeaveBalance: 12, sickLeaveBalance: 8 })
  });
  if (updateEmp.res.status !== 200) {
    console.error('Employee update failed', updateEmp.res.status, updateEmp.body);
    process.exitCode = 3;
    return;
  }
  console.log('Employee shift updated to outside current hours for queue test', shift);

  const leaveRes = await requestJson('/api/leaves/apply', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', cookie: employee.cookie },
    body: JSON.stringify({ startDate: '2026-07-10', endDate: '2026-07-12', type: 'Paid', reason: 'Step 2 validation leave' })
  });
  if (leaveRes.res.status !== 200) {
    console.error('Employee leave apply failed', leaveRes.res.status, leaveRes.body);
    process.exitCode = 4;
    return;
  }
  console.log('Leave request created', leaveRes.body.message);

  const pendingLeaves = await requestJson('/api/leaves', { headers: { cookie: admin.cookie } });
  const leaves = parseSqlResult(pendingLeaves.body.leaves);
  const pending = leaves.find(l => l.status === 'Pending');
  if (!pending) {
    console.error('No pending leave found for admin to process', leaves);
    process.exitCode = 5;
    return;
  }
  console.log('Pending leave found', pending.id, pending.userId, pending.status);

  const approveResp = await requestJson(`/api/admin/leaves/${pending.id}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', cookie: admin.cookie },
    body: JSON.stringify({ emergencyBypass: false })
  });
  console.log('Approve response', approveResp.res.status, approveResp.body);

  if (approveResp.res.status === 200 && approveResp.body.message && approveResp.body.message.includes('queued')) {
    console.log('Approval queued due to outside shift. Simulating shift start...');
    const simResp = await requestJson('/api/admin/compliance/simulate', {
      method: 'POST',
      headers: { cookie: admin.cookie }
    });
    if (simResp.res.status !== 200) {
      console.error('Shift simulation failed', simResp.res.status, simResp.body);
      process.exitCode = 6;
      return;
    }
    console.log('Shift simulation result', simResp.body.message);
  } else if (approveResp.res.status !== 200) {
    console.error('Approval failed', approveResp.res.status, approveResp.body);
    process.exitCode = 7;
    return;
  }

  const updatedLeaves = await requestJson('/api/leaves', { headers: { cookie: employee.cookie } });
  const updatedList = parseSqlResult(updatedLeaves.body.leaves);
  const approved = updatedList.find(l => l.id === pending.id && l.status === 'Approved');
  if (!approved) {
    console.error('Leave was not approved after processing', updatedList);
    process.exitCode = 8;
    return;
  }

  console.log('Step 2 verification passed: leave approved and processed successfully.');
  process.exitCode = 0;
})();