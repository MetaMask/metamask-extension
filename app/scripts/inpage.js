// need to make sure we aren't affected by overlapping namespaces
// and that we dont affect the app with our namespace
// mostly a fix for web3's BigNumber if AMD's "define" is defined...
let __define;

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
import log from 'loglevel';
import { v4 as uuid } from 'uuid';
import PortStream from 'extension-port-stream';
import { Transform, finished, pipeline, Duplex } from 'readable-stream';
import { initializeProvider } from '@metamask/providers/dist/initializeInpageProvider';
import shouldInjectProvider from '../../shared/modules/provider-injection';

// contexts
const EXTENSION_ID = 'nonfpcflonapegmnfeafnddgdniflbnk';

restoreContextAfterImports();

log.setDefaultLevel(process.env.METAMASK_DEBUG ? 'debug' : 'warn');

//
// setup plugin communication
//

if (shouldInjectProvider()) {
  // setup background connection
  const extensionPort = chrome.runtime.connect(EXTENSION_ID);
  const portStream = new PortStream(extensionPort);


  class WalletStream extends Duplex {
    constructor() {
      super({objectMode: true})
    }

    _read(_size) {
      // this.push()
    }
    _write(_value, _encoding, callback) {
      console.log('wallet stream write', _value)
      this.push(_value)
      callback();
    }
  }

  class TransformableInStream extends Transform {
    constructor() {
      super({objectMode: true});
    }

    // Filter and wrap caip-x envelope to metamask-provider multiplex stream
    _transform(value, _encoding, callback) {
      console.log('transformIn', value)
      if (value.type === 'caip-x') {
        this.push({
          name: 'metamask-provider',
          data: value.data,
        });
      }
      callback();
    }
  }

  class TransformableOutStream extends Transform {
    constructor() {
      super({objectMode: true});
    }

    // Filter and wrap metamask-provider multiplex stream to caip-x envelope
    _transform(value, _encoding, callback) {
      console.log('transformOut', value)
      if (value.name === 'metamask-provider') {
        this.push({
          type: 'caip-x',
          data: value.data,
        });
      }
      callback();
    }
  }

  const walletStream = new WalletStream();
  const transformInStream = new TransformableInStream();
  const transformOutStream = new TransformableOutStream();

  pipeline(
    portStream,
    transformInStream,
    walletStream,
    transformOutStream,
    portStream,
    (err) => console.log('MetaMask inpage stream', err),
  );

  extensionPort.onMessage.addListener(console.log);

  initializeProvider({
    connectionStream: walletStream,
    logger: log,
    shouldShimWeb3: true,
    providerInfo: {
      uuid: uuid(),
      name: process.env.METAMASK_BUILD_NAME,
      icon: process.env.METAMASK_BUILD_ICON,
      rdns: process.env.METAMASK_BUILD_APP_ID,
    },
  });
}
