/* eslint-disable @typescript-eslint/no-require-imports */
// currently only used in webpack build.

if (process.env.ENABLE_LAVAMOAT === 'true') {
  // lockdown-more actually doesn't really work under webpack
  // The security team is working on adding an improved version of lockdown-more to the lavamoat webpack plugin.
  // TODO: delete this file when the improved version is available.
  require('../lockdown-more');
}

export {};
