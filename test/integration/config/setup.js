require('@babel/register');
require('ts-node').register({ transpileOnly: true });
const v8 = require('v8');
const fs = require('node:fs/promises');
const fsSync = require('node:fs');
const path = require('path');
const nock = require('nock');

require('../../helpers/setup-helper');

// Fetch
// fetch is part of node js in future versions, thus triggering no-shadow
// eslint-disable-next-line no-shadow
const { default: fetch, Headers, Request, Response } = require('node-fetch');

const handleRelativePathRequest = async (url, localeRelativePathRequest) => {
  try {
    const fullLocalePath = path.join(
      process.cwd(),
      'app',
      localeRelativePathRequest[0],
    );

    const content = await fs.readFile(fullLocalePath, { encoding: 'utf8' });

    return new Response(content);
  } catch (error) {
    throw new Error(`Failed to fetch ${url}: ${error.message}`);
  }
};

const riveWasmPath = path.join(
  process.cwd(),
  'test',
  'integration',
  'config',
  'assets',
  'images',
  'rive.wasm',
);

let riveWasmBuffer;
try {
  riveWasmBuffer = fsSync.readFileSync(riveWasmPath);
} catch {
  riveWasmBuffer = undefined;
}

const setupRiveWasmNock = () => {
  if (!riveWasmBuffer) {
    return;
  }

  nock('http://localhost')
    .persist()
    .get('/images/rive.wasm')
    .reply(200, riveWasmBuffer, {
      'Content-Type': 'application/wasm',
    });
};

const shimmedFetch = async (url, ...args) => {
  const urlString =
    typeof url === 'string'
      ? url
      : url && typeof url.url === 'string'
        ? url.url
        : '';

  if (urlString.includes('/images/rive.wasm')) {
    if (!riveWasmBuffer) {
      throw new Error(`Failed to read Rive WASM at ${riveWasmPath}`);
    }

    return new Response(riveWasmBuffer, {
      headers: { 'Content-Type': 'application/wasm' },
    });
  }

  try {
    return await fetch(url, ...args);
  } catch (error) {
    if (error.message !== 'Only absolute URLs are supported') {
      throw error;
    }

    const regex = /_locales\/([^/]+)\/messages\.json/gu;
    const localeRelativePathRequest = url.match(regex);

    if (!localeRelativePathRequest?.length) {
      throw error;
    }

    return handleRelativePathRequest(url, localeRelativePathRequest);
  }
};

Object.assign(window, { fetch: shimmedFetch, Headers, Request, Response });
// some of our libraries currently assume that `fetch` is globally available,
// so we need to assign this for tests to run
global.fetch = shimmedFetch;

if (typeof beforeEach === 'function') {
  /* eslint-disable-next-line jest/require-top-level-describe */
  beforeEach(() => {
    setupRiveWasmNock();
  });
}
setupRiveWasmNock();

global.metamask = {};

const structuredClone = (obj) => {
  return v8.deserialize(v8.serialize(obj));
};

global.structuredClone = structuredClone;

// Mock DOM measurements for virtualizer
Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
  value: 800,
});
