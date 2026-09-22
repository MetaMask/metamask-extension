import { useSelector } from 'react-redux';
import { toEvmCaipChainId } from '@metamask/multichain-network-controller';
import { TX_DETAILS_ROUTE } from '../../../helpers/constants/routes';
import {
  selectTransactionChainIdAndHash,
  type TransactionState,
} from '../../../selectors/transactionController';

/**
 * Details route for a transaction, once it has a hash.
 *
 * @param transactionId - The transaction to link to.
 * @returns The details route, or undefined when there is no hash yet.
 */
export function useTransactionDetailsRoute(
  transactionId?: string,
): string | undefined {
  const { chainId, hash } =
    useSelector((state: TransactionState) =>
      selectTransactionChainIdAndHash(state, transactionId),
    ) ?? {};

  if (!chainId || !hash) {
    return undefined;
  }

  return `${TX_DETAILS_ROUTE}/${toEvmCaipChainId(chainId)}/${hash}`;
}
