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

/**
 * Main function to run the kernel. Under normal operation the returned promise
 * never settles.
 */
export async function runKernel(): Promise<never> {
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

    const result = await E(kernelP).launchSubcluster({
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

    console.log('~~~ Vendor subcluster launched ~~~', result);

    // Extract and log the OCAP URL from the bootstrap result
    const { bootstrapResult } = result;
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

    // --- Smoke test: exercise the full vendor pipeline ---
    const { rootKref } = result;

    // 1. Request a capability via the admin facet (delegates to public facet)
    const capRecord = await E(kernelP).queueMessage(
      rootKref,
      'requestCapability',
      ['list accounts'],
    );
    console.log('~~~ Requested capability ~~~', capRecord);

    // 2. List capabilities via admin facet
    const capabilities = await E(kernelP).queueMessage(
      rootKref,
      'getCapabilities',
      [],
    );
    console.log('~~~ All capabilities ~~~', capabilities);

    // 3. Extract the capability exo kref from CapData and test it
    const capExoKref = (capRecord as { slots: string[] }).slots[0];
    console.log('~~~ Capability exo kref ~~~', capExoKref);

    // 4. Call getAccounts() on the vended capability
    const accounts = await E(kernelP).queueMessage(
      capExoKref,
      'getAccounts',
      [],
    );
    console.log('~~~ getAccounts() result ~~~', accounts);
    // --- End smoke test ---
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
