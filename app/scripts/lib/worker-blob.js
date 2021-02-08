/* global Blob */
const fs = require('fs');

/* eslint-disable node/no-sync */
// Our brfs transform is extremely cranky, and will not apply itself unless
// fs.readFileSync is called here, at the top-level, outside any function, with
// a string literal path, and no encoding parameter.
export const WORKER_BLOB_URL =
  process.env.METAMASK_ENV === 'test'
    ? 'https://fake.url'
    : getBlobUrl(
        fs.readFileSync(
          require.resolve('@mm-snap/workers/dist/PluginWorker.js'),
          'utf8',
        ),
      );
/* eslint-enable node/no-sync */

function getBlobUrl(blobSrc) {
  // the worker must be an IIFE file
  return URL.createObjectURL(
    new Blob([blobSrc], { type: 'application/javascript' }),
  );
}
