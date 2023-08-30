// Disable console.log in contentscript to prevent SES/lockdown logging to external page
// eslint-disable-next-line import/unambiguous
if (
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
