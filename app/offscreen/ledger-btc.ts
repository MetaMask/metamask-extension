import {
  type DeviceManagementKit,
  DeviceManagementKitBuilder,
} from '@ledgerhq/device-management-kit';
import { webHidTransportFactory } from '@ledgerhq/device-transport-kit-web-hid';
import { LedgerEntropy } from '@metamask/entropy-controller';
import {
  LedgerBtcAction,
  OffscreenCommunicationTarget,
} from '../../shared/constants/offscreen-communication';

const DEVICE_DISCOVERY_TIMEOUT_MS = 15_000;

/**
 * Waits for an already-permitted Ledger device to appear via WebHID.
 *
 * In the offscreen document `requestDevice()` fails without a user gesture,
 * so we use `listenToAvailableDevices()` which calls `getDevices()` internally.
 *
 * @param dmk - The Device Management Kit instance.
 * @returns The first available device.
 */
async function findPermittedDevice(
  dmk: DeviceManagementKit,
): Promise<Parameters<typeof dmk.connect>[0]['device']> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(`No permitted Ledger device found`));
    }, DEVICE_DISCOVERY_TIMEOUT_MS);

    const subscription = dmk.listenToAvailableDevices({}).subscribe({
      next(devices) {
        if (devices.length > 0) {
          clearTimeout(timeout);
          subscription.unsubscribe();
          console.log('[ledger-btc] Found permitted device:', devices[0]);
          resolve(devices[0]);
        }
      },

      error(reason: unknown) {
        clearTimeout(timeout);
        reject(
          reason instanceof Error ? reason : new Error(JSON.stringify(reason)),
        );
      },
    });
  });
}

/**
 * Runs the LedgerEntropy test flow: discovers a Ledger device, connects,
 * fetches xpub + address, and signs a message.
 *
 * @returns The test results.
 */
async function runBtcTest(): Promise<{
  xpub: string;
  fingerprint: string;
  address: string;
  signature: string;
}> {
  // 1. Build DMK with WebHID transport
  const dmk = new DeviceManagementKitBuilder()
    .addTransport(webHidTransportFactory)
    .build();

  // 2. Find an already-permitted device (no user gesture needed)
  const device = await findPermittedDevice(dmk);

  // 3. Connect
  console.log('[ledger-btc] Connecting to device...');
  const sessionId = await dmk.connect({ device });
  console.log('[ledger-btc] Connected, sessionId:', sessionId);

  try {
    // ── Entropy ─────────────────────────────────────────────────
    // Create a LedgerEntropy instance from a connected device session.
    const entropy = new LedgerEntropy('ledger-test', dmk, sessionId);

    // ── Signer ──────────────────────────────────────────────────
    // Derive a BitcoinSigner for native segwit, first receive address (m/84'/0'/0'/0/0).
    const signer = await entropy.getSigner('bip122:mainnet' as const, {
      path: ["84'", "0'", "0'", '0', '0'],
    });

    // ── Signer operations ───────────────────────────────────────
    const xpubResult = await signer.getXpub();
    const addressResult = await signer.getAddress();
    const signResult = await signer.signMessage({
      message: 'Hello from MetaMask!',
    });

    console.log('[ledger-btc] xpub:', xpubResult);
    console.log('[ledger-btc] address:', addressResult);
    console.log('[ledger-btc] signature:', signResult);

    return {
      xpub: xpubResult.xpub,
      fingerprint: xpubResult.fingerprint,
      address: addressResult.address,
      signature: signResult.signature,
    };
  } finally {
    await dmk.disconnect({ sessionId });
    dmk.close();
  }
}

/**
 * Sets up the message listener for Bitcoin Ledger test actions.
 */
function setupMessageListener(): void {
  chrome.runtime.onMessage.addListener(
    (
      msg: {
        target: string;
        action: LedgerBtcAction;
      },
      _sender,
      sendResponse,
    ) => {
      if (msg.target !== OffscreenCommunicationTarget.ledgerBtcOffscreen) {
        return false;
      }

      if (msg.action !== LedgerBtcAction.test) {
        return false;
      }

      console.log('[ledger-btc] Running Bitcoin Ledger test...');
      runBtcTest()
        .then((result) => {
          console.log('[ledger-btc] Test results:', result);
          sendResponse({ success: true, payload: result });
        })
        .catch((error) => {
          console.error('[ledger-btc] Test failed:', error);
          sendResponse({
            success: false,
            payload: {
              error:
                error instanceof Error ? error.message : JSON.stringify(error),
            },
          });
        });

      // Return true for async sendResponse
      return true;
    },
  );
}

/**
 * Initializes the Bitcoin Ledger offscreen handler.
 */
export default function initLedgerBtc(): void {
  setupMessageListener();
  console.log('[ledger-btc] Bitcoin Ledger handler initialized in offscreen');
}
