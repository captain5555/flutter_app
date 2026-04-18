const http = require('http');

const options = {
  hostname: '47.103.151.220',
  port: 3001,
  path: '/api/auth/login-simple',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
};

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('Login response:');
    console.log(data);
    console.log('\n---\n');

    const result = JSON.parse(data);
    if (result.success && result.data.token) {
      getMaterials(result.data.token);
    }
  });
});

req.on('error', (error) => {
  console.error('Error:', error);
});

req.write(JSON.stringify({ username: 'admin', password: 'admin123' }));
req.end();

function getMaterials(token) {
  const options = {
    hostname: '47.103.151.220',
    port: 3001,
    path: '/api/materials/user/1/folder/videos',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  };

  const req = http.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      console.log('Materials response:');
      console.log(JSON.stringify(JSON.parse(data), null, 2));
    });
  });

  req.on('error', (error) => {
    console.error('Error:', error);
  });

  req.end();
}
