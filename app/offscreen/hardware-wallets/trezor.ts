import TrezorConnectSDK, {
  DEVICE,
  DEVICE_EVENT,
  DeviceUniquePath,
  type Features,
} from '@trezor/connect-web';
import {
  OffscreenCommunicationEvents,
  OffscreenCommunicationTarget,
  TrezorAction,
  TrezorDevice,
} from '../../../shared/constants/offscreen-communication';

/**
 * Devices currently known to be connected, keyed by their stable
 * `features.device_id`. A device's transport `path` changes across
 * reconnects, so every request re-resolves it from this registry (kept
 * fresh via `DEVICE_EVENT`) instead of caching it anywhere long-lived.
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

/**
 * Resolves a `deviceId` to the `device` common param TrezorConnect uses to
 * target a specific physical device. Returns `{}` when `deviceId` is
 * unknown or omitted, letting TrezorConnect fall back to its own device
 * picker (used the first time a not-yet-paired device is contacted).
 *
 * @param deviceId - The physical device's stable `device_id`, if known.
 */
function deviceParam(deviceId?: string) {
  const device = deviceId ? devices.get(deviceId) : undefined;
  return device ? { device: { path: DeviceUniquePath(device.path) } } : {};
}

// `@trezor/connect-web`'s SDK is a singleton that lives for the lifetime of
// the offscreen document, independent of the background keyrings it serves.
// It is initialized exactly once and shared by every Trezor/OneKey keyring
// instance (one per paired device), so pairing or using a second device
// never tears down another device's session. Previously this handler
// disposed and re-initialized the SDK on every `init` call, which broke
// multi-device use by killing any other device's connection; now `init` is
// idempotent and only fails over (via `initPromise = undefined`) after a
// hard error, so a later call can retry.
let initPromise: Promise<void> | undefined;

// The KeyringController calls `bridge.init()`/`bridge.dispose()` once per
// keyring instance (on creation/restore and on removal or wallet lock,
// respectively) — every Trezor/OneKey keyring for every paired device
// shares this same offscreen document. Tearing down the SDK on the first
// `dispose()` would kill every other device's session (e.g. forgetting one
// Trezor while a second is still in use, or locking the wallet with two
// devices paired), so the real teardown is deferred until every keyring
// sharing this document has disposed.
let activeKeyringCount = 0;

// `params` is the caller-provided (untyped) init settings forwarded as-is
// from the bridge; it includes internal-only fields (e.g. `env`) that
// `InitFullSettings<ConnectSettingsWeb>` does not model.
// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function initTrezorConnect(params: any) {
  if (!initPromise) {
    initPromise = Promise.resolve()
      .then(() => {
        TrezorConnectSDK.on(DEVICE_EVENT, (event) => {
          switch (event.type) {
            case DEVICE.CONNECT:
            case DEVICE.CHANGED: {
              const { features, path } = event.payload;
              if (!features?.device_id) {
                break;
              }

              upsertDevice(features, path);
              chrome.runtime.sendMessage({
                target: OffscreenCommunicationTarget.extension,
                event: OffscreenCommunicationEvents.trezorDeviceConnect,
                payload: {
                  deviceId: features.device_id,
                  path,
                  label: features.label ?? undefined,
                  model: features.model,
                  minorVersion: features.minor_version,
                } satisfies TrezorDevice,
              });
              break;
            }

            case DEVICE.DISCONNECT:
              removeDeviceByPath(event.payload.path);
              break;

            default:
              break;
          }
        });

        return TrezorConnectSDK.init({
          ...params,
          env: 'webextension',
        });
      })
      .catch((error) => {
        // Allow a future `init` call to retry after a hard failure instead
        // of getting stuck on a rejected promise forever.
        initPromise = undefined;
        throw error;
      });
  }

  return initPromise;
}

/**
 * This listener is used to listen for messages targeting the Trezor Offscreen
 * handler. Each package sent has an action that is used to determine what calls
 * to the Trezor Connect SDK should be made. The response is then sent back to
 * the sender of the message, which in this case will be the
 * TrezorOffscreenBridge.
 */
export default function init() {
  chrome.runtime.onMessage.addListener(
    (
      msg: {
        target: string;
        action: TrezorAction;
        deviceId?: string;

        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        params: any;
      },
      _sender,
      sendResponse,
    ) => {
      if (msg.target !== OffscreenCommunicationTarget.trezorOffscreen) {
        return;
      }

      switch (msg.action) {
        case TrezorAction.init:
          activeKeyringCount += 1;
          initTrezorConnect(msg.params)
            .then(() => sendResponse())
            // Resolve the bridge even if init fails so it does not hang; the
            // subsequent call surfaces the real error to the UI.
            .catch(() => sendResponse());

          break;

        case TrezorAction.dispose:
          activeKeyringCount = Math.max(0, activeKeyringCount - 1);
          if (activeKeyringCount === 0) {
            // This removes the Trezor Connect iframe from the DOM
            // This method is not well documented, but the code it calls can be seen
            // here: https://github.com/trezor/connect/blob/dec4a56af8a65a6059fb5f63fa3c6690d2c37e00/src/js/iframe/builder.js#L181
            TrezorConnectSDK.dispose();
            initPromise = undefined;
            devices.clear();
          }

          sendResponse();

          break;

        case TrezorAction.identifyDevice:
          // Deliberately unpinned (no `device` param): TrezorConnect's popup
          // and the browser's WebUSB chooser let the user pick the physical
          // device — including one that has never been paired and is
          // therefore invisible to the registry. The resulting DEVICE.CONNECT
          // event also teaches the registry the device's current path, so
          // subsequent pinned calls can target it.
          TrezorConnectSDK.getFeatures().then((result) => {
            sendResponse(result);
          });

          break;

        case TrezorAction.getPublicKey:
          TrezorConnectSDK.getPublicKey({
            ...msg.params,
            ...deviceParam(msg.deviceId),
          }).then((result) => {
            sendResponse(result);
          });

          break;

        case TrezorAction.signTransaction:
          TrezorConnectSDK.ethereumSignTransaction({
            ...msg.params,
            ...deviceParam(msg.deviceId),
          }).then((result) => {
            sendResponse(result);
          });

          break;

        case TrezorAction.signMessage:
          TrezorConnectSDK.ethereumSignMessage({
            ...msg.params,
            ...deviceParam(msg.deviceId),
          }).then((result) => {
            sendResponse(result);
          });

          break;

        case TrezorAction.signTypedData:
          TrezorConnectSDK.ethereumSignTypedData({
            ...msg.params,
            ...deviceParam(msg.deviceId),
          }).then((result) => {
            sendResponse(result);
          });

          break;

        case TrezorAction.getFeatures:
          TrezorConnectSDK.getFeatures({
            ...deviceParam(msg.deviceId),
          }).then((result) => {
            sendResponse(result);
          });

          break;

        default:
          sendResponse({
            success: false,
            payload: {
              error: 'Trezor action not supported',
            },
          });
      }

      // This keeps sendResponse function valid after return
      // https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/runtime/onMessage
      return true;
    },
  );
}
