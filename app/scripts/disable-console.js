// disable console.log in contentscript to prevent SES/lockdown logging to external page
if (typeof window.console !== undefined) {
  console.log = () => {}
}