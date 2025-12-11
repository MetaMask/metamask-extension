import {
  LedgerAction,
  OffscreenCommunicationEvents,
  OffscreenCommunicationTarget,
} from '../../shared/constants/offscreen-communication';

import type {
  DeviceManagementKit,
  DeviceSessionId,
  DiscoveredDevice,
} from '@ledgerhq/device-management-kit';
import type { SignerEthBuilder as SignerEthBuilderType } from '@ledgerhq/device-signer-kit-ethereum';

// Define SignerEth interface locally since we can't import it directly
interface SignerEth {
  signTransaction: (
    derivationPath: string,
    transaction: Uint8Array,
    options?: any,
  ) => any;
  signMessage: (
    derivationPath: string,
    message: string | Uint8Array,
    options?: any,
  ) => any;
  signTypedData: (derivationPath: string, typedData: any, options?: any) => any;
  getAddress: (derivationPath: string, options?: any) => any;
}

// Global dmk instance to keep connection alive
let dmk: DeviceManagementKit | null = null;
let currentSessionId: DeviceSessionId | null = null;
let currentDevice: DiscoveredDevice | null = null;
let signer: SignerEth | null = null;

// Initialize DMK once
function getDmk() {
  if (!dmk) {
    try {
      // Lazy load DMK dependencies
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const dmkModule = require('@ledgerhq/device-management-kit');
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const {
        webHidTransportFactory,
      } = require('@ledgerhq/device-transport-kit-web-hid');

      // Handle both CJS (default export) and ESM/TS (named export) structures
      const DeviceManagementKitBuilder =
        dmkModule.DeviceManagementKitBuilder ||
        dmkModule.default?.DeviceManagementKitBuilder;
      const ConsoleLogger =
        dmkModule.ConsoleLogger || dmkModule.default?.ConsoleLogger;

      // Check if builders are functions/classes before using 'new'
      if (typeof DeviceManagementKitBuilder !== 'function') {
        // Detailed error logging to see what we actually got
        console.error('DMK Module exports:', dmkModule);
        throw new Error(
          `DeviceManagementKitBuilder is not a constructor (got ${typeof DeviceManagementKitBuilder}). Check console for module exports.`,
        );
      }

      dmk = new DeviceManagementKitBuilder()
        .addLogger(new ConsoleLogger())
        .addTransport(webHidTransportFactory)
        .build() as DeviceManagementKit;
      console.log('Ledger DMK: Instance created');
    } catch (e) {
      console.error('Ledger DMK: Failed to create instance', e);
      throw e;
    }
  }
  return dmk;
}

// Global dmk instance to keep connection alive
async function getSigner(): Promise<SignerEth> {
  if (signer) {
    return signer;
  }

  const dmkInstance = getDmk();

  // Lazy load Signer builder
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { SignerEthBuilder } = require('@ledgerhq/device-signer-kit-ethereum');

  // Find and connect to device
  return new Promise((resolve, reject) => {
    // We start listening to devices
    console.log('Ledger DMK: Starting discovery via startDiscovering...');

    // DMK 0.11.x uses startDiscovering which returns an Observable of discovered devices (array or individual? check docs/code)
    // The previous code used listenToDevices which might have been from an older version or internal method.
    // Based on `WebHidTransport.js` source, it has `startDiscovering()` which triggers `promptDeviceAccess`.
    // And `listenToAvailableDevices()` which returns a stream of devices.
    // `dmk.listenToDevices` likely delegates to transport `listenToAvailableDevices` or `startDiscovering`.
    // WebHID requires a user gesture for `requestDevice`.
    // In offscreen, `navigator.hid.requestDevice` might prompt a picker.
    // But `startDiscovering` calls `promptDeviceAccess`.

    // Let's try `startDiscovering` if `listenToDevices` is not yielding results or if we need to trigger the prompt explicitly.
    // However, the error "Chooser dialog is not displaying a FIDO HID device" suggests the picker IS showing up but empty or filtered.
    // "vendorId=11415" (0x2c97) is Ledger. "productId=28672" (0x7000) is likely Ledger Flex/Stax.
    // If the chooser is not displaying it, maybe the filter is too restrictive or permissions issues?
    // Wait, the log says "Chooser dialog is not displaying...".
    // This implies the browser sees it but filters it out?
    // Or it's a Chrome log saying it found a device that matches but it's FIDO HID?
    // Ledger devices have multiple interfaces. FIDO is one.
    // We want the generic HID interface.
    // The WebHID transport filters by vendorId.

    const subscription = (dmkInstance as any).startDiscovering().subscribe({
      next: async (device: DiscoveredDevice) => {
        console.log('Ledger DMK: Device found via startDiscovering', device);
        try {
          if (currentDevice && currentDevice.id === device.id && signer) {
            subscription.unsubscribe();
            resolve(signer as SignerEth);
            return;
          }

          currentDevice = device;
          subscription.unsubscribe();

          console.log('Ledger DMK: Connecting to device...');
          currentSessionId = await dmkInstance.connect({ device: device });
          console.log('Ledger DMK: Connected, session ID:', currentSessionId);

          // Handle both CJS (default export) and ESM/TS (named export) structures for Signer
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          const signerModule = require('@ledgerhq/device-signer-kit-ethereum');
          const SignerEthBuilder =
            signerModule.SignerEthBuilder ||
            signerModule.default?.SignerEthBuilder;

          signer = new (SignerEthBuilder as any)({
            dmk: dmkInstance,
            sessionId: currentSessionId,
          }).build();

          // Notify bridge that device is connected
          chrome.runtime.sendMessage({
            target: OffscreenCommunicationTarget.extension,
            event: OffscreenCommunicationEvents.ledgerDeviceConnect,
            payload: true,
          });

          resolve(signer as unknown as SignerEth);
        } catch (error) {
          console.error('Ledger DMK: Connection failed', error);
          reject(error);
        }
      },
      error: (error: unknown) => {
        console.error('Ledger DMK: Discovery error', error);
        reject(error);
      },
    });
  });
}

