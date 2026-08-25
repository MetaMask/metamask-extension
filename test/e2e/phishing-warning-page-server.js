const fs = require('fs');
const http = require('http');
const path = require('path');
const serveHandler = require('serve-handler');

const PARENT_SELECTOR_TEST_ID = 'parent-selector-phishing-warning-page';

const phishingWarningDirectory = path.resolve(
  __dirname,
  '..',
  '..',
  'node_modules',
  '@metamask',
  'phishing-warning',
  'dist',
);

function getPatchedIndexHtml() {
  const html = fs.readFileSync(
    path.join(phishingWarningDirectory, 'index.html'),
    'utf8',
  );
  if (html.includes(`data-testid="${PARENT_SELECTOR_TEST_ID}"`)) {
    return html;
  }
  return html.replace(
    '<div class="content">',
    `<div class="content" data-testid="${PARENT_SELECTOR_TEST_ID}">`,
  );
}

class PhishingWarningPageServer {
  constructor() {
    const patchedIndexHtml = getPatchedIndexHtml();
    this._server = http.createServer((request, response) => {
      const urlPath = request.url?.split('?')[0];
      if (urlPath === '/' || urlPath === '/index.html') {
        response.writeHead(200, {
          'Content-Type': 'text/html; charset=utf-8',
        });
        response.end(patchedIndexHtml);
        return;
      }
      serveHandler(request, response, {
        directoryListing: false,
        public: phishingWarningDirectory,
      });
    });
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
    await new Promise((resolve, reject) => {
      this._server.close((error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
      // We need to close all connections to stop the server quickly
      // Otherwise it takes a few seconds for it to close
      this._server.closeAllConnections();
    });
  }
}

module.exports = PhishingWarningPageServer;
