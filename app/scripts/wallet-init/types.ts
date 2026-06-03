import { Encryptor } from '@metamask/keyring-controller';
import { Json } from '@metamask/utils';

import { TransactionMetricsRequest } from '../../../shared/types';
import { MessengerClientFlatState } from '../messenger-client-init/controller-list';
import { RootMessenger } from '../lib/messenger';

export type InitializeWalletRequest = {
  encryptor?: Encryptor;
  getFlatState: () => MessengerClientFlatState;
  getPermittedAccounts: (origin?: string) => Promise<string[]>;
  getTransactionMetricsRequest: () => TransactionMetricsRequest;
  messenger: RootMessenger;
  state: Record<string, Record<string, Json>>;
};
