import type { Encryptor } from '@metamask/keyring-controller';
import type { WalletOptions } from '@metamask/wallet';
import type { WalletInitMessenger } from '../types';
import { getKeyringBuilders, getKeyringV2Builders } from '../keyrings';

type KeyringControllerInstanceOptions = NonNullable<
  WalletOptions['instanceOptions']['keyringController']
>;

/**
 * Build the extension's `KeyringController` instance options.
 *
 * @param options - Options bag.
 * @param options.messenger - Needed to build the V1 keyring builders, some of
 * which interact with the shared bus.
 * @param options.encryptor - The extension's vault encryptor.
 * @returns The extension `KeyringController` instance options.
 */
export function getKeyringControllerInstanceOptions({
  messenger,
  encryptor,
}: {
  messenger: WalletInitMessenger;
  encryptor?: Encryptor;
}): KeyringControllerInstanceOptions {
  return {
    encryptor,
    keyringBuilders: getKeyringBuilders(messenger),
    keyringV2Builders: getKeyringV2Builders(),
  };
}
