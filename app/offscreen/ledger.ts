import TransportWebHID from '@ledgerhq/hw-transport-webhid';
import type Transport from '@ledgerhq/hw-transport';
import LedgerEth from '@ledgerhq/hw-app-eth';
import {
  LedgerAction,
  OffscreenCommunicationEvents,
  OffscreenCommunicationTarget,
} from '../../shared/constants/offscreen-communication';
import { LEDGER_USB_VENDOR_ID } from '../../shared/constants/hardware-wallets';

// Transport and app state
// Using base Transport type since TransportWebHID methods return Transport
let transport: Transport | null = null;
let ethApp: LedgerEth | null = null;

/**
 * Serializes an error for transmission across message boundaries.
 * Preserves statusCode for TransportStatusError.
 */
function serializeError(error: unknown): {
  message: string;
  statusCode?: number;
  name?: string;
} {
  if (error instanceof Error) {
    const serialized: { message: string; statusCode?: number; name?: string } =
      {
        message: error.message,
        name: error.name,
      };

    // Preserve statusCode for TransportStatusError
    if ('statusCode' in error && typeof error.statusCode === 'number') {
      serialized.statusCode = error.statusCode;
    }

    return serialized;
  }
  return { message: String(error) };
}

/**
 * Attempts to open a transport to an already-permitted Ledger device.
 * This does NOT require a user gesture - it only works for devices
 * that the user has previously granted permission to via requestDevice().
 */
async function openTransport(): Promise<Transport> {
  // First try to open an already-connected device (no gesture needed)
  const existingTransport = await TransportWebHID.openConnected();
  if (existingTransport) {
    return existingTransport;
  }

  // Check if any Ledger devices are permitted
  const devices = await navigator.hid.getDevices();
  const ledgerDevices = devices.filter(
    (device) => device.vendorId === Number(LEDGER_USB_VENDOR_ID),
  );

  if (ledgerDevices.length === 0) {
    throw new Error(
      'No permitted Ledger device found. User must grant permission from the UI first.',
    );
  }

  // Try to create a transport with the permitted device
  // This should work without a gesture since the device is already permitted
  return TransportWebHID.create();
}

/**
 * Initializes the Ledger Ethereum app.
 * Creates transport if needed and instantiates LedgerEth.
 */
async function makeApp(): Promise<boolean> {
  try {
    // If we already have a working app, verify it's still connected
    if (transport && ethApp) {
      try {
        // Quick test to see if device is still responsive
        await ethApp.getAppConfiguration();
        return true;
      } catch {
        // Device disconnected, clean up and reconnect
        await closeTransport();
      }
    }

    transport = await openTransport();
    ethApp = new LedgerEth(transport);
    return true;
  } catch (error) {
    console.error('Ledger makeApp error:', error);
    throw error;
  }
}

/**
 * Closes the transport and cleans up state.
 */
async function closeTransport(): Promise<void> {
  if (transport) {
    try {
      await transport.close();
    } catch {
      // Ignore close errors
    }
    transport = null;
    ethApp = null;
  }
}

/**
 * Ensures the app is ready for operations.
 * Throws if no app is available.
 */
async function ensureApp(): Promise<LedgerEth> {
  if (!ethApp) {
    await makeApp();
  }
  if (!ethApp) {
    throw new Error('Ledger app not initialized');
  }
  return ethApp;
}

/**
 * Gets the public key for a given HD path.
 */
async function getPublicKey(hdPath: string): Promise<{
  publicKey: string;
  address: string;
  chainCode?: string;
}> {
  const app = await ensureApp();
  const result = await app.getAddress(hdPath, false, true);
  return {
    publicKey: result.publicKey,
    address: result.address,
    chainCode: result.chainCode,
  };
}

/**
 * Signs a transaction.
 */
async function signTransaction(
  hdPath: string,
  tx: string,
): Promise<{
  v: string;
  r: string;
  s: string;
}> {
  const app = await ensureApp();
  const result = await app.signTransaction(hdPath, tx);
  return {
    v: result.v,
    r: result.r,
    s: result.s,
  };
}

/**
 * Signs a personal message.
 */
async function signPersonalMessage(
  hdPath: string,
  message: string,
): Promise<{
  v: number;
  r: string;
  s: string;
}> {
  const app = await ensureApp();
  // Remove 0x prefix if present
  const messageHex = message.startsWith('0x') ? message.slice(2) : message;
  const result = await app.signPersonalMessage(hdPath, messageHex);
  return {
    v: result.v,
    r: result.r,
    s: result.s,
  };
}

/**
 * Signs EIP-712 typed data.
 * Uses signEIP712Message which accepts the full typed data structure.
 * Falls back to signEIP712HashedMessage for Nano S compatibility if needed.
 */
