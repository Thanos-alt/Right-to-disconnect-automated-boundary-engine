(async () => {
  const envBase = process.env.BASE_URL;
  const candidates = envBase ? [envBase] : ['http://localhost:4000', 'http://localhost:4001', 'http://localhost:4002'];
  const admin = { email: 'admin@boundaryhrms.com', password: 'admin123' };

  async function attemptLogin(base) {
    try {
      const res = await fetch(base + '/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(admin)
      });
      const body = await res.json().catch(() => ({}));
      return { base, res, body };
    } catch (err) {
      return { base, res: null, body: null, error: err };
    }
  }

  for (const base of candidates) {
    console.log('Attempting admin login on', base);
    const attempt = await attemptLogin(base);
    if (!attempt.res) {
      console.warn('Connection failed on', base, attempt.error && attempt.error.message);
      continue;
    }
    console.log('Login status', attempt.res.status, attempt.body.message || attempt.body.error || attempt.body.user || '');
    if (attempt.res.status !== 200) continue;

    const setCookie = attempt.res.headers.get('set-cookie') || attempt.res.headers.get('Set-Cookie');
    if (!setCookie) {
      console.warn('Logged in but no session cookie received. Aborting smoke test.');
      process.exit(2);
    }

    const cookieHeader = setCookie.split(';')[0];
    try {
      const analyticsRes = await fetch(base + '/api/dashboard/analytics', { headers: { cookie: cookieHeader } });
      const analyticsJson = await analyticsRes.json().catch(() => ({}));
      console.log('Analytics status', analyticsRes.status);
      if (analyticsRes.status === 200) {
        console.log('Attendance labels length:', analyticsJson.attendance && analyticsJson.attendance.labels && analyticsJson.attendance.labels.length);
        process.exit(0);
      }
      console.error('Analytics failed:', analyticsJson);
      process.exit(3);
    } catch (err) {
      console.error('Analytics request failed for', base, err && err.message);
      process.exitCode = 4;
      return;
    }
  }

  console.error('Smoke test failed: no reachable server instance found. Tried:', candidates.join(', '));
  process.exitCode = 5;
})();
