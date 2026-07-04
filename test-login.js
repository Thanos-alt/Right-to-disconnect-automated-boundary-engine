xcconst http = require('http');
const payload = JSON.stringify({ email: 'admin@boundaryhrms.com', password: 'admin123' });
const options = {
  hostname: 'localhost',
  port: 4000,
  path: '/api/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload)
  }
};
const req = http.request(options, res => {
  let data = '';
  res.on('data', chunk => { data += chunk; });
  res.on('end', () => {
    console.log('STATUS', res.statusCode);
    console.log('BODY', data);
  });
});
req.on('error', err => { console.error('ERROR', err); });
req.write(payload);
req.end();
