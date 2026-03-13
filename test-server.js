import http from 'http';
setInterval(() => {
  http.get('http://localhost:3000/api/system-stats', (res) => {
    console.log(`Status: ${res.statusCode}`);
  }).on('error', (e) => {
    console.error(`Got error: ${e.message}`);
  });
}, 1000);
