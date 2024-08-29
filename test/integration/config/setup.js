require('@babel/register');
require('ts-node').register({ transpileOnly: true });
const fs = require('node:fs/promises');
const path = require('path');

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

const shimmedFetch = async (url, ...args) => {
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

global.metamask = {};
