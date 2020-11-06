import ExtensionPlatform from '../platforms/extension'
import setupSentry from './setupSentry'

global.globalThis = global // eslint-disable-line node/no-unsupported-features/es-builtins
require('ses/dist/lockdown.cjs')

// setup sentry error reporting first, SES is not compatible
global.platform = new ExtensionPlatform()
const release = global.platform.getVersion()
global.sentry = setupSentry({
  release,
  getState: () => window.getSentryState?.() || {},
})
// Freezes all intrinsics
// eslint-disable-next-line no-undef
lockdown({
  errorTaming: 'unsafe',
  mathTaming: 'unsafe',
  dateTaming: 'unsafe',
})
