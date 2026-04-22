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

  // Register kernel services and launch the per-service subclusters.
  //
  // Each service runs in its own independent subcluster to mimic a
  // heterogeneous service ecosystem where each provider publishes its own
  // vat. The shared `hostApiProxy` kernel service is registered once and
  // only granted to services that need it (currently the
  // PersonalMessageSigner).
  try {
    const hostApiProxy = makeHostApiProxy();

    await E(kernelP).registerKernelServiceObject('hostApiProxy', hostApiProxy);

    console.log('~~~ Kernel services registered ~~~');

    const matcherUrl = (process.env.OCAP_MATCHER_URL ?? '').trim();

    const serviceSubclusters: {
      vatName: string;
      bundlePath: string;
      services: string[];
    }[] = [
      {
        vatName: 'personalMessageSigner',
        bundlePath: 'ocap-kernel/vats/personal-message-signer/index.bundle',
        services: [
          'hostApiProxy',
          'ocapURLIssuerService',
          'ocapURLRedemptionService',
        ],
      },
      {
        vatName: 'echoService',
        bundlePath: 'ocap-kernel/vats/echo-service/index.bundle',
        services: ['ocapURLIssuerService', 'ocapURLRedemptionService'],
      },
      {
        vatName: 'randomNumberService',
        bundlePath: 'ocap-kernel/vats/random-number-service/index.bundle',
        services: ['ocapURLIssuerService', 'ocapURLRedemptionService'],
      },
    ];

    const serviceContacts: { name: string; contactUrl: string }[] = [];
    const rootKrefs: Record<string, string> = {};

    for (const subcluster of serviceSubclusters) {
      const bundleUrl = chrome.runtime.getURL(subcluster.bundlePath);
      const result = await E(kernelP).launchSubcluster({
        bootstrap: subcluster.vatName,
        services: subcluster.services,
        vats: {
          [subcluster.vatName]: {
            bundleSpec: bundleUrl,
            // Endow the Web Crypto API so the vat can generate registration
            // tokens and (for RandomNumberService) random numbers. SES
            // strips crypto from the default compartment globals, so it
            // must be opted into explicitly here.
            globals: ['crypto'],
            parameters: { matcherUrl },
          },
        },
      });

      const { bootstrapResult, rootKref } = result;
      rootKrefs[subcluster.vatName] = rootKref;

      if (bootstrapResult) {
        const bodyJson = (bootstrapResult as { body: string }).body.replace(
          /^#/u,
          '',
        );
        const parsed = JSON.parse(bodyJson) as {
          name?: string;
          contactUrl?: string;
        };
        if (parsed.name && parsed.contactUrl) {
          serviceContacts.push({
            name: parsed.name,
            contactUrl: parsed.contactUrl,
          });
        }
      }
    }

    if (serviceContacts.length > 0) {
      console.log('='.repeat(60));
      console.log('Service contact URLs:');
      for (const entry of serviceContacts) {
        console.log(`  ${entry.name}: ${entry.contactUrl}`);
      }
      console.log('='.repeat(60));
    }

    await E(hostApiProxy).invoke('OcapKernelController:setServiceContacts', [
      serviceContacts,
    ]);

    globalThis.runSmokeTest = makeSmokeTest(rootKrefs);
  } catch (serviceError) {
    console.error('Failed to launch service subclusters:', serviceError);
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
 * Hits each service vat's `getContactUrl` to verify the vat is alive and
 * has issued its contact URL.
 *
 * @param rootKrefs - A map from vat name to the root kref of each service
 * subcluster's bootstrap vat.
 */
function makeSmokeTest(rootKrefs: Record<string, string>): () => Promise<void> {
  return async () => {
    console.log('~~~ Running smoke test ~~~');
    for (const [vatName, rootKref] of Object.entries(rootKrefs)) {
      const url = await E(kernel).queueMessage(rootKref, 'getContactUrl', []);
      console.log(`~~~ ${vatName} contact URL ~~~`, url);
    }
    console.log('~~~ Smoke test completed successfully ~~~');
  };
}
