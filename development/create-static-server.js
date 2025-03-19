#!/usr/bin/env node
const http = require('http');
const path = require('path');

const serveHandler = require('serve-handler');

/**
 * Creates an HTTP server that serves static files from a directory using serve-handler.
 * If a request URL starts with `/node_modules/`, it rewrites the URL and serves files from the `node_modules` directory.
 *
 * @param { NonNullable<Parameters<typeof import("serve-handler")>[2]> } options - Configuration options for serve-handler. Documentation can be found here: https://github.com/vercel/serve-handler
 * @returns {http.Server} An instance of an HTTP server configured with the specified options.
 */
const createStaticServer = (options) => {
  return http.createServer((request, response) => {
    if (request.url.startsWith('/node_modules/')) {
      request.url = request.url.slice(14);
      return serveHandler(request, response, {
        directoryListing: false,
        public: path.resolve('./node_modules'),
      });
    }
    return serveHandler(request, response, {
      directoryListing: false,
      ...options,
    });
  });
};

module.exports = createStaticServer;
