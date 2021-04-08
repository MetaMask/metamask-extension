const http = require('http');

const PORT = 8889;

class ThreeboxMockServer {
  constructor() {
    this.server = http.createServer(this.requestHandler);
    this.database = {};
  }

  async start() {
    return new Promise((resolve, reject) => {
      console.log();
      this.server = this.server.listen(PORT);
      this.server.once('error', reject);
      this.server.once('listening', resolve);
    });
  }

  async stop() {
    if (!this.server) {
      return;
    }

    await new Promise((resolve, reject) => {
      this.server.close();
      this.server.once('error', reject);
      this.server.once('close', resolve);
    });
  }

  requestHandler(request, response) {
    response.setHeader('Content-Type', 'application/json');
    console.log(request.method);
    console.log(this.database);
    if (request.method === 'POST') {
      let body = '';
      request.on('data', (chunk) => {
        body += chunk.toString(); // convert Buffer to string
      });
      console.log(`in post: ${body}`);
      request.on('end', () => {
        const { key, data } = JSON.parse(body);
        console.log(`${key} : ${data}`);
        this.database[key] = data;
        response.setHeader('Access-Control-Allow-Headers', '*');
        response.end('ok');
      });
    } else if (request.method === 'GET') {
      console.log('in get: ', this.database);
      const key = new URL(request.url, 'https://example.org/').searchParams.get(
        'key',
      );
      console.log(`'in get: ',${key}`);

      response.setHeader('Access-Control-Allow-Headers', '*');
      response.end(JSON.stringify(this.database[key] || ''));
    } else {
      response.end('unknown request');
    }
  }
}

module.exports = ThreeboxMockServer;
