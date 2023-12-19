// curently only used in webpack build.

if (process.env.LAVAMOAT) {
  // TODO: lavamoat support
  throw new Error('LAVAMOAT not supported in webpack build yet');
} else {
  (async function(){
    await import('./sentry-install');
    await import('./init-globals');
    await import('./runtime-cjs');
    await import('./background');
  }());
}
