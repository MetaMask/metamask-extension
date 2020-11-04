global.globalThis = global // eslint-disable-line node/no-unsupported-features/es-builtins
require('lavamoat-core/lib/ses.umd.js')
import setupSentry from '../lib/setupSentry'
import ExtensionPlatform from '../platforms/extension'

const freezeIntrinsics = (context) => {
  // setup sentry error reporting first, SES is not compatible
  global.platform = new ExtensionPlatform()
  const release = global.platform.getVersion()
  global.sentry = setupSentry({
    release,
    ...(context === 'ui' && { getState: () => window.getSentryState?.() || {} }),
  })
  // Freezes all intrinsics
  // eslint-disable-next-line no-undef
  lockdown({
    errorTaming: 'unsafe',
    mathTaming: 'unsafe',
    dateTaming: 'unsafe',
  })
}

export default freezeIntrinsics
