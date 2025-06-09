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
import { WindowPostMessageStream } from '@metamask/post-message-stream';
import { initializeProvider } from '@metamask/providers/initializeInpageProvider';
import ObjectMultiplex from '@metamask/object-multiplex';
import { pipeline } from 'readable-stream';

// this is currently equivalent to process.env.MULTICHAIN_API
// which can't be used for conditional imports
///: BEGIN:ONLY_INCLUDE_IF(build-beta,build-flask)
import {
  getMultichainClient,
  getDefaultTransport,
} from '@metamask/multichain-api-client';
import { registerSolanaWalletStandard } from '@metamask/solana-wallet-standard';
///: END:ONLY_INCLUDE_IF

import shouldInjectProvider from '../../shared/modules/provider-injection';
import { METAMASK_EIP_1193_PROVIDER } from './constants/stream';

// contexts
const CONTENT_SCRIPT = 'metamask-contentscript';
const INPAGE = 'metamask-inpage';

restoreContextAfterImports();

log.setDefaultLevel(process.env.METAMASK_DEBUG ? 'debug' : 'warn');

//
// setup plugin communication
//

if (shouldInjectProvider()) {
  // setup background connection
  const metamaskStream = new WindowPostMessageStream({
    name: INPAGE,
    target: CONTENT_SCRIPT,
  });

  const mux = new ObjectMultiplex();
  pipeline(metamaskStream, mux, metamaskStream, (error) => {
    let warningMsg = `Lost connection to "${METAMASK_EIP_1193_PROVIDER}".`;
    if (error?.stack) {
      warningMsg += `\n${error.stack}`;
    }
    console.warn(warningMsg);
  });

  initializeProvider({
    connectionStream: mux.createStream(METAMASK_EIP_1193_PROVIDER),
    logger: log,
    shouldShimWeb3: true,
    providerInfo: {
      uuid: uuid(),
      name: process.env.METAMASK_BUILD_NAME,
      icon: process.env.METAMASK_BUILD_ICON,
      rdns: process.env.METAMASK_BUILD_APP_ID,
    },
  });

  // this is currently equivalent to process.env.MULTICHAIN_API
  ///: BEGIN:ONLY_INCLUDE_IF(build-beta,build-flask)
  getMultichainClient({
    transport: getDefaultTransport(),
  }).then((client) => {
    registerSolanaWalletStandard({ client });
  });
  ///: END:ONLY_INCLUDE_IF
}
