// disable console.log in contentscript to prevent SES/lockdown logging to external page
// eslint-disable-next-line import/unambiguous
if (typeof window.console !== undefined) {
  // eslint-disable-next-line no-empty-function
  console.log = () => {}
}
