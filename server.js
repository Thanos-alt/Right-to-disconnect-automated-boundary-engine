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
  app.listen(PORT, () => {
    console.log(`Boundary HRMS server running on http://localhost:${PORT}`);
  });
}).catch((error) => {
  console.error('Database initialization failed:', error);
});
