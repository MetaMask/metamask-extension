/* eslint-disable import-x/extensions */
import '../init-globals';

export async function initializeRuntime() {
  if (process.env.ENABLE_SENTRY === 'true') {
    await import(
      /* webpackChunkName: "common-sentry" */ '../sentry-install.js'
    );
  }
}
