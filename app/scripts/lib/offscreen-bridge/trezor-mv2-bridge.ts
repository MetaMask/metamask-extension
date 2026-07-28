import { TrezorConnect as SuiteDesktopConnect } from '@trezor/connect-web/lib/impl/core-in-suite-desktop';
import { DEVICE_EVENT, DEVICE } from '@trezor/connect-web';
import type { TrezorBridge } from '@metamask/eth-trezor-keyring';
import type {
  ConnectSettings,
  EthereumSignedTx,
  Manifest,
  PROTO,
  Response as TrezorResponse,
  Params,
  EthereumSignMessage,
  EthereumSignTransaction,
  EthereumSignTypedDataTypes,
  EthereumSignTypedHash,
  Features,
} from '@trezor/connect-web';
import { TREZOR_DESKTOP_CONNECTION_MISSING_CODE } from '../../../../shared/constants/hardware-wallets';
import { TrezorDevice } from '../../../../shared/constants/offscreen-communication';
import { withTrezorDeviceTimeout } from './with-trezor-device-timeout';

/**
 * Devices currently known to be connected, keyed by their stable
 * `features.device_id`. Shared at module scope (mirroring the MV3 offscreen
 * document's registry) because every `TrezorMv2Bridge` instance in this
 * background page talks to the same `SuiteDesktopConnect` singleton and
 * would otherwise see every other bridge's `DEVICE_EVENT`s.
 */
const devices = new Map<string, TrezorDevice>();

function upsertDevice(features: Features, path: string) {
  if (!features.device_id) {
    return;
  }

  devices.set(features.device_id, {
    deviceId: features.device_id,
    path,
    label: features.label ?? undefined,
    model: features.model,
  });
}

function removeDeviceByPath(path: string) {
  for (const [deviceId, device] of devices) {
    if (device.path === path) {
      devices.delete(deviceId);
      break;
    }
  }
}

function deviceParam(deviceId?: string) {
  const device = deviceId ? devices.get(deviceId) : undefined;
  return device ? { device: { path: device.path } } : {};
}

// `SuiteDesktopConnect` is a singleton shared by every Trezor/OneKey keyring
// instance (one per paired device). It is initialized once and the
// `DEVICE_EVENT` listener registered once, so pairing or using a second
// device never disposes or duplicates another device's session.
let initPromise: Promise<void> | undefined;
let listenerAdded = false;
// KeyringController calls `bridge.dispose()` once per keyring instance (on
// removal or wallet lock); the real teardown is deferred until every
// keyring sharing this singleton has disposed, for the same reason as the
// MV3 offscreen document (see `app/offscreen/hardware-wallets/trezor.ts`).
let activeBridgeCount = 0;

// The resolved value type of TrezorResponse<T> = Promise<SuccessWithDevice<T> | Unsuccessful>.
// `.then()` callbacks receive this type, not the Promise itself.
type TrezorResult<PayloadType> =
  | { success: true; payload: PayloadType }
  | { success: false; payload: { error: string; code?: string } };

/**
 * Re-map Desktop_ConnectionMissing to a machine-readable error code.
 * CoreInSuiteDesktop.call() always resolves (never throws), returning
 * { success: false, payload: { code: 'Desktop_ConnectionMissing' } }
 * when Suite Desktop is unreachable.
 *
 * Translation to user-facing copy happens in the UI layer.
 *
 * @param result - Trezor SDK response to normalize on connection failure.
 * @returns The original result, or a normalized error when Suite Desktop is missing.
 */
function mapError<PayloadType>(
  result: TrezorResult<PayloadType>,
): TrezorResult<PayloadType> {
  if (
    !result.success &&
    result.payload.code === TREZOR_DESKTOP_CONNECTION_MISSING_CODE
  ) {
    return {
      success: false,
      payload: {
        error: TREZOR_DESKTOP_CONNECTION_MISSING_CODE,
        code: TREZOR_DESKTOP_CONNECTION_MISSING_CODE,
      },
    };
  }
  return result;
}

/**
 * Create an error that preserves the Trezor SDK code for UI-layer translation.
 *
 * @returns Error tagged with the Trezor SDK code.
 */
function createSuiteDesktopMissingError(): Error {
  return Object.assign(new Error(TREZOR_DESKTOP_CONNECTION_MISSING_CODE), {
    code: TREZOR_DESKTOP_CONNECTION_MISSING_CODE,
  });
}

/**
 * Firefox MV2 bridge for Trezor Hardware keyring.
 *
 * Firefox MV2 does not support chrome.offscreen (MV3 only), so the standard
 * TrezorOffscreenBridge cannot be used. The remote iframe used by
 * `@trezor/connect-web` v9 in webextension mode hangs indefinitely in Firefox MV2
 * because IFRAME.LOADED is never received. Using the main `@trezor/connect-web`
 * export (TrezorConnectDynamic) with coreMode:'suite-desktop' also hangs:
 * when Suite Desktop is absent, TrezorConnectDynamic intercepts the
 * Desktop_ConnectionMissing response and falls back to the hanging iframe.
 *
 * This bridge imports CoreInSuiteDesktop's own TrezorConnect instance directly,
 * bypassing TrezorConnectDynamic. CoreInSuiteDesktop connects to Trezor Suite
 * Desktop via WebSocket and handles all failures internally — it never touches
 * the iframe. When Suite Desktop is absent, calls resolve immediately with a
 * clear error response.
 */
