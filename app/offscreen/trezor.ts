import TrezorConnectSDK, { DEVICE, DEVICE_EVENT } from '@trezor/connect-web';
import {
  OffscreenCommunicationEvents,
  OffscreenCommunicationTarget,
  TrezorAction,
} from '../../shared/constants/offscreen-communication';

let trezorInitialized = false;
let trezorInitInProgress: Promise<void> | null = null;
let trezorDeviceListenerRegistered = false;
let trezorInitRequested = false;
type TrezorQueueItem = {
  operation: () => Promise<unknown>;
  settle: {
    resolve: (value: unknown) => void;
    reject: (error: unknown) => void;
  };
};

const trezorQueue: TrezorQueueItem[] = [];
let isProcessingQueue = false;

function createErrorResponse(error: unknown) {
  return {
    success: false,
    payload: {
      error: error instanceof Error ? error.message : String(error),
    },
  };
}

function enqueueTrezorOperation<TResult>(
  operation: () => Promise<TResult>,
): Promise<TResult> {
  return new Promise<TResult>((resolve, reject) => {
    trezorQueue.push({
      operation: () => operation() as Promise<unknown>,
      settle: {
        resolve: (value) => resolve(value as TResult),
        reject,
      },
    });

    if (!isProcessingQueue) {
      processTrezorQueue().catch(() => undefined);
    }
  });
}

async function processTrezorQueue(): Promise<void> {
  isProcessingQueue = true;

  try {
    while (trezorQueue.length > 0) {
      const queueItem = trezorQueue.shift();

      if (!queueItem) {
        continue;
      }

      try {
        const result = await queueItem.operation();
        queueItem.settle.resolve(result);
      } catch (error) {
        queueItem.settle.reject(error);
      }
    }
  } finally {
    isProcessingQueue = false;
  }
}

function registerTrezorDeviceListener() {
  if (trezorDeviceListenerRegistered) {
    return;
  }

  TrezorConnectSDK.on(DEVICE_EVENT, (event) => {
    if (event.type !== DEVICE.CONNECT) {
      return;
    }

    if (event.payload.features?.model) {
      chrome.runtime.sendMessage({
        target: OffscreenCommunicationTarget.extension,
        event: OffscreenCommunicationEvents.trezorDeviceConnect,
        payload: {
          model: event.payload.features.model,
          minorVersion: event.payload.features.minor_version,
        },
      });
    }
  });

  trezorDeviceListenerRegistered = true;
}

async function initializeTrezorConnect(
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params: any,
) {
  if (trezorInitialized) {
    return;
  }

  if (trezorInitInProgress) {
    await trezorInitInProgress;
    return;
  }

  registerTrezorDeviceListener();
  trezorInitRequested = true;

  trezorInitInProgress = TrezorConnectSDK.init({
    ...params,
    env: 'webextension',
  }).then(() => {
    trezorInitialized = true;
  });

  try {
    await trezorInitInProgress;
  } finally {
    trezorInitInProgress = null;
  }
}

function disposeTrezorConnect() {
  // This removes the Trezor Connect iframe from the DOM
  // This method is not well documented, but the code it calls can be seen
  // here: https://github.com/trezor/connect/blob/dec4a56af8a65a6059fb5f63fa3c6690d2c37e00/src/js/iframe/builder.js#L181
  TrezorConnectSDK.dispose();
  trezorInitialized = false;
  trezorInitInProgress = null;
  trezorInitRequested = true;
}

async function runTrezorAction(
  action: TrezorAction,

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params: any,
) {
  if (trezorInitInProgress) {
    await trezorInitInProgress;
  }

  if (trezorInitRequested && !trezorInitialized) {
    throw new Error('Trezor Connect is not initialized');
  }

  switch (action) {
    case TrezorAction.getPublicKey:
      return await TrezorConnectSDK.getPublicKey(params);

    case TrezorAction.signTransaction:
      return await TrezorConnectSDK.ethereumSignTransaction(params);

    case TrezorAction.signMessage:
      return await TrezorConnectSDK.ethereumSignMessage(params);

    case TrezorAction.signTypedData:
      return await TrezorConnectSDK.ethereumSignTypedData(params);

    case TrezorAction.getFeatures:
      return await TrezorConnectSDK.getFeatures();

    default:
      throw new Error('Trezor action not supported');
  }
}

async function runQueuedTrezorMessageAction(msg: {
  target: string;
  action: TrezorAction;

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params: any;
}) {
  return await enqueueTrezorOperation(async () => {
    switch (msg.action) {
      case TrezorAction.init:
        await initializeTrezorConnect(msg.params);
        return undefined;

      case TrezorAction.dispose:
        disposeTrezorConnect();
        return undefined;

      default:
        return await runTrezorAction(msg.action, msg.params);
    }
  });
}

async function handleTrezorMessage(
  msg: {
    target: string;
    action: TrezorAction;

    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    params: any;
  },
  sendResponse: (response?: unknown) => void,
) {
  try {
    const result = await runQueuedTrezorMessageAction(msg);
    sendResponse(result);
  } catch (error) {
    sendResponse(createErrorResponse(error));
  }
}

/**
 * This listener is used to listen for messages targeting the Trezor Offscreen
 * handler. Each package sent has an action that is used to determine what calls
 * to the Trezor Connect SDK should be made. The response is then sent back to
 * the sender of the message, which in this case will be the
 * TrezorOffscreenBridge.
 */
export default function init() {
  chrome.runtime.onMessage.addListener(
    (
      msg: {
        target: string;
        action: TrezorAction;

        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        params: any;
      },
      _sender,
      sendResponse,
    ) => {
      if (msg.target !== OffscreenCommunicationTarget.trezorOffscreen) {
        return;
      }

      handleTrezorMessage(msg, sendResponse).catch(() => undefined);

      // This keeps sendResponse function valid after return
      // https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/runtime/onMessage
      // eslint-disable-next-line consistent-return
      return true;
    },
  );
}
