
global.globalThis = global // eslint-disable-line node/no-unsupported-features/es-builtins
require('lavamoat-core/lib/ses.umd.js')

const freezeIntrinsics = () => {
  // Freezes all intrinsics
  lockdown({ errorTaming: 'unsafe', mathTaming: 'unsafe', dateTaming: 'unsafe' }) // eslint-disable-line no-undef
}

export default freezeIntrinsics