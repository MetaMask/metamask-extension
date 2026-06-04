import { TrezorConnect as SuiteDesktopConnect } from '@trezor/connect-web/lib/impl/core-in-suite-desktop';
import { DEVICE_EVENT, DEVICE } from '@trezor/connect-web';
import type { TrezorBridge } from '@metamask/eth-trezor-keyring';
import type {
  ConnectSettings,
  EthereumSignedTx,
  Manifest,
  PROTO,
  Response,
  Params,
  EthereumSignMessage,
  EthereumSignTransaction,
  EthereumSignTypedDataTypes,
  EthereumSignTypedHash,
  Features,
} from '@trezor/connect-web';

const SUITE_DESKTOP_ERROR_CODE = 'Desktop_ConnectionMissing';

const SUITE_DESKTOP_REQUIRED_ERROR =
  'Trezor Suite Desktop is required to use Trezor with Firefox. ' +
  'Please install and open Trezor Suite (suite.trezor.io) and try again.';

// The resolved value type of Response<T> = Promise<SuccessWithDevice<T> | Unsuccessful>.
// `.then()` callbacks receive this type, not the Promise itself.
type TrezorResult<T> =
  | { success: true; payload: T }
  | { success: false; payload: { error: string; code?: string } };

/**
 * Re-map Desktop_ConnectionMissing to a user-readable message.
 * CoreInSuiteDesktop.call() always resolves (never throws), returning
 * { success: false, payload: { code: 'Desktop_ConnectionMissing' } }
 * when Suite Desktop is unreachable.
 */
function mapError<T>(result: TrezorResult<T>): TrezorResult<T> {
  if (!result.success && result.payload.code === SUITE_DESKTOP_ERROR_CODE) {
    return {
      success: false,
      payload: {
        error: SUITE_DESKTOP_REQUIRED_ERROR,
        code: SUITE_DESKTOP_ERROR_CODE,
      },
    };
  }
  return result;
}

/**
 * Firefox MV2 bridge for Trezor Hardware keyring.
 *
 * Firefox MV2 does not support chrome.offscreen (MV3 only), so the standard
 * TrezorOffscreenBridge cannot be used. The remote iframe used by
 * @trezor/connect-web v9 in webextension mode hangs indefinitely in Firefox MV2
 * because IFRAME.LOADED is never received. Using the main @trezor/connect-web
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
    } catch (err) {
      // #initiated stays false so a retry after the user opens Suite Desktop
      // will re-attempt the connection.
      if ((err as { code?: string })?.code === SUITE_DESKTOP_ERROR_CODE) {
        throw new Error(SUITE_DESKTOP_REQUIRED_ERROR);
      }
      throw err;
    }
  }

  async dispose(): Promise<void> {
    this.#initiated = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (SuiteDesktopConnect as any).dispose();
  }

  getPublicKey(params: {
    path: string;
    coin: string;
  }): Response<{ publicKey: string; chainCode: string }> {
    return (
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (SuiteDesktopConnect as any)
        .getPublicKey(params)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .then((r: any) =>
          mapError<{ publicKey: string; chainCode: string }>(r),
        ) as unknown as Response<{ publicKey: string; chainCode: string }>
    );
  }

  ethereumSignTransaction(
    params: Params<EthereumSignTransaction>,
  ): Response<EthereumSignedTx> {
    return (
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (SuiteDesktopConnect as any)
        .ethereumSignTransaction(params)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .then((r: any) =>
          mapError<EthereumSignedTx>(r),
        ) as unknown as Response<EthereumSignedTx>
    );
  }

  ethereumSignMessage(
    params: Params<EthereumSignMessage>,
  ): Response<PROTO.MessageSignature> {
    return (
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (SuiteDesktopConnect as any)
        .ethereumSignMessage(params)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .then((r: any) =>
          mapError<PROTO.MessageSignature>(r),
        ) as unknown as Response<PROTO.MessageSignature>
    );
  }

  ethereumSignTypedData<T extends EthereumSignTypedDataTypes>(
    params: Params<EthereumSignTypedHash<T>>,
  ): Response<PROTO.EthereumTypedDataSignature> {
    return (
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (SuiteDesktopConnect as any)
        .ethereumSignTypedData(params)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .then((r: any) =>
          mapError<PROTO.EthereumTypedDataSignature>(r),
        ) as unknown as Response<PROTO.EthereumTypedDataSignature>
    );
  }

  getFeatures(): Response<Features> {
    return (
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (SuiteDesktopConnect as any)
        .getFeatures()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .then((r: any) =>
          mapError<Features>(r),
        ) as unknown as Response<Features>
    );
  }
}
