import type { KeyringControllerGetStateAction } from '@metamask/keyring-controller';
import log from 'loglevel';
import { HARDWARE_KEYRING_DEVICE_PROPERTY_MAP } from '../../constants/hardware-wallets';

export type HardwareTypeLookupMessenger = {
  call: (
    action: KeyringControllerGetStateAction['type'],
  ) => ReturnType<KeyringControllerGetStateAction['handler']>;
};

/**
 * Resolves the hardware wallet label expected by analytics / Sentinel for a
 * signer address. Best-effort: returns `undefined` when the signer is not a
 * hardware wallet or the keyring state lookup fails.
 *
 * @param messenger - Messenger capable of calling `KeyringController:getState`.
 * @param address - Signer address.
 * @returns Hardware device label, or `undefined`.
 */
export function getAccountHardwareType(
  messenger: HardwareTypeLookupMessenger,
  address?: string,
): string | undefined {
  if (!address) {
    return undefined;
  }

  try {
    const normalizedAddress = address.toLowerCase();
    const state = messenger.call('KeyringController:getState');
    const keyring = state?.keyrings?.find((entry) =>
      entry.accounts?.some(
        (account) => account.toLowerCase() === normalizedAddress,
      ),
    );

    return keyring?.type
      ? HARDWARE_KEYRING_DEVICE_PROPERTY_MAP[keyring.type]
      : undefined;
  } catch (error) {
    log.error('Failed to read signer hardware type', error);
    return undefined;
  }
}
