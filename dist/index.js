// RTD-ABE Demo Server Entry Point
// Starts the Express server on port 3000

const { createServer } = require('./server');

const PORT = process.env.PORT || 3000;

const app = createServer();

app.listen(PORT, () => {
  console.log(`RTD-ABE Demo Server running on http://localhost:${PORT}`);
  console.log('Endpoints:');
  console.log('  GET  /api/system/health');
  console.log('  GET  /snapshot');
  console.log('  GET  /dashboard');
  console.log('  POST /api/policy/evaluate');
  console.log('  GET  /api/compliance/countries');
  console.log('  GET  /api/compliance/manager/:id');
  console.log('  GET  /api/policy/rules');
  console.log('');
  console.log('Use x-rtd-token header with one of: demo-manager-token, demo-admin-token, demo-hr-token, demo-employee-token');
});
