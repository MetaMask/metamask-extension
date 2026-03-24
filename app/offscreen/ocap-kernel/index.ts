// @ts-expect-error - Practically baseless ESM / CJS incompatibility complaint
import { E } from '@endo/eventual-send';

import {
  makeBackgroundCapTP,
  makeCapTPNotification,
  isCapTPNotification,
  getCapTPMessage,
  isConsoleForwardMessage,
  handleConsoleForwardMessage,
  makeIframeVatWorker,
  PlatformServicesServer,
} from '@metamask/kernel-browser-runtime';
import type { CapTPMessage } from '@metamask/kernel-browser-runtime';
import { isJsonRpcMessage, stringify } from '@metamask/kernel-utils';
import type { JsonRpcMessage } from '@metamask/kernel-utils';
import { Logger } from '@metamask/logger';
import type { KernelFacet } from '@metamask/ocap-kernel';
import type { DuplexStream } from '@metamask/streams';
import {
  initializeMessageChannel,
  MessagePortDuplexStream,
} from '@metamask/streams/browser';
import type { PostMessageTarget } from '@metamask/streams/browser';
import { makeHostApiProxy } from './services/host-api-proxy';
import { makeMethodCatalog } from './services/method-catalog';
import { makeLlmService } from './services/llm-service';

const logger = new Logger('offscreen');

declare global {
  /* eslint-disable no-var */
  var kernel: Promise<KernelFacet>;
  var runSmokeTest: () => Promise<void>;
  /* eslint-enable no-var */
}

/**
 * Main function to run the kernel. Under normal operation the returned promise
 * never settles.
 */
export async function runKernel(): Promise<never> {
  defineGlobals();
  console.log('~~~ Initializing kernel... ~~~');

  const kernelStream = await makeKernelWorker();

  const backgroundCapTP = makeBackgroundCapTP({
    send: (captpMessage: CapTPMessage) => {
      const notification = makeCapTPNotification(captpMessage);
      kernelStream.write(notification).catch((error) => {
        logger.error('Failed to send CapTP message:', error);
      });
    },
  });

  const kernelP = backgroundCapTP.getKernel();
  globalThis.kernel = kernelP;

  const drainPromise = kernelStream.drain((message) => {
    if (isConsoleForwardMessage(message)) {
      handleConsoleForwardMessage(message);
    } else if (isCapTPNotification(message)) {
      const captpMessage = getCapTPMessage(message);
      backgroundCapTP.dispatch(captpMessage);
    } else {
      throw new Error(`Unexpected message: ${stringify(message)}`);
    }
  });
  drainPromise.catch(logger.error);

  try {
    const pingResult = await E(kernelP).ping();
    console.log(`~~~ Kernel says: ${pingResult} ~~~`);
  } catch (error) {
    kernelStream.throw(error as Error).catch(logger.error);
  }

  // Register kernel services and launch the capability vendor subcluster
  try {
    const hostApiProxy = makeHostApiProxy();
    const methodCatalog = makeMethodCatalog();
    const llmService = makeLlmService();

    await E(kernelP).registerKernelServiceObject('hostApiProxy', hostApiProxy);
    await E(kernelP).registerKernelServiceObject(
      'methodCatalog',
      methodCatalog,
    );
    await E(kernelP).registerKernelServiceObject('llmService', llmService);

    console.log('~~~ Kernel services registered ~~~');

    // Resolve the bundle path to a full chrome-extension:// URL so the
    // vat supervisor's fetch() can load it from any extension context.
    const bundleUrl = chrome.runtime.getURL(
      'ocap-kernel/vats/capability-vendor/index.bundle',
    );

    const subclusterResult = await E(kernelP).launchSubcluster({
      bootstrap: 'vendor',
      services: [
        'hostApiProxy',
        'methodCatalog',
        'llmService',
        'ocapURLIssuerService',
      ],
      vats: {
        vendor: {
          bundleSpec: bundleUrl,
        },
      },
    });

    console.log('~~~ Vendor subcluster launched ~~~', subclusterResult);

    // Extract and log the OCAP URL from the bootstrap result
    const { bootstrapResult } = subclusterResult;
    if (bootstrapResult) {
      const bodyJson = (bootstrapResult as { body: string }).body.replace(
        /^#/u,
        '',
      );
      const parsed = JSON.parse(bodyJson);
      if (parsed.ocapURL) {
        console.log('='.repeat(60));
        console.log('OCAP URL for remote kernel connection:');
        console.log(parsed.ocapURL);
        console.log('='.repeat(60));
      }
    }

    const { rootKref } = subclusterResult;
    globalThis.runSmokeTest = makeSmokeTest(rootKref);
  } catch (serviceError) {
    console.error('Failed to set up capability vendor:', serviceError);
  }

  const error = new Error('Kernel connection closed unexpectedly');
  try {
    await drainPromise;
  } catch (cause) {
    error.cause = cause;
  }
  backgroundCapTP.abort(error);
  throw error;
}

