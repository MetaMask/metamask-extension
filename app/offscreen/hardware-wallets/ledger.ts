import {
  LedgerSignTypedDataParams,
} from '@metamask/eth-ledger-bridge-keyring';

import {
  ConsoleLogger,
  DeviceActionStatus,
  DeviceManagementKitBuilder,
} from '@ledgerhq/device-management-kit';
import {
  SignerEthBuilder,
} from '@ledgerhq/device-signer-kit-ethereum';
import {
  webHidTransportFactory,
} from '@ledgerhq/device-transport-kit-web-hid';

import { filter, firstValueFrom } from 'rxjs';

import {
  LedgerAction,
  OffscreenCommunicationEvents,
  OffscreenCommunicationTarget,
} from '../../../shared/constants/offscreen-communication';
import { LEDGER_USB_VENDOR_ID } from '../../../shared/constants/hardware-wallets';

function isWebHIDSupported(): boolean {
  return (
    typeof navigator !== 'undefined' && typeof navigator.hid !== 'undefined'
  );
}

type Dmk = InstanceType<typeof DeviceManagementKitBuilder> extends { build(): infer T } ? T : never;

let dmk: Dmk | null = null;
let dmkInitPromise: Promise<Dmk> | null = null;
let sessionId: string | null = null;

function initDmk(): Dmk {
  return new DeviceManagementKitBuilder()
    .addLogger(new ConsoleLogger())
    .addTransport(webHidTransportFactory)
    .build();
}

async function getDmk(): Promise<Dmk> {
  if (!dmk) {
    if (!dmkInitPromise) {
      dmkInitPromise = Promise.resolve(initDmk());
    }
    dmk = await dmkInitPromise;
  }
  return dmk;
}

async function getSigner() {
  if (!sessionId) {
    console.debug('[LedgerOffscreen] getSigner() — no session, discovering device...');
    const kit = await getDmk();
    const discovered$ = kit.startDiscovering({});
    const device = await firstValueFrom(discovered$);
    if (!device) {
      throw new Error('No Ledger device found');
    }
    console.debug('[LedgerOffscreen] getSigner() — device discovered, connecting...');
    sessionId = await kit.connect({ device });
    console.debug('[LedgerOffscreen] getSigner() — session established', JSON.stringify({
      sessionId,
    }));
  }

  const kit = await getDmk();
  const signerEth = new SignerEthBuilder({ dmk: kit, sessionId }).build();

  return { signerEth };
}

function hexToBytes(hex: string): Uint8Array {
  const clean = hex.startsWith('0x') ? hex.slice(2) : hex;
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < clean.length; i += 2) {
    bytes[i / 2] = parseInt(clean.substring(i, i + 2), 16);
  }
  return bytes;
}

function stripHexPrefix(value: string): string {
  return value.startsWith('0x') ? value.slice(2) : value;
}

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/naming-convention */
async function extractSignature(
  observable: any,
): Promise<{ v: number; r: string; s: string }> {
  const state = (await firstValueFrom(
    observable.pipe(filter((s: any) => s.status === DeviceActionStatus.Completed)),
  )) as { output: { v: number; r: string; s: string } };
  if (!state.output) {
    throw new Error(`Signing failed: no output in completed state`);
  }
  return {
    v: state.output.v,
    r: stripHexPrefix(state.output.r),
    s: stripHexPrefix(state.output.s),
  };
}

