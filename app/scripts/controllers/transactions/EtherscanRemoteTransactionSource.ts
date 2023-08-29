import { BNToHex } from '@metamask/controller-utils';
import type { Hex } from '@metamask/utils';
import { BN } from 'ethereumjs-util';
import createId from '../../../../shared/modules/random-id';

import {
  TransactionMeta,
  TransactionStatus,
  TransactionType,
} from '../../../../shared/constants/transaction';
import { ETHERSCAN_SUPPORTED_NETWORKS } from '../../../../shared/constants/network';
import type {
  EtherscanTokenTransactionMeta,
  EtherscanTransactionMeta,
  EtherscanTransactionMetaBase,
  EtherscanTransactionRequest,
  EtherscanTransactionResponse,
} from './etherscan';
import {
  fetchEtherscanTokenTransactions,
  fetchEtherscanTransactions,
} from './etherscan';
import {
  RemoteTransactionSource,
  RemoteTransactionSourceRequest,
} from './types';

/**
 * A RemoteTransactionSource that fetches transaction data from Etherscan.
 */
export class EtherscanRemoteTransactionSource
  implements RemoteTransactionSource
{
  #apiKey?: string;

  #includeTokenTransfers: boolean;

  constructor({
    apiKey,
    includeTokenTransfers,
  }: { apiKey?: string; includeTokenTransfers?: boolean } = {}) {
    this.#apiKey = apiKey;
    this.#includeTokenTransfers = includeTokenTransfers ?? true;
  }

  isSupportedNetwork(chainId: Hex, _networkId: string): boolean {
    return Object.keys(ETHERSCAN_SUPPORTED_NETWORKS).includes(chainId);
  }

  async fetchTransactions(
    request: RemoteTransactionSourceRequest,
  ): Promise<TransactionMeta[]> {
    const etherscanRequest: EtherscanTransactionRequest = {
      ...request,
      apiKey: this.#apiKey,
      chainId: request.currentChainId,
    };

    const transactionPromise = fetchEtherscanTransactions(etherscanRequest);

    const tokenTransactionPromise = this.#includeTokenTransfers
      ? fetchEtherscanTokenTransactions(etherscanRequest)
      : Promise.resolve({
          result: [] as EtherscanTokenTransactionMeta[],
        } as EtherscanTransactionResponse<EtherscanTokenTransactionMeta>);

    const [etherscanTransactions, etherscanTokenTransactions] =
      await Promise.all([transactionPromise, tokenTransactionPromise]);

    const transactions = etherscanTransactions.result.map((tx) =>
      this.#normalizeTransaction(
        tx,
        request.currentNetworkId,
        request.currentChainId,
      ),
    );

    const tokenTransactions = etherscanTokenTransactions.result.map((tx) =>
      this.#normalizeTokenTransaction(
        tx,
        request.currentNetworkId,
        request.currentChainId,
      ),
    );

    return [...transactions, ...tokenTransactions];
  }

  #normalizeTransaction(
    txMeta: EtherscanTransactionMeta,
    currentNetworkId: string,
    currentChainId: Hex,
  ): TransactionMeta {
    const base = this.#normalizeTransactionBase(
      txMeta,
      currentNetworkId,
      currentChainId,
    );

    return {
      ...base,
      txParams: {
        ...base.txParams,
        data: txMeta.input,
      },
      ...(txMeta.isError === '0'
        ? { status: TransactionStatus.confirmed }
        : {
            status: TransactionStatus.failed,
          }),
    };
  }

  #normalizeTokenTransaction(
    txMeta: EtherscanTokenTransactionMeta,
    currentNetworkId: string,
    currentChainId: Hex,
  ): TransactionMeta {
    const base = this.#normalizeTransactionBase(
      txMeta,
      currentNetworkId,
      currentChainId,
    );

    return {
      ...base,
    };
  }

  #normalizeTransactionBase(
    txMeta: EtherscanTransactionMetaBase,
    currentNetworkId: string,
    currentChainId: Hex,
  ): TransactionMeta {
    const time = parseInt(txMeta.timeStamp, 10) * 1000;

    return {
      blockNumber: txMeta.blockNumber,
      chainId: currentChainId,
      hash: txMeta.hash,
      id: createId(),
      metamaskNetworkId: currentNetworkId,
      status: TransactionStatus.confirmed,
      time,
      txParams: {
        from: txMeta.from,
        gas: BNToHex(new BN(txMeta.gas)),
        gasPrice: BNToHex(new BN(txMeta.gasPrice)),
        nonce: BNToHex(new BN(txMeta.nonce)),
        to: txMeta.to,
        value: BNToHex(new BN(txMeta.value)),
      },
      type: TransactionType.incoming,
    } as TransactionMeta;
  }
}
