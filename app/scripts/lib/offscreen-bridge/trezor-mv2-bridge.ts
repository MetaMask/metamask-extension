import { TrezorConnectBridge } from '@metamask/eth-trezor-keyring';
import type {
  ConnectSettings,
  Manifest,
  Params,
  EthereumSignMessage,
  EthereumSignTransaction,
  EthereumSignTypedDataTypes,
  EthereumSignTypedHash,
  EthereumSignedTx,
  PROTO,
  Response as TrezorResponse,
} from '@trezor/connect-web';

// How long to wait for a bridge call before surfacing a clear error.
// Trezor Suite Desktop connects via WebSocket within ~1-2 s when running.
// Without this timeout, a missing Suite Desktop causes @trezor/connect-web to
// fall back to its remote iframe path which hangs indefinitely in Firefox MV2.
const CALL_TIMEOUT_MS = 20_000;

const SUITE_DESKTOP_REQUIRED_ERROR =
  'Trezor Suite Desktop is required to use Trezor with Firefox. ' +
  'Please install and open Trezor Suite (suite.trezor.io) and try again.';

function withTimeout<T>(promise: TrezorResponse<T>): TrezorResponse<T> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(
      () => reject(new Error(SUITE_DESKTOP_REQUIRED_ERROR)),
      CALL_TIMEOUT_MS,
    ),
  );
  return Promise.race([promise, timeout]) as TrezorResponse<T>;
}

/**
 * Firefox MV2 bridge for Trezor Hardware keyring.
 *
 * Firefox MV2 does not support chrome.offscreen (MV3 only), so the standard
 * TrezorOffscreenBridge cannot be used. The remote iframe used by
 * @trezor/connect-web v9 in webextension mode hangs indefinitely in Firefox MV2
 * (IFRAME.LOADED is never received). Popup mode also has compatibility issues.
 *
 * This bridge forces coreMode: 'suite-desktop', which connects to Trezor Suite
 * Desktop via WebSocket. A per-call timeout prevents the UI from hanging
 * indefinitely when Suite Desktop is not running.
 */
export class TrezorMv2Bridge extends TrezorConnectBridge {
  async init(
    settings: { manifest: Manifest } & Partial<ConnectSettings>,
  ): Promise<void> {
    return await super.init({ ...settings, coreMode: 'suite-desktop' });
  }

  getPublicKey(params: { path: string; coin: string }) {
    return withTimeout(super.getPublicKey(params));
  }

  ethereumSignTransaction(
    params: Params<EthereumSignTransaction>,
  ): TrezorResponse<EthereumSignedTx> {
    return withTimeout(super.ethereumSignTransaction(params));
  }

  ethereumSignMessage(
    params: Params<EthereumSignMessage>,
  ): TrezorResponse<PROTO.MessageSignature> {
    return withTimeout(super.ethereumSignMessage(params));
  }

  ethereumSignTypedData<T extends EthereumSignTypedDataTypes>(
    params: Params<EthereumSignTypedHash<T>>,
  ): TrezorResponse<PROTO.EthereumTypedDataSignature> {
    return withTimeout(super.ethereumSignTypedData(params));
  }
}
