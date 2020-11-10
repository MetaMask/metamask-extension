import ExtensionPlatform from '../platforms/extension'

global.globalThis = global // eslint-disable-line node/no-unsupported-features/es-builtins
require('ses/dist/lockdown.cjs')

global.platform = new ExtensionPlatform()

// Freezes all intrinsics
// eslint-disable-next-line no-undef
lockdown({
  errorTaming: 'unsafe',
  mathTaming: 'unsafe',
  dateTaming: 'unsafe',
})
