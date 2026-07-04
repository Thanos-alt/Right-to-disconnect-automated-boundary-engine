Boundary HRMS — Submission Notes

Quick steps to reproduce demo locally

1. Install dependencies

```bash
npm install
```

2. Seed demo data (creates data.db)

```bash
npm run seed:demo
```

3. Start server (it will try ports 4000..4004 automatically)

```bash
node server.js
```

4. Open the SPA in a browser at the printed URL (e.g. http://localhost:4002)

Key endpoints useful for evaluation

- `POST /api/login` — body `{ email, password }` (admin: admin@boundaryhrms.com / password: admin123)
- `GET /api/dashboard/analytics` — returns attendance trend and leave balances
- `GET /api/admin/export/employees` — download employees CSV (admin only)
- `POST /api/admin/import/users` — body `{ csv: "<CSV text>" }` to import users (admin only)
- Queued actions (out-of-hours approvals) are processed automatically on server startup and every 30s.

Notes and checklist

- The repository contains a demo data generator at `scripts/demo_data.js`.
- `data.db` is generated locally and intentionally in `.gitignore` (do not upload private DB to GitHub).
- I added a lightweight queued-action background worker to process queued approvals.
- CSV import now validates emails and roles and returns a detailed report in the response.

Suggested demo script (5 minutes)

1. Seed demo data and start server (30s) — show server URL.
2. Log in as admin and open `Admin -> Employees` (30s).
3. Export employees CSV and show file (30s).
4. Use `Admin -> Import` to import a few sample users (30s).
5. Demonstrate applying a leave as an employee and approving it as admin (explain queued approval behavior) (90s).
6. Show `Dashboard -> Analytics` and compliance logs (60s).

If you want, I can:

- Add a short CI smoke-test script and an `npm test` task to run it.
- Polish frontend UI and complete dashboard pages.
- Prepare deployment config (Dockerfile / render.yaml) for quick live demo.

Tell me which of the above to do next and I will proceed.
