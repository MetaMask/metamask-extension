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
  const worker = new Worker('ocap-kernel/kernel-worker/index.js', {
    type: 'module',
  });

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
