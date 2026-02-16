import { useSelector } from 'react-redux';
import { useI18nContext } from '../../../hooks/useI18nContext';
import type {
  Token,
  TransactionViewModel,
} from '../../../../shared/lib/multichain/types';
import { TransactionGroupCategory } from '../../../../shared/constants/transaction';
import { selectMarketRates } from '../../../selectors/activity';
import { calculateFiatFromMarketRates } from './helpers';

export function useGetTitle(transaction: TransactionViewModel): string {
  const t = useI18nContext();

  // This should be server-side
  if (transaction.category === TransactionGroupCategory.swap) {
    const fromSymbol = transaction.amounts?.from?.token.symbol;
    const toSymbol = transaction.amounts?.to?.token.symbol;

    if (fromSymbol && toSymbol) {
      return t('swapTokenToToken', [fromSymbol, toSymbol]);
    }
  }

  if (transaction.category === TransactionGroupCategory.send) {
    const symbol = transaction.amounts?.from?.token.symbol;
    if (symbol) {
      return t('sentSpecifiedTokens', [symbol]);
    }
    return t('sent');
  }

  if (transaction.category === TransactionGroupCategory.receive) {
    return t('received');
  }

  return transaction.readable ?? '';
}

export function useFiatAmount(amount?: string, token?: Token) {
  const marketRates = useSelector(selectMarketRates);
  return calculateFiatFromMarketRates(amount, token, marketRates);
}
