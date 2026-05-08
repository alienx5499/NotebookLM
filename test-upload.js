const fs = require('fs');
const path = require('path');
const http = require('http');

const pdfPath = path.join(
  __dirname,
  'node_modules/.pnpm/pdf-parse@1.1.1/node_modules/pdf-parse/test/data/01-valid.pdf',
);
const fileData = fs.readFileSync(pdfPath);

const boundary = '----FormBoundary' + Math.random().toString(36).slice(2);
const body = Buffer.concat([
  Buffer.from(
    `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="01-valid.pdf"\r\nContent-Type: application/pdf\r\n\r\n`,
  ),
  fileData,
  Buffer.from(`\r\n--${boundary}--\r\n`),
]);

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/upload',
  method: 'POST',
  headers: {
    'Content-Type': `multipart/form-data; boundary=${boundary}`,
    'Content-Length': body.length,
  },
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => (data += chunk));
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', data);
  });
});
req.on('error', (e) => console.error('Error:', e.message));
req.write(body);
req.end();
