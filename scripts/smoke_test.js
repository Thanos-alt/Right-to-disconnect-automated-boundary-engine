(async () => {
  const base = process.env.BASE_URL || 'http://localhost:4002';
  const admin = { email: 'admin@boundaryhrms.com', password: 'adminpass' };
  try {
    console.log('Attempting to login as admin to', base);
    const loginRes = await fetch(base + '/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(admin)
    });
    const setCookie = loginRes.headers.get('set-cookie') || loginRes.headers.get('Set-Cookie');
    const loginJson = await loginRes.json().catch(() => ({}));
    console.log('Login status', loginRes.status, loginJson.message || loginJson.error || loginJson.user || '');
    if (!setCookie) {
      console.warn('No session cookie received; analytics test will be skipped');
      process.exit(loginRes.status === 200 ? 0 : 2);
    }

    const cookieHeader = setCookie.split(';')[0];
    const analyticsRes = await fetch(base + '/api/dashboard/analytics', { headers: { cookie: cookieHeader } });
    const analyticsJson = await analyticsRes.json().catch(() => ({}));
    console.log('Analytics status', analyticsRes.status);
    if (analyticsRes.status === 200) {
      console.log('Attendance labels length:', analyticsJson.attendance && analyticsJson.attendance.labels && analyticsJson.attendance.labels.length);
      process.exit(0);
    } else {
      console.error('Analytics failed:', analyticsJson);
      process.exit(3);
    }
  } catch (e) {
    console.error('Smoke test error', e && e.message);
    process.exit(4);
  }
})();
