import { OffscreenCommunicationTarget } from '../../../../shared/constants/offscreen-communication';
import type {
  HostApiProxyRequest,
  HostApiProxyResponse,
} from '../../../offscreen/ocap-kernel/types';

type MessengerLike = {
  call: (action: string, ...args: unknown[]) => unknown;
};

/**
 * Sets up a chrome.runtime.onMessage listener that bridges
 * host API proxy requests from the offscreen document to the
 * root controller messenger.
 *
 * @param controllerMessenger - The root controller messenger instance.
 */
export function setupHostApiProxyBridge(
  controllerMessenger: MessengerLike,
): void {
  chrome.runtime.onMessage.addListener(
    (
      msg: HostApiProxyRequest,
      _sender: chrome.runtime.MessageSender,
      sendResponse: (response: HostApiProxyResponse) => void,
    ) => {
      if (msg?.target !== OffscreenCommunicationTarget.hostApiProxy) {
        return false;
      }

      (async () => {
        try {
          const result = await (controllerMessenger as ReturnType<never>).call(
            msg.action,
            ...msg.args,
          );
          sendResponse({ success: true, result });
        } catch (error) {
          const errorObj =
            error instanceof Error
              ? { message: error.message, stack: error.stack }
              : { message: String(error) };
          sendResponse({ success: false, error: errorObj });
        }
      })();

      // Return true to keep sendResponse valid for async
      return true;
    },
  );
}
