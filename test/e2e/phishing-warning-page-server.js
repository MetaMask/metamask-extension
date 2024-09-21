const path = require('path');
const createStaticServer = require('../../development/create-static-server');

const phishingWarningDirectory = path.resolve(
  __dirname,
  '..',
  '..',
  'node_modules',
  '@metamask',
  'phishing-warning',
  'dist',
);

class PhishingWarningPageServer {
  constructor() {
    this._server = createStaticServer(phishingWarningDirectory);
  }

  async start({ port = 9999 } = {}) {
    this._server.listen(port);

    let resolveStart;
    let rejectStart;
    const result = new Promise((resolve, reject) => {
      resolveStart = resolve;
      rejectStart = reject;
    });
    this._server.once('listening', resolveStart);
    this._server.once('error', rejectStart);

    try {
      await result;
      // clean up listener to ensure later errors properly bubble up
      this._server.removeListener('error', rejectStart);
    } catch (error) {
      this._server.removeListener('listening', resolveStart);
      throw error;
    }
  }

  isRunning() {
    return this._server.listening;
  }

  async quit() {
    await new Promise((resolve, reject) =>
      this._server.close((error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      }),
    );
  }
}

module.exports = PhishingWarningPageServer;
