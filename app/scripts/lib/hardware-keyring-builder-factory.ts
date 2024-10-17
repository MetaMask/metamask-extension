import type { TrezorBridge } from '@metamask/eth-trezor-keyring';
import type {
  LedgerBridge,
  LedgerBridgeOptions,
} from '@metamask/eth-ledger-bridge-keyring';
import { KeyringClass, Json } from '@metamask/utils';
import { FakeKeyringBridge } from '../../../test/stub/keyring-bridge';

/**
 * A transport bridge between the keyring and the hardware device.
 */
export type HardwareTransportBridgeClass =
  | (new () => TrezorBridge)
  | (new () => LedgerBridge<LedgerBridgeOptions>)
  | (new () => FakeKeyringBridge);

/**
 * Get builder function for Hardware keyrings which require an additional `opts`
 * parameter, used to pass the transport bridge used by the keyring.
 *
 * Returns a builder function for `Keyring` with a `type` property.
 *
 * @param Keyring - The Keyring class for the builder.
 * @param Bridge - The transport bridge class to use for the given Keyring.
 * @returns A builder function for the given Keyring.
 */
export function hardwareKeyringBuilderFactory(
  Keyring: KeyringClass<Json>,
  Bridge: HardwareTransportBridgeClass,
) {
  const builder = () => new Keyring({ bridge: new Bridge() });

  builder.type = Keyring.type;

  return builder;
}
