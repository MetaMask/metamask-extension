import {
  QrKeyringBridge,
  QrKeyringScannerBridgeOptions,
} from '@metamask/eth-qr-keyring';
import { Json, KeyringClass } from '@metamask/utils';

/**
 * Get builder function for a QR-based keyring, that requires a bridge
 * set up with hooks to request scanning of QR codes.
 *
 * @param Keyring - The Keyring class for the builder.
 * @param Bridge - The transport bridge class to use for the given Keyring.
 * @param bridgeHooks - The hooks to use for the bridge.
 * @returns Returns a builder function for `Keyring` with a `type` property.
 */
export function qrKeyringBuilderFactory(
  Keyring: KeyringClass<Json>,
  Bridge: new (hooks: QrKeyringScannerBridgeOptions) => QrKeyringBridge,
  bridgeHooks: QrKeyringScannerBridgeOptions,
) {
  const builder = () => new Keyring({ bridge: new Bridge(bridgeHooks) });

  builder.type = Keyring.type;

  return builder;
}
