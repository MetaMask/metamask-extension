const dc = require('node:diagnostics_channel');
const STAMP = `[LavaMoat debug | ${process.env.npm_lifecycle_event} | ${process.env.LAVAMOAT_RUN_CONF}]`;
const VIA = `\n    '-> running:${process.argv[1]}`;

// report when process starts
process._rawDebug(STAMP, '[start]', VIA);

if (!process.permission) {
  process._rawDebug(STAMP, '[WARNING: permission OFF]', VIA);
}

'fs,net,child,worker,inspector,wasi,addon,ffi'.split(',').forEach((suffix) => {
  dc.subscribe(`node:permission-model:${suffix}`, (m) => {
    process._rawDebug(STAMP, `[prevented] ${m.permission} ${m.resource}`);
  });
});
