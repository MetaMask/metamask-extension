import { makeDefaultExo } from '@metamask/kernel-utils/exo';
import { OffscreenCommunicationTarget } from '../../../../shared/constants/offscreen-communication';
import type { HostApiProxyResponse } from '../types';

/**
 * Creates the host API proxy exo that forwards `invoke()` calls
 * to the background service worker via `chrome.runtime.sendMessage`.
 *
 * @returns An exo with an `invoke` method for calling controller messenger actions.
 */
export function makeHostApiProxy() {
  return makeDefaultExo('hostApiProxy', {
    invoke(method: string, ...args: unknown[]): Promise<unknown> {
      return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(
          {
            target: OffscreenCommunicationTarget.hostApiProxy,
            action: method,
            args,
          },
          (response: HostApiProxyResponse) => {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
              return;
            }
            if (response?.success) {
              resolve(response.result);
            } else {
              const error = new Error(
                response?.error?.message ?? 'Unknown host API error',
              );
              if (response?.error?.stack) {
                error.stack = response.error.stack;
              }
              reject(error);
            }
          },
        );
      });
    },
  });
}
