import { Wallet } from '@metamask/wallet';
import { Json } from '@metamask/utils';
import { Encryptor } from '@metamask/keyring-controller';
import { RootMessenger } from '../lib/messenger';
import { BrowserStorageAdapter } from '../../../shared/lib/stores/browser-storage-adapter';
import { ExtensionConnectivityAdapter } from '../controllers/connectivity';
import { getKeyringBuilders } from './keyrings';

export function initializeWallet({
  messenger,
  state,
  encryptor,
}: {
  messenger: RootMessenger;
  state: Record<string, Record<string, Json>>;
  encryptor?: Encryptor;
}) {
  // The extension detects connectivity in a separate context (MV3 offscreen
  // document / MV2 background page) and pushes the status in via the adapter,
  // so we keep a reference to drive it from `background.js`.
  const connectivityAdapter = new ExtensionConnectivityAdapter();

  const wallet = new Wallet({
    messenger,
    state,
    instanceOptions: {
      keyringController: {
        encryptor,
        keyringBuilders: getKeyringBuilders(messenger),
      },
      storageService: {
        storage: new BrowserStorageAdapter(),
      },
      connectivityController: {
        connectivityAdapter,
      },
    },
  });

  return { wallet, connectivityAdapter };
}
