import { Wallet } from '@metamask/wallet';
import {
  getTransactionControllerOptions,
  initTransactionController,
} from '../messenger-client-init/confirmations/transaction-controller-init';
import { getKeyringBuilders } from './keyrings';
import { InitializeWalletRequest } from './types';

export function initializeWallet(request: InitializeWalletRequest) {
  const { messenger, state, encryptor } = request;

  const wallet = new Wallet({
    messenger,
    state,
    instanceOptions: {
      keyringController: {
        encryptor,
        keyringBuilders: getKeyringBuilders(messenger),
      },
      transactionController: getTransactionControllerOptions(request),
    },
  });

  initTransactionController(wallet, request);

  return wallet;
}
