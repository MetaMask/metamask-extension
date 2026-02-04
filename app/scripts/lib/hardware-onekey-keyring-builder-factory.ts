import { type OneKeyBridge } from '@metamask/eth-onekey-keyring';
import { KeyringClass } from '@metamask/keyring-utils';
// eslint-disable-next-line import/no-restricted-paths
import { HARDWARE_ONEKEY_ERRORS_ROUTE } from '../../../ui/helpers/constants/routes';
import ExtensionPlatform from '../platforms/extension';

/**
 * A transport bridge between the keyring and the hardware device.
 */
export type HardwareTransportBridgeClass = new () => OneKeyBridge;

/**
 * Get builder function for Hardware keyrings which require an additional `opts`
 * parameter, used to pass the transport bridge used by the keyring.
 *
 * Returns a builder function for `Keyring` with a `type` property.
 *
 * @param Keyring - The Keyring class for the builder.
 * @param Bridge - The transport bridge class to use for the given Keyring.
 * @param platform - The platform to use for the given Keyring.
 * @returns A builder function for the given Keyring.
 */
export function hardwareOneKeyKeyringBuilderFactory(
  Keyring: KeyringClass,
  Bridge: HardwareTransportBridgeClass,
  platform?: ExtensionPlatform,
) {
  const builder = () => {
    const bridge = new Bridge();
    if (
      'setUiEventCallback' in bridge &&
      typeof bridge.setUiEventCallback === 'function'
    ) {
      bridge.setUiEventCallback((payload: { type: string; code: number }) => {
        platform?.openExtensionInBrowser?.(
          `${HARDWARE_ONEKEY_ERRORS_ROUTE}/${payload.type ?? payload.code}`,
        );
      });
    }

    return new Keyring({ bridge });
  };

  builder.type = Keyring.type;

  return builder;
}
