const http = require('http');

const port = 8889;

const database = {};

const requestHandler = (request, response) => {
  response.setHeader('Content-Type', 'application/json');
  if (request.method === 'POST') {
    let body = '';
    request.on('data', (chunk) => {
      body += chunk.toString(); // convert Buffer to string
    });
    request.on('end', () => {
      const { key, data } = JSON.parse(body);

      database[key] = data;
      response.setHeader('Access-Control-Allow-Headers', '*');
      response.end('ok');
    });
  } else if (request.method === 'GET') {
    const key = new URL(request.url, 'https://example.org/').searchParams.get(
      'key',
    );
    response.setHeader('Access-Control-Allow-Headers', '*');
    response.end(JSON.stringify(database[key] || ''));
  } else {
    response.end('unknown request');
  }
};

const server = http.createServer(requestHandler);

server.listen(port, (err) => {
  if (err) {
    console.log('mock 3box server error: ', err);
  }
});
