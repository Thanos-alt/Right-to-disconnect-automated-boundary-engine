const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const path = require('path');
const initDb = require('./src/db');
const api = require('./src/api');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());
app.use(cookieParser());
app.use(session({
  secret: 'boundary-hrms-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));

app.use(express.static(path.join(__dirname, 'public')));
app.use('/api', api);

// Fallback to index.html for UI routes
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

initDb().then(() => {
  let port = Number(PORT);
  const maxAttempts = 5;
  function tryListen(attempt) {
    const server = app.listen(port, () => {
      console.log(`Boundary HRMS server running on http://localhost:${port}`);
    });
    server.on('error', (err) => {
      if (err && err.code === 'EADDRINUSE' && attempt < maxAttempts) {
        console.warn(`Port ${port} in use, trying ${port + 1}...`);
        port += 1;
        setTimeout(() => tryListen(attempt + 1), 200);
      } else {
        console.error('Failed to start server:', err);
        process.exit(1);
      }
    });
  }

  tryListen(1);
}).catch((error) => {
  console.error('Database initialization failed:', error);
});
