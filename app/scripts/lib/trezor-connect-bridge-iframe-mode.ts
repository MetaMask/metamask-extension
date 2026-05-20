import { TrezorConnectBridge } from '@metamask/eth-trezor-keyring';
import type {
  ConnectSettings,
  Manifest,
} from '@trezor/connect-web';

/**
 * A thin subclass of `TrezorConnectBridge` that forces
 * `coreMode: 'iframe'` when initializing the Trezor Connect SDK.
 *
 * Background: in `@trezor/connect-web@9.6.0` the default `coreMode` is
 * `'auto'`. That triggers two behaviors that don't have a working fallback
 * on Firefox without Trezor Suite Desktop running.
 *
 * First, before every SDK call, `handleBeforeCall` switches the target to
 * `core-in-suite-desktop`, which opens a WebSocket to
 * `ws://127.0.0.1:21335/connect-ws`. If the desktop app isn't running and
 * Firefox doesn't synchronously fire the `error` event for the refused
 * connection, the SDK waits on the 20s `DEFAULT_TIMEOUT` in
 * `@trezor/websocket-client` before falling back to the iframe path.
 *
 * Second, `CoreInIframe.init` issues a `TRANSPORT.GET_INFO` probe to the
 * iframe when `coreMode === 'auto'`. If no bridge or WebUSB transport is
 * available, it throws `Transport_Missing` — and the `core-in-popup`
 * fallback is explicitly disabled when `env === 'webextension'`. The
 * Trezor Connect popup at `connect.trezor.io` then has no terminal state
 * to render and stays in its loading screen.
 *
 * Forcing `'iframe'` skips both behaviors: the popup either pairs through
 * the iframe transport or renders Trezor's own "install desktop bridge"
 * UI, which is the pre-9.6 behavior we relied on.
 */
export class TrezorConnectBridgeIframeMode extends TrezorConnectBridge {
  async init(
    settings: {
      manifest: Manifest;
    } & Partial<ConnectSettings>,
  ): Promise<void> {
    return super.init({ ...settings, coreMode: 'iframe' });
  }
}
