import {
  TransactionStatus,
  type TransactionMeta,
} from '@metamask/transaction-controller';
import { createDeepEqualSelector } from '../../shared/lib/selectors/selector-creators';
import type { MetaMaskReduxState } from '../store/store';
import { isPerpsWithdrawTransaction } from '../../shared/lib/transactions.utils';
import { EMPTY_ARRAY, EMPTY_OBJECT } from './shared';

const selectTransactions = (state: MetaMaskReduxState) =>
  state.metamask?.transactions ?? EMPTY_ARRAY;

type TokenLike = {
  address?: string;
  symbol?: string;
};

export type PerpsWithdrawToastTransaction = {
  id: string;
  isPostQuote: boolean;
  status?: TransactionStatus;
  targetFiat?: number;
  tokenSymbol: string;
};

const selectAllTokens = (state: MetaMaskReduxState) =>
  state.metamask?.allTokens ?? EMPTY_OBJECT;

const selectNetworkConfigurationsByChainId = (state: MetaMaskReduxState) =>
  state.metamask?.networkConfigurationsByChainId ?? EMPTY_OBJECT;

function getTokenSymbol(
  allTokens: unknown,
  chainId?: string,
  tokenAddress?: string,
): string | undefined {
  if (!chainId || !tokenAddress) {
    return undefined;
  }

  const chainTokensByAccount =
    (allTokens as Record<string, Record<string, TokenLike[]>>)[chainId] ??
    EMPTY_OBJECT;
  const tokens = Object.values(chainTokensByAccount).flat();

  return tokens.find(
    (token) =>
      token.address?.toLowerCase() === tokenAddress.toLowerCase() &&
      token.symbol,
  )?.symbol;
}

function getNetworkTicker(
  networkConfigurationsByChainId: unknown,
  chainId?: string,
): string | undefined {
  if (!chainId) {
    return undefined;
  }

  return (
    networkConfigurationsByChainId as Record<
      string,
      { nativeCurrency?: string }
    >
  )[chainId]?.nativeCurrency;
}

function getPerpsWithdrawToastTransaction(
  transaction: TransactionMeta,
  allTokens: unknown,
  networkConfigurationsByChainId: unknown,
): PerpsWithdrawToastTransaction {
  const { metamaskPay } = transaction;

  if (metamaskPay?.isPostQuote !== true) {
    return {
      id: transaction.id,
      isPostQuote: false,
      status: transaction.status,
      tokenSymbol: 'USDC',
    };
  }

  const rawTargetFiat = Number(metamaskPay.targetFiat);
  const targetFiat =
    Number.isFinite(rawTargetFiat) && rawTargetFiat > 0
      ? rawTargetFiat
      : undefined;
  const { chainId } = metamaskPay;
  const { tokenAddress } = metamaskPay;
  const tokenSymbol =
    getTokenSymbol(allTokens, chainId, tokenAddress) ??
    getNetworkTicker(networkConfigurationsByChainId, chainId) ??
    'USDC';

  return {
    id: transaction.id,
    isPostQuote: true,
    status: transaction.status,
    targetFiat,
    tokenSymbol,
  };
}

export const selectPerpsWithdrawTransactionsForToast = createDeepEqualSelector(
  selectTransactions,
  selectAllTokens,
  selectNetworkConfigurationsByChainId,
  (transactions, allTokens, networkConfigurationsByChainId) =>
    transactions
      .filter(isPerpsWithdrawTransaction)
      .map((transaction) =>
        getPerpsWithdrawToastTransaction(
          transaction,
          allTokens,
          networkConfigurationsByChainId,
        ),
      ),
);
