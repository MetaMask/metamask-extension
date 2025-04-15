// Disable console.log in contentscript to prevent SES/lockdown logging to external page
// eslint-disable-next-line import/unambiguous
if (
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31895
  // eslint-disable-next-line n/no-process-env
  !(typeof process !== 'undefined' && process.env.METAMASK_DEBUG) &&
  typeof console !== 'undefined'
) {
  console.log = noop;
  console.info = noop;
  console.warn = noop;
}

function noop() {
  return undefined;
}