/**
 * Serializes an error for transmission across message boundaries.
 * Preserves statusCode for TransportStatusError.
 *
 * @param error - The error to serialize.
 * @returns Serialized error object.
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

export class LedgerOffscreenHandler {
  /**
   * Sets up HID device event listeners for connect/disconnect events.
   */
  private setupDeviceEventListeners(): void {
    if (!isWebHIDSupported()) {
      console.warn('WebHID not supported, skipping device event listeners');
      return;
    }

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
  private setupMessageListener(): void {
    console.debug('[LedgerOffscreen] Setting up message listener');
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

        console.debug('[LedgerOffscreen] Received message', JSON.stringify({
          action: msg.action,
          hasParams: Boolean(msg.params),
        }));

        this.handleLedgerAction(msg.action, msg.params)
          .then((result) => {
            console.debug('[LedgerOffscreen] Action succeeded', JSON.stringify({
              action: msg.action,
            }));
            sendResponse({
              success: true,
              payload: result,
            });
          })
          .catch((error) => {
            console.error('[LedgerOffscreen] Action failed', JSON.stringify({
              action: msg.action,
              errorMessage: error instanceof Error ? error.message : String(error),
              errorName: error instanceof Error ? error.name : undefined,
            }));
            sendResponse({
              success: false,
              payload: {
                error: serializeError(error),
              },
            });
          })
          .finally(() => {
            // DMK session persists across actions
          });

        // Return true to indicate we will send response asynchronously
        return true;
      },
    );
  }

  /**
   * Handles a Ledger action and returns the result.
   *
   * @param action - The Ledger action to perform.
   * @param params - Optional parameters for the action.
   * @returns The result of the action.
   */
  private async handleLedgerAction(
    action: LedgerAction,
    params?: Record<string, unknown>,
  ): Promise<unknown> {
    console.debug('[LedgerOffscreen] handleLedgerAction', JSON.stringify({
      action,
      sessionId,
      hasParams: Boolean(params),
    }));
    switch (action) {
      case LedgerAction.makeApp:
        console.debug('[LedgerOffscreen] makeApp — no-op (DMK manages sessions lazily)');
        return true;

      case LedgerAction.updateTransport:
        console.debug('[LedgerOffscreen] updateTransport — no-op (DMK uses WebHID)');
        return true;

      case LedgerAction.getAppNameAndVersion: {
        console.debug('[LedgerOffscreen] getAppNameAndVersion — starting');
        const kit = await getDmk();
        if (!sessionId) {
          console.debug('[LedgerOffscreen] getAppNameAndVersion — discovering device...');
          const discovered$ = kit.startDiscovering({});
          const device = await firstValueFrom(discovered$);
          if (!device) {throw new Error('No Ledger device found');}
          sessionId = await kit.connect({ device });
          console.debug('[LedgerOffscreen] getAppNameAndVersion — connected', JSON.stringify({ sessionId }));
        }
        const state$ = kit.getDeviceSessionState({ sessionId });
        const state = (await firstValueFrom(state$)) as Record<string, unknown>;
        if (
          !('sessionStateType' in state) ||
          (state.sessionStateType !== 1 && state.sessionStateType !== 2) ||
          !('currentApp' in state) ||
          !state.currentApp
        ) {
          throw new Error('Device session not ready');
        }
        const currentApp = state.currentApp as { name: string; version: string };
        return { appName: currentApp.name, version: currentApp.version };
      }

      case LedgerAction.getAppConfiguration:
        return {
          arbitraryDataEnabled: 1,
          erc20ProvisioningNecessary: 0,
          starkEnabled: 0,
          starkv2Supported: 0,
          version: '',
        };

      case LedgerAction.getPublicKey: {
        if (!params?.hdPath || typeof params.hdPath !== 'string') {
          throw new Error('Missing hdPath parameter');
        }
        console.debug('[LedgerOffscreen] getPublicKey', JSON.stringify({ hdPath: params.hdPath }));
        const { signerEth } = await getSigner();
        const { observable } = signerEth.getAddress(params.hdPath, { returnChainCode: true });
        const state = (await firstValueFrom(observable)) as { status: unknown; output?: unknown };
        if (state.status !== DeviceActionStatus.Completed || !state.output) {
          throw new Error(`getAddress failed: ${String(state.status)}`);
        }
        const out = state.output as { publicKey: string; address: string; chainCode?: string };
        console.debug('[LedgerOffscreen] getPublicKey succeeded', JSON.stringify({ address: out.address }));
        return { publicKey: out.publicKey, address: out.address, chainCode: out.chainCode };
      }

      case LedgerAction.signTransaction: {
        if (!params?.hdPath || typeof params.hdPath !== 'string' || !params?.tx || typeof params.tx !== 'string') {
          throw new Error('Missing hdPath or tx parameter');
        }
        const { signerEth } = await getSigner();
        const txBytes = hexToBytes(params.tx);
        const { observable } = signerEth.signTransaction(params.hdPath, txBytes);
        return extractSignature(observable);
      }

      case LedgerAction.signPersonalMessage: {
        if (!params?.hdPath || typeof params.hdPath !== 'string' || !params?.message || typeof params.message !== 'string') {
          throw new Error('Missing hdPath or message parameter');
        }
        const { signerEth } = await getSigner();
        const { observable } = signerEth.signMessage(params.hdPath, params.message);
        return extractSignature(observable);
      }

      case LedgerAction.signTypedData: {
        if (!params?.hdPath || typeof params.hdPath !== 'string' || !params?.message || typeof params.message !== 'object') {
          throw new Error('Missing hdPath or message parameter');
        }
        const { signerEth } = await getSigner();
        const msg = params.message as LedgerSignTypedDataParams['message'];
        const typedData = {
          domain: msg.domain ?? {},
          types: msg.types as Record<string, { name: string; type: string }[]>,
          primaryType: msg.primaryType ?? '',
          message: (msg.message ?? {}) as Record<string, unknown>,
        };
        const { observable } = signerEth.signTypedData(params.hdPath, typedData);
        return extractSignature(observable);
      }

      case LedgerAction.signEip7702Authorization: {
        if (!params?.hdPath || typeof params.hdPath !== 'string' || typeof params?.chainId !== 'number' || typeof params?.contractAddress !== 'string' || typeof params?.nonce !== 'number') {
          throw new Error('Missing required parameters for EIP-7702 authorization signing');
        }
        const { signerEth } = await getSigner();
        const { observable } = signerEth.signDelegationAuthorization(
          params.hdPath, params.chainId, params.contractAddress, params.nonce,
        );
        return extractSignature(observable);
      }

      default:
        throw new Error(`Unknown Ledger action: ${action as string}`);
    }
  }

  /**
   * Initializes the Ledger offscreen handler.
   * Sets up device event listeners and message handlers.
   */
  async init(): Promise<void> {
    console.debug('[LedgerOffscreen] init() — starting');
    this.setupDeviceEventListeners();
    this.setupMessageListener();
    console.debug('[LedgerOffscreen] init() — listeners registered');

    // Check if there's already a permitted device connected
    if (!isWebHIDSupported()) {
      console.warn(
        '[LedgerOffscreen] WebHID not supported, Ledger functionality will be limited',
      );
      return;
    }

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
      console.error('[LedgerOffscreen] Error checking for permitted Ledger devices:', error);
    }
    console.debug('[LedgerOffscreen] init() — complete');
  }
}

export default async function init(): Promise<void> {
  console.debug('[LedgerOffscreen] Module init() — creating handler');
  const handler = new LedgerOffscreenHandler();
  await handler.init();
  console.debug('[LedgerOffscreen] Module init() — handler ready');
}
