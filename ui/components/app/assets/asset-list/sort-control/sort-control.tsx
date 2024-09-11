import React, { useEffect, useMemo, useState } from 'react';
import { Box, Button } from '../../../../component-library';
import { TokenWithBalance } from '../asset-list';
import { SortOrder, sortAssets } from '../../util/sort';
import { useAccountTotalFiatBalance } from '../../../../../hooks/useAccountTotalFiatBalance';
import { shallowEqual, useSelector } from 'react-redux';
import {
  getConfirmationExchangeRates,
  getCurrentCurrency,
  getSelectedAccount,
  getShouldHideZeroBalanceTokens,
  getTokenExchangeRates,
} from '../../../../../selectors';
import { roundToDecimalPlacesRemovingExtraZeroes } from '../../../../../helpers/utils/util';
import { isEqualCaseInsensitive } from '../../../../../../shared/modules/string-utils';
import { getConversionRate } from '../../../../../ducks/metamask/metamask';
import { getTokenFiatAmount } from '../../../../../helpers/utils/token-util';

type SortControlProps = {
  tokenList: TokenWithBalance[];
  setTokenList: (arg: TokenWithBalance[]) => void;
  setLoading: (arg: boolean) => void;
};

const SortControl = ({
  tokenList,
  setTokenList,
  setLoading,
}: SortControlProps) => {
  const [sorted, setSorted] = useState(false);
  const selectedAccount = useSelector(getSelectedAccount);
  const shouldHideZeroBalanceTokens = useSelector(
    getShouldHideZeroBalanceTokens,
  );
  const conversionRate = useSelector(getConversionRate);
  const currentCurrency = useSelector(getCurrentCurrency);

  // tokenExchangeRate
  const contractExchangeRates = useSelector(
    getTokenExchangeRates,
    shallowEqual,
  );
  const confirmationExchangeRates = useSelector(getConfirmationExchangeRates);
  const mergedRates = {
    ...contractExchangeRates,
    ...confirmationExchangeRates,
  };
  const accountTotalFiatBalance = useAccountTotalFiatBalance(
    selectedAccount,
    shouldHideZeroBalanceTokens,
  );

  const { loading } = accountTotalFiatBalance;

  useEffect(() => {
    if (!sorted) {
      console.log('hello world');
      setLoading(loading);
      const tokensWithBalances =
        accountTotalFiatBalance.tokensWithBalances as TokenWithBalance[];

      tokensWithBalances.forEach((token) => {
        // token.string is the balance displayed in the TokenList UI
        token.string = roundToDecimalPlacesRemovingExtraZeroes(
          token.string,
          5,
        ) as string;
      });

      // to sort by fiat balance, we need to compute this at this level
      // should this get passed down as props to token-cell as props, rather than recomputing there?
      tokensWithBalances.forEach((token) => {
        const contractExchangeTokenKey = Object.keys(mergedRates).find((key) =>
          isEqualCaseInsensitive(key, token.address),
        );

        const tokenExchangeRate =
          contractExchangeTokenKey && mergedRates[contractExchangeTokenKey];

        token.tokenFiatAmount =
          getTokenFiatAmount(
            tokenExchangeRate,
            conversionRate,
            currentCurrency,
            token.string, // tokenAmount
            token.symbol, // tokenSymbol
            false, // no currency symbol prefix
            false, // no ticker symbol suffix
          ) || '0';
      });

      setTokenList(tokensWithBalances);
      setLoading(loading);
    }
  }, [accountTotalFiatBalance]);

  const handleSort = (key: string, sortCallback: string, order: SortOrder) => {
    const sorted = sortAssets(tokenList, {
      key,
      sortCallback,
      order,
    });
    setSorted(true);
    setTokenList(sorted);
  };

  return (
    <>
      <Box
        className="selectable-list-item"
        onClick={() => handleSort('symbol', 'alphanumeric', 'asc')}
      >
        Sort by Symbol
      </Box>
      <Box
        className="selectable-list-item"
        onClick={() => handleSort('tokenFiatAmount', 'stringNumeric', 'dsc')}
      >
        Sort by Balance
      </Box>
    </>
  );
};

export default SortControl;