async function signTypedData(params: {
  hdPath: string;
  message: {
    domain: Record<string, unknown>;
    types: Record<string, unknown>;
    primaryType: string;
    message: Record<string, unknown>;
  };
}): Promise<{
  v: number;
  r: string;
  s: string;
}> {
  const app = await ensureApp();
  // Use signEIP712Message which accepts the full EIP-712 message structure
  // This provides better UX as the Ledger can display the message contents
  const result = await app.signEIP712Message(params.hdPath, params.message);
  return {
    v: result.v,
    r: result.r,
    s: result.s,
  };
}

/**
 * Sets up HID device event listeners for connect/disconnect events.
 */
function setupDeviceEventListeners(): void {
  navigator.hid.addEventListener('connect', ({ device }) => {
    if (device.vendorId === Number(LEDGER_USB_VENDOR_ID)) {
      chrome.runtime.sendMessage({
        target: OffscreenCommunicationTarget.extension,
        event: OffscreenCommunicationEvents.ledgerDeviceConnect,
        payload: true,
      });
    }
  });

  navigator.hid.addEventListener('disconnect', ({ device }) => {
    if (device.vendorId === Number(LEDGER_USB_VENDOR_ID)) {
      // Clean up transport state on disconnect
      closeTransport();

      chrome.runtime.sendMessage({
        target: OffscreenCommunicationTarget.extension,
        event: OffscreenCommunicationEvents.ledgerDeviceConnect,
        payload: false,
      });
    }
  });
}

/**
 * Sets up the message listener for handling Ledger actions from the offscreen bridge.
 */
function setupMessageListener(): void {
  chrome.runtime.onMessage.addListener(
    (
      msg: {
        target: string;
        action: LedgerAction;
        params?: Record<string, unknown>;
      },
      _sender,
      sendResponse,
    ) => {
      if (msg.target !== OffscreenCommunicationTarget.ledgerOffscreen) {
        return false;
      }

      // Handle the action asynchronously
      handleLedgerAction(msg.action, msg.params)
        .then((result) => {
          sendResponse({
            success: true,
            payload: result,
          });
        })
        .catch((error) => {
          console.error(`Ledger action ${msg.action} failed:`, error);
          sendResponse({
            success: false,
            payload: {
              error: serializeError(error),
            },
          });
        });

      // Return true to indicate we will send response asynchronously
      return true;
    },
  );
}

/**
 * Handles a Ledger action and returns the result.
 */
async function handleLedgerAction(
  action: LedgerAction,
  params?: Record<string, unknown>,
): Promise<unknown> {
  switch (action) {
    case LedgerAction.makeApp:
      return makeApp();

    case LedgerAction.updateTransport:
      // For direct WebHID, transport type is always webhid
      // This is a no-op but we return true for compatibility
      return true;

    case LedgerAction.getPublicKey:
      if (!params?.hdPath || typeof params.hdPath !== 'string') {
        throw new Error('Missing hdPath parameter');
      }
      return getPublicKey(params.hdPath);

    case LedgerAction.signTransaction:
      if (
        !params?.hdPath ||
        typeof params.hdPath !== 'string' ||
        !params?.tx ||
        typeof params.tx !== 'string'
      ) {
        throw new Error('Missing hdPath or tx parameter');
      }
      return signTransaction(params.hdPath, params.tx);

    case LedgerAction.signPersonalMessage:
      if (
        !params?.hdPath ||
        typeof params.hdPath !== 'string' ||
        !params?.message ||
        typeof params.message !== 'string'
      ) {
        throw new Error('Missing hdPath or message parameter');
      }
      return signPersonalMessage(params.hdPath, params.message);

    case LedgerAction.signTypedData:
      if (
        !params?.hdPath ||
        typeof params.hdPath !== 'string' ||
        !params?.message ||
        typeof params.message !== 'object'
      ) {
        throw new Error('Missing hdPath or message parameter');
      }
      return signTypedData({
        hdPath: params.hdPath,
        message: params.message as {
          domain: Record<string, unknown>;
          types: Record<string, unknown>;
          primaryType: string;
          message: Record<string, unknown>;
        },
      });

    default:
      throw new Error(`Unknown Ledger action: ${action}`);
  }
}

/**
 * Initializes the Ledger offscreen handler.
 * Sets up device event listeners and message handlers.
 */
export default async function init(): Promise<void> {
  setupDeviceEventListeners();
  setupMessageListener();

  // Check if there's already a permitted device connected
  try {
    const devices = await navigator.hid.getDevices();
    const hasLedger = devices.some(
      (device) => device.vendorId === Number(LEDGER_USB_VENDOR_ID),
    );

    if (hasLedger) {
      // Notify extension that a Ledger device is available
      chrome.runtime.sendMessage({
        target: OffscreenCommunicationTarget.extension,
        event: OffscreenCommunicationEvents.ledgerDeviceConnect,
        payload: true,
      });
    }
  } catch (error) {
    console.error('Error checking for permitted Ledger devices:', error);
  }
}
