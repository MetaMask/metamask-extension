import { TransactionMeta } from '@metamask/transaction-controller';
import { useMemo } from 'react';
import { calcTokenAmount } from '../../../../../../../shared/lib/transactions-controller-utils';
import { toChecksumHexAddress } from '../../../../../../../shared/modules/hexstring-utils';
import useTokenExchangeRate from '../../../../../../components/app/currency-input/hooks/useTokenExchangeRate';
import { useFiatFormatter } from '../../../../../../hooks/useFiatFormatter';
import { useTokenTracker } from '../../../../../../hooks/useTokenTracker';
import { SelectedToken } from '../shared/selected-token';

export const useTokenValues = (
  transactionMeta: TransactionMeta,
  selectedToken: SelectedToken,
) => {
  const {
    tokensWithBalances,
  }: {
    tokensWithBalances: {
      balance: string;
      address: string;
      decimals: number;
      string: string;
    }[];
  } = useTokenTracker({ tokens: [selectedToken], address: undefined });

  const tokenBalance = useMemo(() => {
    const tokenWithBalance = tokensWithBalances.find(
      (token) =>
        toChecksumHexAddress(token.address) ===
        toChecksumHexAddress(transactionMeta.txParams.to as string),
    );

    if (!tokenWithBalance) {
      return '';
    }

    return calcTokenAmount(tokenWithBalance.balance, tokenWithBalance.decimals);
  }, [tokensWithBalances]);

  const exchangeRate = useTokenExchangeRate(transactionMeta.txParams.to);

  const fiatValue = useMemo(() => {
    if (exchangeRate && tokenBalance !== '') {
      return exchangeRate.times(tokenBalance).toNumber();
    }
    return undefined;
  }, [exchangeRate, tokenBalance]);

  const fiatFormatter = useFiatFormatter();

  const fiatDisplayValue =
    fiatValue && fiatFormatter(fiatValue, { shorten: true });

  return { fiatDisplayValue, tokenBalance };
};
