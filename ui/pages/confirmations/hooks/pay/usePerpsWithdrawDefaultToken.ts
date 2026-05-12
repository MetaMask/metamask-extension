import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import {
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';
import type { Hex } from '@metamask/utils';
import {
  selectTransactions,
  type TransactionState,
} from '../../../../selectors/transactionController';
import type { RemoteFeatureFlagsState } from '../../../../../shared/lib/selectors/remote-feature-flags';
import { hasTransactionType } from '../../../../../shared/lib/transactions.utils';
import { selectPreferredPayToken } from '../../selectors/feature-flags';
import { ARBITRUM_USDC } from '../../constants/perps';
import type { SetPayTokenRequest } from './types';

const ARBITRUM_USDC_FALLBACK: SetPayTokenRequest = {
  address: ARBITRUM_USDC.address,
  chainId: ARBITRUM_USDC.chainId,
};

type PerpsWithdrawDefaultTokenState = TransactionState &
  RemoteFeatureFlagsState;

/**
 * Default destination token for Perps Withdraw: last confirmed
 * `perpsWithdraw`'s `metamaskPay`, else the remote-configured preference,
 * else native Arbitrum USDC.
 */
export function usePerpsWithdrawDefaultToken(): SetPayTokenRequest {
  const transactions = useSelector((state: PerpsWithdrawDefaultTokenState) =>
    selectTransactions(state),
  );
  const preferredToken = useSelector((state: PerpsWithdrawDefaultTokenState) =>
    selectPreferredPayToken(state, TransactionType.perpsWithdraw),
  );

  return useMemo(() => {
    const matching = transactions.filter(
      (tx) =>
        tx.status === TransactionStatus.confirmed &&
        hasTransactionType(tx, [TransactionType.perpsWithdraw]) &&
        Boolean(tx.metamaskPay?.tokenAddress) &&
        Boolean(tx.metamaskPay?.chainId),
    );

    if (matching.length === 0) {
      return preferredToken
        ? {
            address: preferredToken.address,
            chainId: preferredToken.chainId,
          }
        : ARBITRUM_USDC_FALLBACK;
    }

    const latest = matching.reduce((acc, tx) =>
      tx.time > acc.time ? tx : acc,
    );

    return {
      address: latest.metamaskPay?.tokenAddress as Hex,
      chainId: latest.metamaskPay?.chainId as Hex,
    };
  }, [preferredToken, transactions]);
}
