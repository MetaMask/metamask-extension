import { TransactionMeta } from '@metamask/transaction-controller';
import { useMemo, useState } from 'react';
import { calcTokenAmount } from '../../../../../../../shared/lib/transactions-controller-utils';
import { toChecksumHexAddress } from '../../../../../../../shared/modules/hexstring-utils';
import { Numeric } from '../../../../../../../shared/modules/Numeric';
import useTokenExchangeRate from '../../../../../../components/app/currency-input/hooks/useTokenExchangeRate';
import { useFiatFormatter } from '../../../../../../hooks/useFiatFormatter';
import { useTokenTracker } from '../../../../../../hooks/useTokenTracker';
import { SelectedToken } from '../shared/selected-token';

export const useTokenValues = (
  transactionMeta: TransactionMeta,
  selectedToken: SelectedToken,
) => {
  const [tokensWithBalances, setTokensWithBalances] = useState<
    { balance: string; address: string; decimals: number; string: string }[]
  >([]);

  const fetchTokenBalances = async () => {
    const result: {
      tokensWithBalances: {
        balance: string;
        address: string;
        decimals: number;
        string: string;
      }[];
    } = await useTokenTracker({
      tokens: [selectedToken],
      address: undefined,
    });

    setTokensWithBalances(result.tokensWithBalances);
  };

  fetchTokenBalances();

  const [exchangeRate, setExchangeRate] = useState<Numeric | undefined>();
  const fetchExchangeRate = async () => {
    const result = await useTokenExchangeRate(transactionMeta?.txParams?.to);

    setExchangeRate(result);
  };

  fetchExchangeRate();

  const tokenBalance = useMemo(() => {
    const tokenWithBalance = tokensWithBalances.find(
      (token: {
        balance: string;
        address: string;
        decimals: number;
        string: string;
      }) =>
        toChecksumHexAddress(token.address) ===
        toChecksumHexAddress(transactionMeta?.txParams?.to as string),
    );

    if (!tokenWithBalance) {
      return undefined;
    }

    return calcTokenAmount(tokenWithBalance.balance, tokenWithBalance.decimals);
  }, [tokensWithBalances]);

  const fiatValue =
    exchangeRate && tokenBalance && exchangeRate.times(tokenBalance).toNumber();

  const fiatFormatter = useFiatFormatter();

  const fiatDisplayValue =
    fiatValue && fiatFormatter(fiatValue, { shorten: true });

  return {
    fiatDisplayValue,
    tokenBalance: tokenBalance && String(tokenBalance.toNumber()),
  };
};
