import { Wallet } from '@metamask/wallet';
import { Json } from '@metamask/utils';
import { RootMessenger } from '../lib/messenger';
import { getKeyringBuilders } from './keyrings';
import { Encryptor } from '@metamask/keyring-controller';

export function initializeWallet({
  messenger,
  state,
  encryptor,
}: {
  messenger: RootMessenger;
  state: Record<string, Record<string, Json>>;
  encryptor?: Encryptor;
}) {
  return new Wallet({
    messenger,
    state,
    instanceOptions: {
      keyringController: {
        encryptor,
        keyringBuilders: getKeyringBuilders(messenger),
      },
    },
  });
}
