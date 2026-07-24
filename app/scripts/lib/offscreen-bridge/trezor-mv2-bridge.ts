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
import { withTrezorDeviceTimeout } from './with-trezor-device-timeout';

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
  model: string | undefined;

  #initiated = false;

  #listenerAdded = false;

  async init(
    settings: { manifest: Manifest } & Partial<ConnectSettings>,
  ): Promise<void> {
    if (!this.#listenerAdded) {
      // SuiteDesktopConnect properties resolve to `any` via the & Record<string, any>
      // intersection in its type, so the event listener is untyped here.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      SuiteDesktopConnect.on(DEVICE_EVENT as any, (event: any) => {
        if (event?.type !== DEVICE.CONNECT) {
          return;
        }
        this.model = event?.payload?.features?.model;
      });
      this.#listenerAdded = true;
    }

    if (this.#initiated) {
      return;
    }

    try {
      // init() on CoreInSuiteDesktop opens a WebSocket to Suite Desktop.
      // It throws Desktop_ConnectionMissing if the connection cannot be made.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (SuiteDesktopConnect as any).init(settings);
      this.#initiated = true;
    } catch (err: unknown) {
      // #initiated stays false so a retry after the user opens Suite Desktop
      // will re-attempt the connection.
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
  }

  async dispose(): Promise<void> {
    this.#initiated = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (SuiteDesktopConnect as any).dispose();
  }

  /**
   * Cancel any in-flight Trezor Connect call. This is used when the user closes
   * the connect screen while a request (such as a `getPublicKey` on a locked
   * device) is still pending. On Firefox MV2 the Suite Desktop transport keeps
   * such calls pending indefinitely, which keeps the `KeyringController`
   * operation mutex held by the surrounding keyring call and blocks Backup &
   * Sync. Cancelling settles the pending promise so that mutex is released. It
   * deliberately acts on the Suite Desktop connection singleton rather than
   * going through `withKeyringV2`, which would deadlock on the same held mutex.
   */
  async cancel(): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (SuiteDesktopConnect as any).cancel();
  }

  getPublicKey(params: {
    path: string;
    coin: string;
  }): TrezorResponse<{ publicKey: string; chainCode: string }> {
    return withTrezorDeviceTimeout(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (SuiteDesktopConnect as any)
        .getPublicKey(params)
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
        .ethereumSignTransaction(params)
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
        .ethereumSignMessage(params)
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
        .ethereumSignTypedData(params)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .then((r: any) => mapError<PROTO.EthereumTypedDataSignature>(r)),
    ) as unknown as TrezorResponse<PROTO.EthereumTypedDataSignature>;
  }

  getFeatures(): TrezorResponse<Features> {
    return withTrezorDeviceTimeout(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (SuiteDesktopConnect as any)
        .getFeatures()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .then((r: any) => mapError<Features>(r)),
    ) as unknown as TrezorResponse<Features>;
  }
}
