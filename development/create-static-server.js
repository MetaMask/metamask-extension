#!/usr/bin/env node
const http = require('http');
const path = require('path');

const serveHandler = require('serve-handler');

/**
 * Creates an HTTP server that serves static files from a directory using serve-handler.
 * If a request URL starts with `/node_modules/`, it rewrites the URL and serves files from the `node_modules` directory.
 *
 * @param {object} options - Configuration options for serve-handler. Documentation can be found here: https://github.com/vercel/serve-handler
 * @param {string} [options.public] - A custom directory to be served relative to the current working directory.
 * @param {boolean|string[]} [options.cleanUrls] - Disable `.html` extension stripping, or restrict it to specific paths.
 * @param {{source: string, destination: string}[]} [options.rewrites] - Array of rewrite rules to map certain paths to different ones.
 * @param {{source: string, destination: string}[]} [options.redirects] - Array of redirect rules to forward paths to different paths or external URLs.
 * @param {{source: string, headers: {key: string, value: string}[]}[]} [options.headers] - Array of custom headers to set for specific paths.
 * @param {boolean|string[]} [options.directoryListing] - Disable directory listing, or restrict it to specific paths.
 * @param {string[]} [options.unlisted] - List of paths to exclude from the directory listing.
 * @param {boolean} [options.trailingSlash] - Whether to enforce trailing slashes on paths.
 * @param {boolean} [options.renderSingle] - If a directory contains only one file, render it.
 * @param {boolean} [options.symlinks] - Whether to resolve symlinks instead of serving a 404 error.
 * @param {boolean} [options.etag] - Whether to calculate and use an ETag response header instead of Last-Modified.
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