/**
 * Creates and initializes the kernel worker.
 *
 * @returns The message port stream for worker communication
 */
async function makeKernelWorker(): Promise<
  DuplexStream<JsonRpcMessage, JsonRpcMessage>
> {
  const workerUrl = new URL(
    'ocap-kernel/kernel-worker/index.js',
    globalThis.location.href,
  );
  workerUrl.searchParams.set('reset-storage', 'true');

  const relayMultiaddr = process.env.OCAP_RELAY_MULTIADDR;
  if (relayMultiaddr) {
    const relays = (relayMultiaddr as string).split(',').filter(Boolean);
    workerUrl.searchParams.set('relays', JSON.stringify(relays));

    // Extract host IPs/names from relay multiaddrs and allow plain ws://
    // connections to them. The kernel's connectionGater blocks ws:// to
    // public IPs by default — this allowlist overrides that for relays.
    const hosts = relays
      .map((r: string) => {
        const ip4 = r.match(/\/ip4\/([^/]+)/u);
        if (ip4) {
          return ip4[1];
        }
        const dns = r.match(/\/dns[46]?\/([^/]+)/u);
        return dns ? dns[1] : null;
      })
      .filter(Boolean) as string[];
    if (hosts.length > 0) {
      workerUrl.searchParams.set('allowedWsHosts', JSON.stringify(hosts));
    }
  }

  const worker = new Worker(workerUrl, { type: 'module' });

  const port = await initializeMessageChannel((message, transfer) =>
    worker.postMessage(message, transfer),
  );

  const kernelStream = await MessagePortDuplexStream.make<
    JsonRpcMessage,
    JsonRpcMessage
  >(port, isJsonRpcMessage);

  await PlatformServicesServer.make(worker as PostMessageTarget, (vatId) =>
    makeIframeVatWorker({
      id: vatId,
      iframeUri: 'ocap-kernel/vat/iframe.html',
      getPort: initializeMessageChannel,
      logger: logger.subLogger({
        tags: ['iframe-vat-worker', vatId],
      }),
    }),
  );

  return kernelStream;
}

/**
 * Define globals accessible via the background console.
 */
function defineGlobals(): void {
  Object.defineProperty(globalThis, 'kernel', {
    configurable: false,
    enumerable: true,
    writable: true,
    value: undefined,
  });

  Object.defineProperty(globalThis, 'E', {
    value: E,
    configurable: false,
    enumerable: true,
    writable: false,
  });

  Object.defineProperty(globalThis, 'smokeTest', {
    configurable: false,
    enumerable: true,
    writable: true,
    value: undefined,
  });
}

/**
 * Makes a smoke test for the kernel.
 *
 * @param rootKref - The root kref of the vendor subcluster.
 */
function makeSmokeTest(rootKref: string): () => Promise<void> {
  return async () => {
    console.log('~~~ Running smoke test ~~~');
    // 1. Request a capability via the admin facet (delegates to public facet)
    const capRecord = await E(kernel).queueMessage(
      rootKref,
      'requestCapability',
      ['list accounts'],
    );
    console.log('~~~ Requested capability ~~~', capRecord);

    // 2. List capabilities via admin facet
    const capabilities = await E(kernel).queueMessage(
      rootKref,
      'getCapabilities',
      [],
    );
    console.log('~~~ All capabilities ~~~', capabilities);

    // 3. Extract the capability exo kref from CapData and test it
    const capExoKref = (capRecord as { slots: string[] }).slots[0];
    console.log('~~~ Capability exo kref ~~~', capExoKref);

    // 4. Call getAccounts() on the vended capability
    const accounts = await E(kernel).queueMessage(
      capExoKref,
      'getAccounts',
      [],
    );
    console.log('~~~ getAccounts() result ~~~', accounts);
    console.log('~~~ Smoke test completed successfully ~~~');
  };
}
