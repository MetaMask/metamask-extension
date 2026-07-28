import { TrezorBridge } from '@metamask/eth-trezor-keyring';
import type {
  EthereumSignMessage,
  EthereumSignTransaction,
  Params,
  EthereumSignTypedDataTypes,
  ConnectSettings,
  Manifest,
  Response as TrezorResponse,
  EthereumSignedTx,
  PROTO,
  EthereumSignTypedHash,
  Features,
} from '@trezor/connect-web';
import {
  OffscreenCommunicationEvents,
  OffscreenCommunicationTarget,
  TrezorAction,
  TrezorDevice,
} from '../../../../shared/constants/offscreen-communication';
import { withTrezorDeviceTimeout } from './with-trezor-device-timeout';

/**
 * This class is used as a custom bridge for the Trezor connection. Every
 * hardware wallet keyring also requires a bridge that has a known interface
 * that the keyring can call into for specific functions. The bridge then makes
 * whatever calls or requests it needs to in order to fulfill the request from
 * the keyring. In this case, the bridge is used to communicate with the
 * Offscreen Document. Inside the Offscreen document the trezor script is
 * loaded and registers a listener for these calls and communicate with the
 * trezor/connect-web library.
 */
export class TrezorOffscreenBridge implements TrezorBridge {
  model: string | undefined;

  minorVersion: number | undefined;

  /**
   * Stable per-device identity (Trezor's `features.device_id`). Unset until
   * the owning keyring learns it (see `TrezorKeyring#captureDeviceId`), at
   * which point every subsequent call below is routed to this specific
   * physical device by the offscreen document, even while other devices are
   * connected at the same time.
   */
  deviceId: string | undefined;

  init(
    settings: {
      manifest: Manifest;
    } & Partial<ConnectSettings>,
  ) {
    chrome.runtime.onMessage.addListener((msg) => {
      if (
        msg.target !== OffscreenCommunicationTarget.extension ||
        msg.event !== OffscreenCommunicationEvents.trezorDeviceConnect
      ) {
        return;
      }

      const payload = msg.payload as TrezorDevice;
      // Every bridge instance (one per paired device) registers this same
      // listener, and `chrome.runtime.onMessage` broadcasts every event to
      // every listener regardless of which device it concerns. Only update
      // this bridge's model/version hint from events for its own device
      // (once known), or from any device while pairing (deviceId not yet
      // known), so a second device connecting cannot clobber the model
      // shown for this one.
      if (this.deviceId && payload.deviceId !== this.deviceId) {
        return;
      }

      this.model = payload.model;
      this.minorVersion = payload.minorVersion;
    });

    return new Promise<void>((resolve) => {
      chrome.runtime.sendMessage(
        {
          target: OffscreenCommunicationTarget.trezorOffscreen,
          action: TrezorAction.init,
          params: settings,
        },
        () => {
          resolve();
        },
      );
    });
  }

  dispose() {
    return new Promise<void>((resolve) => {
      chrome.runtime.sendMessage(
        {
          target: OffscreenCommunicationTarget.trezorOffscreen,
          action: TrezorAction.dispose,
        },
        () => {
          resolve();
        },
      );
    });
  }

  /**
   * Send a message to the Offscreen Document and wait for its response,
   * rejecting if the device does not respond within
   * {@link TREZOR_DEVICE_OPERATION_TIMEOUT_MS}.
   *
   * @param message - The message to forward to the Offscreen Document.
   * @param message.target - The target of the message.
   * @param message.action - The Trezor action being requested.
   * @param message.params - The parameters for the Trezor action.
   * @returns The response from the Offscreen Document.
   */
  #sendDeviceMessage<ResponseType>(message: {
    target: OffscreenCommunicationTarget;
    action: TrezorAction;
    params?: unknown;
  }): Promise<ResponseType> {
    const responsePromise = new Promise<ResponseType>((resolve) => {
      chrome.runtime.sendMessage(
        { ...message, deviceId: this.deviceId },
        (response) => {
          resolve(response as ResponseType);
        },
      );
    });

    return withTrezorDeviceTimeout(responsePromise);
  }

  getPublicKey(params: { path: string; coin: string }) {
    return this.#sendDeviceMessage({
      target: OffscreenCommunicationTarget.trezorOffscreen,
      action: TrezorAction.getPublicKey,
      params,
    }) as TrezorResponse<{ publicKey: string; chainCode: string }>;
  }

  ethereumSignTransaction(params: Params<EthereumSignTransaction>) {
    return this.#sendDeviceMessage({
      target: OffscreenCommunicationTarget.trezorOffscreen,
      action: TrezorAction.signTransaction,
      params,
    }) as TrezorResponse<EthereumSignedTx>;
  }

  ethereumSignMessage(params: Params<EthereumSignMessage>) {
    return this.#sendDeviceMessage({
      target: OffscreenCommunicationTarget.trezorOffscreen,
      action: TrezorAction.signMessage,
      params,
    }) as TrezorResponse<PROTO.MessageSignature>;
  }

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  ethereumSignTypedData<T extends EthereumSignTypedDataTypes>(
    params: Params<EthereumSignTypedHash<T>>,
  ) {
    return this.#sendDeviceMessage({
      target: OffscreenCommunicationTarget.trezorOffscreen,
      action: TrezorAction.signTypedData,
      params,
    }) as TrezorResponse<PROTO.EthereumTypedDataSignature>;
  }

  getFeatures() {
    return this.#sendDeviceMessage({
      target: OffscreenCommunicationTarget.trezorOffscreen,
      action: TrezorAction.getFeatures,
    }) as TrezorResponse<Features>;
  }

  /**
   * Identifies the physical device the user picks in TrezorConnect's popup /
   * the browser's WebUSB chooser, via an *unpinned* `getFeatures` call
   * (`this.deviceId` is deliberately not applied). This is the pairing entry
   * point: a never-paired device is invisible to the offscreen registry, so
   * identity must be established by contacting it first — the returned
   * `features.device_id` then decides whether it maps to an existing keyring
   * or a new one.
   */
  identifyDevice() {
    return this.#sendDeviceMessage({
      target: OffscreenCommunicationTarget.trezorOffscreen,
      action: TrezorAction.identifyDevice,
    }) as TrezorResponse<Features>;
  }
}
