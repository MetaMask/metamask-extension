import { Wallet } from '@metamask/wallet';
import { Json } from '@metamask/utils';
import { Encryptor } from '@metamask/keyring-controller';
import { RootMessenger } from '../lib/messenger';
import { BrowserStorageAdapter } from '../../../shared/lib/stores/browser-storage-adapter';
import { getKeyringBuilders, getKeyringV2Builders } from './keyrings';

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
        keyringV2Builders: getKeyringV2Builders(messenger),
      },
      storageService: {
        storage: new BrowserStorageAdapter(),
      },
    },
  });
}