export class TrezorMv2Bridge implements TrezorBridge {
  /**
   * Stable per-device identity (Trezor's `features.device_id`). Unset until
   * the owning keyring learns it (see `TrezorKeyring#captureDeviceId`), at
   * which point every subsequent call below is routed to this specific
   * physical device, even while other devices are connected at the same
   * time.
   */
  deviceId: string | undefined;

  /**
   * The model reported by this bridge's own device once `deviceId` is
   * known. Before pairing (deviceId unset), falls back to the sole
   * currently-connected device's model as a display hint while the user
   * is connecting it — `SuiteDesktopConnect` is a shared singleton, so this
   * cannot be derived per-instance any other way.
   */
  get model(): string | undefined {
    if (this.deviceId) {
      return devices.get(this.deviceId)?.model;
    }
    return devices.size === 1 ? [...devices.values()][0].model : undefined;
  }

  async init(
    settings: { manifest: Manifest } & Partial<ConnectSettings>,
  ): Promise<void> {
    activeBridgeCount += 1;

    if (!listenerAdded) {
      // SuiteDesktopConnect properties resolve to `any` via the & Record<string, any>
      // intersection in its type, so the event listener is untyped here.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      SuiteDesktopConnect.on(DEVICE_EVENT as any, (event: any) => {
        switch (event?.type) {
          case DEVICE.CONNECT:
          case DEVICE.CHANGED: {
            const features = event?.payload?.features;
            const path = event?.payload?.path;
            if (features?.device_id && path) {
              upsertDevice(features, path);
            }
            break;
          }
          case DEVICE.DISCONNECT:
            if (event?.payload?.path) {
              removeDeviceByPath(event.payload.path);
            }
            break;
          default:
            break;
        }
      });
      listenerAdded = true;
    }

    if (!initPromise) {
      initPromise = (async () => {
        try {
          // init() on CoreInSuiteDesktop opens a WebSocket to Suite Desktop.
          // It throws Desktop_ConnectionMissing if the connection cannot be made.
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (SuiteDesktopConnect as any).init(settings);
        } catch (err: unknown) {
          // Allow a future `init` call to retry after a hard failure
          // (e.g. once the user opens Suite Desktop) instead of getting
          // stuck on a rejected promise forever.
          initPromise = undefined;
          if (
            typeof err === 'object' &&
            err !== null &&
            (err as { code?: unknown }).code ===
              TREZOR_DESKTOP_CONNECTION_MISSING_CODE
          ) {
            throw createSuiteDesktopMissingError();
          }
          if (err instanceof Error) {
            throw err;
          }
          throw new Error(String(err));
        }
      })();
    }

    return initPromise;
  }

  async dispose(): Promise<void> {
    activeBridgeCount = Math.max(0, activeBridgeCount - 1);
    if (activeBridgeCount > 0) {
      return;
    }

    initPromise = undefined;
    devices.clear();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (SuiteDesktopConnect as any).dispose();
  }

  getPublicKey(params: {
    path: string;
    coin: string;
  }): TrezorResponse<{ publicKey: string; chainCode: string }> {
    return withTrezorDeviceTimeout(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (SuiteDesktopConnect as any)
        .getPublicKey({ ...params, ...deviceParam(this.deviceId) })
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .then((r: any) =>
          mapError<{ publicKey: string; chainCode: string }>(r),
        ),
    ) as unknown as TrezorResponse<{ publicKey: string; chainCode: string }>;
  }

  ethereumSignTransaction(
    params: Params<EthereumSignTransaction>,
  ): TrezorResponse<EthereumSignedTx> {
    return withTrezorDeviceTimeout(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (SuiteDesktopConnect as any)
        .ethereumSignTransaction({ ...params, ...deviceParam(this.deviceId) })
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .then((r: any) => mapError<EthereumSignedTx>(r)),
    ) as unknown as TrezorResponse<EthereumSignedTx>;
  }

  ethereumSignMessage(
    params: Params<EthereumSignMessage>,
  ): TrezorResponse<PROTO.MessageSignature> {
    return withTrezorDeviceTimeout(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (SuiteDesktopConnect as any)
        .ethereumSignMessage({ ...params, ...deviceParam(this.deviceId) })
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .then((r: any) => mapError<PROTO.MessageSignature>(r)),
    ) as unknown as TrezorResponse<PROTO.MessageSignature>;
  }

  ethereumSignTypedData<TypedDataType extends EthereumSignTypedDataTypes>(
    params: Params<EthereumSignTypedHash<TypedDataType>>,
  ): TrezorResponse<PROTO.EthereumTypedDataSignature> {
    return withTrezorDeviceTimeout(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (SuiteDesktopConnect as any)
        .ethereumSignTypedData({ ...params, ...deviceParam(this.deviceId) })
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .then((r: any) => mapError<PROTO.EthereumTypedDataSignature>(r)),
    ) as unknown as TrezorResponse<PROTO.EthereumTypedDataSignature>;
  }

  getFeatures(): TrezorResponse<Features> {
    return withTrezorDeviceTimeout(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (SuiteDesktopConnect as any)
        .getFeatures(deviceParam(this.deviceId))
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .then((r: any) => mapError<Features>(r)),
    ) as unknown as TrezorResponse<Features>;
  }

  /**
   * Lists every Trezor device currently connected to Suite Desktop,
   * regardless of whether it has been paired to a keyring yet.
   */
  async listDevices(): Promise<TrezorDevice[]> {
    return Array.from(devices.values());
  }
}
