import { Hex } from '@metamask/utils';
import { TransactionMeta } from '../../../../shared/constants/transaction';

/**
 * The configuration required to fetch transaction data from a RemoteTransactionSource.
 */
export interface RemoteTransactionSourceRequest {
  /**
   * The address of the account to fetch transactions for.
   */
  address: string;

  /**
   * API key if required by the remote source.
   */
  apiKey?: string;

  /**
   * The chainId of the current network.
   */
  currentChainId: Hex;

  /**
   * The networkId of the current network.
   */
  currentNetworkId: string;

  /**
   * Block number to start fetching transactions from.
   */
  fromBlock?: number;

  /**
   * Maximum number of transactions to retrieve.
   */
  limit?: number;
}

/**
 * An object capable of fetching transaction data from a remote source.
 * Used by the IncomingTransactionHelper to retrieve remote transaction data.
 */
export interface RemoteTransactionSource {
  isSupportedNetwork: (chainId: Hex, networkId: string) => boolean;

  fetchTransactions: (
    request: RemoteTransactionSourceRequest,
  ) => Promise<TransactionMeta[]>;
}
