'use strict';

const fs = require('node:fs');
const path = require('node:path');

function sanitizeFileSegment(value) {
  return String(value || 'unnamed')
    .trim()
    .replaceAll(/[^a-zA-Z0-9._-]+/g, '-')
    .replaceAll(/-+/g, '-')
    .replaceAll(/^-|-$/g, '')
    .slice(0, 80) || 'unnamed';
}

function ensureParentDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

module.exports = {
  ensureParentDir,
  sanitizeFileSegment,
};
