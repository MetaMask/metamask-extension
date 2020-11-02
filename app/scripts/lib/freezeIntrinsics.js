
global.globalThis = global // eslint-disable-line node/no-unsupported-features/es-builtins
require('lavamoat-core/lib/ses.umd.js')

export default freezeIntrinsics = () => {
  //Freezes all intrinsics
  lockdown({ errorTaming: 'unsafe', mathTaming: 'unsafe', dateTaming: 'unsafe' }) // eslint-disable-line no-undef
}
