// need to make sure we aren't affected by overlapping namespaces
// and that we dont affect the app with our namespace
// mostly a fix for web3's BigNumber if AMD's "define" is defined...
let __define;
import { obj as through2 } from 'through2';

/**
 * Caches reference to global define object and deletes it to
 * avoid conflicts with other global define objects, such as
 * AMD's define function
 */
const cleanContextForImports = () => {
  __define = global.define;
  try {
    global.define = undefined;
  } catch (_) {
    console.warn('MetaMask - global.define could not be deleted.');
  }
};

/**
 * Restores global define object from cached reference
 */
const restoreContextAfterImports = () => {
  try {
    global.define = __define;
  } catch (_) {
    console.warn('MetaMask - global.define could not be overwritten.');
  }
};

cleanContextForImports();

/* eslint-disable import/first */
console.log('inpage calling freeze');
import 'ses'; // import ses to get agoric assert and lockdown global and assert
import './lockdown-run';

// try {
//   // eslint-disable-next-line no-undef,import/unambiguous
//   lockdown({
//     consoleTaming: 'unsafe',
//     errorTaming: 'unsafe',
//     mathTaming: 'unsafe',
//     dateTaming: 'unsafe',
//     domainTaming: 'unsafe',
//     overrideTaming: 'severe',
//   });
// } catch (error) {
//   console.error('Lockdown failed:', error);
// }
import '@endo/eventual-send/shim'; // install `HandledPromise` shim
import log from 'loglevel';
import pump from 'pump';
import ObjectMultiplex from '@metamask/object-multiplex';
import debugStream from '@stdlib/streams-node-debug';
import { WindowPostMessageStream } from '@metamask/post-message-stream';
import { initializeProvider } from '@metamask/providers/dist/initializeInpageProvider';
import shouldInjectProvider from '../../shared/modules/provider-injection';

console.log('import captp stream');
import makeCapTpFromStream from './lib/makeCapTpFromStream';

// contexts
const CONTENT_SCRIPT = 'metamask-contentscript';
const INPAGE = 'metamask-inpage';

restoreContextAfterImports();

log.setDefaultLevel(process.env.METAMASK_DEBUG ? 'debug' : 'warn');

//
// setup plugin communication
//

function debugStream2(opts) {
  return through2(function (chunk, enc, callback) {
    console.log(`${opts.name} stream saw:`, chunk);
    this.push(chunk)
    callback()
  })
}

if (shouldInjectProvider()) {
  // setup background connection
  const metamaskStream = new WindowPostMessageStream({
    name: INPAGE,
    target: CONTENT_SCRIPT,
  });
  const metamaskDebugStream = debugStream({
    'name': 'debug-stream-inpage'
  });

  // Intercept captp messages, ignoring everything else
  const interceptingMux = new ObjectMultiplex();
  interceptingMux.ignoreStream('metamask-provider');
  const captpSubstream = interceptingMux.createStream('metamask-captp');

  const stream1 = debugStream2({
    name: 'my-stream1',
    objectMode: true,
  });
  const stream2 = debugStream2({
    name: 'my-stream2',
    objectMode: true,
  });
  const stream3 = debugStream2({
    name: 'my-stream3',
    objectMode: true,
  });
  const stream4 = debugStream2({
    name: 'my-stream4',
    objectMode: true,
  });

  pump(
    metamaskStream,
    stream1,
    interceptingMux,
    stream2,
    metamaskStream,
    log.error,
  );

  const { captpStream, abort, getBootstrap } = makeCapTpFromStream(
    window.location.origin,
    harden({
      greet: async (name) => {
        // eslint-disable-next-line no-alert, no-undef
        alert(`Hello, ${name}!`);
      },
    }),
  );
  pump(captpStream, stream3, captpSubstream, stream4, captpStream, (err) => {
    log.error(err);
    abort();
  });
  window.getBootstrap = getBootstrap;

  initializeProvider({
    connectionStream: metamaskStream,
    logger: log,
    shouldShimWeb3: true,
  });
}
