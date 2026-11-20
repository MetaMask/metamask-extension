import { isObject } from '@metamask/utils';
import {
  BRAZE_TARGET,
  getBrazeConfig,
  isBrazeProfile,
  type BrazeWorkerCommand,
} from '../braze/protocol';
import { sendBrazeSession } from './braze-request';

/** Run one Braze session for the lifetime of a trusted service worker port. */
export function installBrazeTransport(): void {
  const { runtime } = chrome;
  const config = getBrazeConfig();
  if (!config || location.href !== runtime.getURL('offscreen.html')) {
    return;
  }

  const { apiKey, endpoint } = config;
  const url = `https://${endpoint}/api/v3/data/`;
  let closeCurrent: (() => void) | undefined;
  runtime.onConnect.addListener((port) => {
    const { sender } = port;
    if (
      port.name !== BRAZE_TARGET ||
      sender?.id !== runtime.id ||
      sender.url !== runtime.getURL('service-worker.js') ||
      sender.tab ||
      sender.documentId
    ) {
      return;
    }
    closeCurrent?.();
    const controller = new AbortController();
    const { signal } = controller;
    let worker: Worker | undefined;
    const stop = (disconnect: boolean) => {
      if (signal.aborted) {
        return;
      }
      closeCurrent = undefined;
      controller.abort();
      worker?.terminate();
      if (disconnect) {
        port.disconnect();
      }
    };
    const close = () => stop(true);
    closeCurrent = close;
    port.onDisconnect.addListener(() => stop(false));
    port.onMessage.addListener((profile: unknown) => {
      if (signal.aborted || worker || !isBrazeProfile(profile)) {
        return;
      }
      try {
        const sessionWorker = new Worker(runtime.getURL('workers/braze.js'));
        worker = sessionWorker;
        sessionWorker.onerror = close;
        sessionWorker.onmessageerror = close;
        sessionWorker.onmessage = async ({ data }: MessageEvent<unknown>) => {
          if (signal.aborted || !isObject(data)) {
            return;
          }
          if (data.type === 'failed') {
            close();
            return;
          }
          if (typeof data.id !== 'number' || !Number.isSafeInteger(data.id)) {
            return;
          }
          const { id } = data;
          const status = await sendBrazeSession(data, {
            url,
            apiKey,
            profile,
            signal,
          });
          if (!signal.aborted) {
            sessionWorker.postMessage({
              type: 'response',
              id,
              status,
            } satisfies BrazeWorkerCommand);
          }
        };
        sessionWorker.postMessage({
          type: 'start',
          apiKey,
          endpoint,
          profile,
        } satisfies BrazeWorkerCommand);
      } catch {
        close();
      }
    });
  });
}
