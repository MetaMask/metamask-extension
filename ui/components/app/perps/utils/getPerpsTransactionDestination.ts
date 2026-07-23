import { toEvmCaipChainId } from '@metamask/multichain-network-controller';
import { CHAIN_IDS } from '../../../../../shared/constants/network';
import {
  PERPS_TRANSACTION_DETAILS_ROUTE,
  TX_DETAILS_ROUTE,
} from '../../../../helpers/constants/routes';
import type { PerpsTransaction } from '../types';

export type PerpsTransactionDestination = {
  pathname: string;
  state?: { transaction: PerpsTransaction };
};

/**
 * Resolves where clicking a Perps activity row should navigate to, based on
 * the transaction's type.
 *
 * Orders, trades, and funding payments are off-chain Perps events with no
 * on-chain record, so they open the dedicated Perps transaction details page
 * (the transaction is handed off via router state rather than a URL param,
 * since it isn't refetchable by id on its own).
 *
 * Deposits and withdrawals are on-chain Arbitrum transactions that already
 * have a generic activity details view, keyed by chain id + tx hash, so
 * those reuse the existing `TX_DETAILS_ROUTE`.
 *
 * @param transaction - The Perps transaction that was clicked.
 * @returns The route to navigate to, or `undefined` if the transaction has
 * no valid destination (e.g. a deposit/withdrawal missing a tx hash).
 */
export function getPerpsTransactionDestination(
  transaction: PerpsTransaction,
): PerpsTransactionDestination | undefined {
  if (
    transaction.type === 'order' ||
    transaction.type === 'trade' ||
    transaction.type === 'funding'
  ) {
    return {
      pathname: PERPS_TRANSACTION_DETAILS_ROUTE,
      state: { transaction },
    };
  }

  const txHash = transaction.depositWithdrawal?.txHash;
  if (!txHash) {
    return undefined;
  }

  const caipChainId = toEvmCaipChainId(CHAIN_IDS.ARBITRUM);
  return { pathname: `${TX_DETAILS_ROUTE}/${caipChainId}/${txHash}` };
}
