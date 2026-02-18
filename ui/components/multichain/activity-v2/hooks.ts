import { useSelector } from 'react-redux';
import { useI18nContext } from '../../../hooks/useI18nContext';
import type {
  Token,
  TransactionViewModel,
} from '../../../../shared/lib/multichain/types';
import { NETWORK_TO_NAME_MAP } from '../../../../shared/constants/network';
import { selectMarketRates } from '../../../selectors/activity';
import { calculateFiatFromMarketRates } from './helpers';

export function useGetTitle(transaction: TransactionViewModel): string {
  const t = useI18nContext();
  const { transactionCategory } = transaction;

  // This should be server-side
  if (transactionCategory === 'APPROVE') {
    const symbol = transaction.amounts?.from?.token?.symbol;
    return symbol ? t('approveSpendingCap', [symbol]) : t('approve');
  }

  // This should be server-side
  if (transactionCategory === 'BRIDGE_OUT') {
    const chainName =
      NETWORK_TO_NAME_MAP[
        transaction.chainId as keyof typeof NETWORK_TO_NAME_MAP
      ];
    return chainName ? t('bridgedToChain', [chainName]) : t('bridged');
  }

  if (transactionCategory === 'BRIDGE_IN') {
    return t('bridge');
  }

  // This should be server-side
  if (
    transactionCategory === 'SWAP' ||
    transactionCategory === 'EXCHANGE' ||
    (transaction.amounts?.from && transaction.amounts?.to)
  ) {
    const fromSymbol = transaction.amounts?.from?.token.symbol;
    const toSymbol = transaction.amounts?.to?.token.symbol;
    if (fromSymbol && toSymbol && fromSymbol !== toSymbol) {
      return t('swapTokenToToken', [fromSymbol, toSymbol]);
    }
    return t('swap');
  }

  // Direction from parsed amounts
  if (transaction.amounts?.from) {
    const { symbol } = transaction.amounts.from.token;
    return symbol ? t('sentSpecifiedTokens', [symbol]) : t('sent');
  }
  if (transaction.amounts?.to) {
    return t('received');
  }

  // TODO: Use enriched .readable field once ready
  return t('contractInteraction');
}

export function useFiatAmount(amount?: string, token?: Token) {
  const marketRates = useSelector(selectMarketRates);
  return calculateFiatFromMarketRates(amount, token, marketRates);
}
