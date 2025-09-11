import type { JsonRpcCall } from '@metamask/kernel-utils';
import {
  makeIframeVatWorker,
  VatWorkerServer,
} from '@metamask/kernel-browser-runtime';
import { Logger } from '@metamask/logger';
import type { DuplexStream } from '@metamask/streams';
import {
  initializeMessageChannel,
  // ChromeRuntimeDuplexStream,
  MessagePortDuplexStream,
} from '@metamask/streams/browser';
import type { PostMessageTarget } from '@metamask/streams/browser';
import type { JsonRpcResponse } from '@metamask/utils';
import { isJsonRpcResponse } from '@metamask/utils';

const logger = new Logger('offscreen');

/**
 * Main function to run the kernel. Under normal operation the returned promise
 * never settles.
 */
export async function runKernel(): Promise<void> {
  // TODO: Connect to background script, probably by setting up an entirely new
  // stream over chrome.runtime.
  // // Create stream for messages from the background script
  // const backgroundStream = await ChromeRuntimeDuplexStream.make<
  //   JsonRpcCall,
  //   JsonRpcResponse
  // >(chrome.runtime, 'offscreen', 'background', isJsonRpcCall);

  console.log('~~~ Initializing kernel... ~~~');

  const { vatWorkerService, kernelStream } = await makeKernelWorker();

  // Handle messages from the background script / kernel
  await Promise.all([
    vatWorkerService.start(),
    kernelStream.write({
      jsonrpc: '2.0',
      id: '1',
      method: 'ping',
      params: [],
    }),
    kernelStream.next().then((result) => {
      console.log('~~~ Hello from the kernel ~~~', result);
    }),
    // kernelStream.pipe(backgroundStream),
    // backgroundStream.pipe(kernelStream),
  ]);
}

/**
 * Creates and initializes the kernel worker.
 *
 * @returns The message port stream for worker communication
 */
async function makeKernelWorker(): Promise<{
  kernelStream: DuplexStream<JsonRpcResponse, JsonRpcCall>;
  vatWorkerService: VatWorkerServer;
}> {
  const worker = new Worker('ocap-kernel/kernel-worker/index.js', {
    type: 'module',
  });

  const port = await initializeMessageChannel((message, transfer) =>
    worker.postMessage(message, transfer),
  );

  const kernelStream = await MessagePortDuplexStream.make<
    JsonRpcResponse,
    JsonRpcCall
  >(port, isJsonRpcResponse);

  const vatWorkerService = VatWorkerServer.make(
    worker as PostMessageTarget,
    (vatId) =>
      makeIframeVatWorker({
        id: vatId,
        iframeUri: 'ocap-kernel/vat/iframe.html',
        getPort: initializeMessageChannel,
        logger: logger.subLogger({
          tags: ['iframe-vat-worker', vatId],
        }),
      }),
  );

  return {
    kernelStream,
    vatWorkerService,
  };
}