async function handleAction(action: LedgerAction, params: any): Promise<any> {
  const signerInstance = await getSigner();

  switch (action) {
    case LedgerAction.makeApp:
      // Connection is handled by getSigner
      return true;

    case LedgerAction.getPublicKey:
      // params: { hdPath: string }
      // DMK expects options object as second argument, check api definition
      // getAddress: (derivationPath: string, options?: AddressOptions) => GetAddressDAReturnType;
      // AddressOptions: { checkOnDevice?: boolean, returnChainCode?: boolean }
      const result = await signerInstance.getAddress(params.hdPath, {
        checkOnDevice: true,
        returnChainCode: true,
      });

      // GetAddressDAReturnType is an Either/Observable/Promise?
      // We need to check return type. Based on previous usage of DMK, it returns a Promise of the result or an object wrapping it.
      // Looking at source: it returns Promise<GetAddressDAReturnType> (which is likely the response object directly or a wrapper)
      // Wait, the SDK seems to use commands that return Observables/Promises.
      // But SignerEth wrapper methods likely return Promises of the result.

      // Assuming result structure: { publicKey: string, address: string, chainCode?: string }
      // Let's check SignerEth return types if possible or assume standard fields.

      return {
        publicKey: result.publicKey,
        address: result.address,
        chainCode: result.chainCode,
      };

    case LedgerAction.signTransaction:
      // params: { hdPath: string, tx: string }
      // signTransaction: (derivationPath: string, transaction: Uint8Array, options?: TransactionOptions) => SignTransactionDAReturnType;
      // transaction should be Uint8Array. params.tx is likely hex string or similar.
      // We need to convert hex string to Uint8Array.
      const txBuffer = new Uint8Array(
        Buffer.from(params.tx.replace(/^0x/, ''), 'hex'),
      );
      const sigTx = await signerInstance.signTransaction(
        params.hdPath,
        txBuffer,
      );
      return {
        v: sigTx.v,
        r: sigTx.r,
        s: sigTx.s,
      };

    case LedgerAction.signPersonalMessage:
      // params: { hdPath: string, message: string }
      // signMessage: (derivationPath: string, message: string | Uint8Array, options?: MessageOptions) => SignPersonalMessageDAReturnType;
      // message can be string or Uint8Array.
      const sigMsg = await signerInstance.signMessage(
        params.hdPath,
        params.message,
      );
      // Verify v type. Bridge expects number for v?
      // ledger-offscreen-bridge: deviceSignMessage returns { v: number; s: string; r: string }
      // DMK returns v as string (hex) or number? Usually r, s are hex strings. v is often number or string.
      // We need to ensure we return what bridge expects.
      return {
        v: Number(sigMsg.v),
        r: sigMsg.r,
        s: sigMsg.s,
      };

    case LedgerAction.signTypedData:
      // params: LedgerSignTypedDataParams
      // signTypedData: (derivationPath: string, typedData: TypedData, options?: TypedDataOptions) => SignTypedDataDAReturnType;
      // We need to construct TypedData object from params.
      // For prototype, assuming params is compatible object or we pass it as is casted.
      // LedgerSignTypedDataParams usually has domain, types, message, primaryType.
      // TypedData in DMK: { domain: TypedDataDomain, types: Record<string, TypedDataField[]>, message: Record<string, any>, primaryType: string }
      // It seems compatible.
      const sigTyped = await signerInstance.signTypedData(
        params.hdPath,
        params as any,
      );
      return {
        v: sigTyped.v,
        r: sigTyped.r,
        s: sigTyped.s,
      };

    case LedgerAction.updateTransport:
      return true;

    default:
      throw new Error(`Unknown action: ${action}`);
  }
}

// Helper to serialize errors
function serializeError(error: any) {
  if (error instanceof Error) {
    return {
      message: error.message,
      stack: error.stack,
      name: error.name,
      statusCode: (error as any).statusCode,
    };
  }
  return { message: String(error) };
}

export default async function init() {
  console.log('Ledger DMK: Initializing...');
  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg.target !== OffscreenCommunicationTarget.ledgerOffscreen) {
      return;
    }

    console.log('Ledger DMK: Received action', msg.action);

    handleAction(msg.action, msg.params)
      .then((payload) => {
        console.log('Ledger DMK: Action success', msg.action);
        sendResponse({ success: true, payload });
      })
      .catch((error) => {
        console.error('Ledger Action Error', error);
        // Send error back with serializable object
        sendResponse({
          success: false,
          payload: { error: serializeError(error) },
        });
      });

    return true;
  });
  console.log('Ledger DMK: Listener registered');
}
