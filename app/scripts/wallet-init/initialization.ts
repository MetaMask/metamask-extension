import { Wallet } from '@metamask/wallet';
import { Json } from '@metamask/utils';
import { getKeyringBuilders } from './keyrings';
import { RootMessenger } from '../lib/messenger';

export function initializeWallet(
  messenger: RootMessenger,
  state: Record<string, Record<string, Json>>,
) {
  return new Wallet({
    messenger,
    state,
    instanceOptions: {
      KeyringController: {
        keyringBuilders: getKeyringBuilders(messenger),
      },
    },
  });
}
