global.globalThis = global // eslint-disable-line node/no-unsupported-features/es-builtins
require('lavamoat-core/lib/ses.umd.js')

const freezeIntrinsics = () => {
  // Freezes all intrinsics
  // eslint-disable-next-line no-undef
  lockdown({
    errorTaming: 'unsafe',
    mathTaming: 'unsafe',
    dateTaming: 'unsafe',
  })
}

export default freezeIntrinsics
