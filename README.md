<<<<<<< HEAD
# Right-to-disconnect-automated-boundary-engine

This repository contains the Boundary HRMS (Right-to-Disconnect) project created for Odoo x Adamas University Hackathon '26.

This project implements local-first HRMS features: attendance, leave management, admin approvals, queued out-of-hours actions, compliance logs, and analytics backed by a sql.js (WASM) SQLite database.

## Team
- Deep Shekhar Halder
- Pronab Chowdhury
- Sayan Pramanik

## Purpose
- Prepare a public repository for the hackathon submission.
- Implement a realistic HRMS with Right-to-Disconnect enforcement for campus use-cases.

## Notes
- The app runs locally (Node + Express serving `public/`) and persists to `data.db` (ignored by .gitignore).
- Keep `data.db` out of the repo; use `scripts/demo_data.js` to generate demo data.
- Follow meaningful commit messages and push individual contributions as required by hackathon rules.

## Quick start
1. npm install
2. npm run seed:demo
3. npm start

## License / Submission
This repository is prepared for the hackathon submission. Invite evaluators as collaborators and submit the repo link on the portal.

