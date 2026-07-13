// need to make sure we aren't affected by overlapping namespaces
// and that we dont affect the app with our namespace
// mostly a fix for web3's BigNumber if AMD's "define" is defined...
let __define: unknown;

const globalObject = global as typeof globalThis & {
  define?: unknown;
};

/**
 * Caches reference to global define object and deletes it to
 * avoid conflicts with other global define objects, such as
 * AMD's define function
 */
const cleanContextForImports = (): void => {
  __define = globalObject.define;
  try {
    globalObject.define = undefined;
  } catch (_) {
    console.warn('MetaMask - global.define could not be deleted.');
  }
};

/**
 * Restores global define object from cached reference
 */
const restoreContextAfterImports = (): void => {
  try {
    globalObject.define = __define;
  } catch (_) {
    console.warn('MetaMask - global.define could not be overwritten.');
  }
};

cleanContextForImports();

/* eslint-disable import-x/first */
import log from 'loglevel';
import { v4 as uuid } from 'uuid';
import { WindowPostMessageStream } from '@metamask/post-message-stream';
import { initializeProvider } from '@metamask/providers/initializeInpageProvider';
import ObjectMultiplex from '@metamask/object-multiplex';
// @ts-expect-error @types/readable-stream does not export pipeline
import { pipeline } from 'readable-stream';

import {
  getMultichainClient,
  getDefaultTransport,
} from '@metamask/multichain-api-client';
import { registerSolanaWalletStandard } from '@metamask/solana-wallet-standard';
import { registerBitcoinWalletStandard } from '@metamask/bitcoin-wallet-standard';

import shouldInjectProvider from '../../shared/lib/provider-injection';
import { METAMASK_EIP_1193_PROVIDER } from './constants/stream';

// contexts
const CONTENT_SCRIPT = 'metamask-contentscript';
const INPAGE = 'metamask-inpage';

restoreContextAfterImports();

const getRequiredBuildValue = (
  value: string | undefined,
  key: string,
): string => {
  if (!value) {
    throw new Error(`Missing required build value: ${key}`);
  }

  return value;
};

log.setDefaultLevel(process.env.METAMASK_DEBUG ? 'debug' : 'warn');

//
// setup plugin communication
//

if (shouldInjectProvider()) {
  const providerName = getRequiredBuildValue(
    process.env.METAMASK_BUILD_NAME,
    'METAMASK_BUILD_NAME',
  );
  const providerIcon = getRequiredBuildValue(
    process.env.METAMASK_BUILD_ICON,
    'METAMASK_BUILD_ICON',
  );
  const providerRdns = getRequiredBuildValue(
    process.env.METAMASK_BUILD_APP_ID,
    'METAMASK_BUILD_APP_ID',
  );

  // setup background connection
  const metamaskStream = new WindowPostMessageStream({
    name: INPAGE,
    target: CONTENT_SCRIPT,
  });

  const mux = new ObjectMultiplex();

  /**
   * Note: We do NOT add graceful shutdown handlers (close/end/beforeunload) to the mux
   * in this file, unlike in the background stream files (provider-stream.ts, etc.).
   *
   * This is intentional because:
   *
   * 1. CONTEXT DIFFERENCE:
   *    - inpage.js runs in PAGE CONTEXT (web pages)
   *    - Background streams run in EXTENSION CONTEXT (persistent background)
   *
   * 2. AUTOMATIC CLEANUP:
   *    - When a page navigates/unloads, the browser automatically destroys the entire
   *      script execution context, including all streams and event listeners
   *    - No explicit cleanup is needed - the browser handles it naturally
   *
   * 3. AVOIDING PREMATURE DISCONNECTION:
   *    - Adding handlers that call mux.end() or connectionStream.end() can actually
   *      CAUSE disconnection errors when pages navigate to external URLs
   *    - Tests showed that explicit handlers in page context trigger "Disconnected from
   *      MetaMask background" errors during rapid navigation scenarios (e.g., deep links)
   *
   * 4. DIFFERENT ERROR SOURCE:
   *    - "Premature close" errors in page context are typically harmless - they occur
   *      during normal page navigation and don't indicate a real problem
   *    - The critical "Premature close" issues (3.8M/month in Sentry) come from the
   *      BACKGROUND streams that persist across page loads
   *
   * For context on the "Premature close" issue, see:
   * - https://github.com/MetaMask/metamask-extension/issues/26337
   * - https://github.com/MetaMask/metamask-extension/issues/35241
   */
  pipeline(metamaskStream, mux, metamaskStream, (error: Error | null) => {
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
    shouldSendMetadata: false,
    providerInfo: {
      uuid: uuid(),
      name: providerName,
      icon: providerIcon,
      rdns: providerRdns,
    },
  });

  // Solana Wallet Standard registration
  const solanaMultichainClient = getMultichainClient({
    transport: getDefaultTransport(),
  });
  registerSolanaWalletStandard({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    client: solanaMultichainClient as any,
    walletName: providerName,
  });

  // Bitcoin SatsConnect Wallet Standard registration
  const btcMultichainClient = getMultichainClient({
    transport: getDefaultTransport(),
  });
  registerBitcoinWalletStandard({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    client: btcMultichainClient as any,
    walletName: providerName,
  });
}
