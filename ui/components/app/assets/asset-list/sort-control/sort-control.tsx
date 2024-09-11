import React, { useEffect, useMemo, useState } from 'react';
import { Box, Button, Text } from '../../../../component-library';
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
import {
  BackgroundColor,
  BorderRadius,
} from '../../../../../helpers/constants/design-system';
import { ReactNode } from 'react-markdown';
import classnames from 'classnames';

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
  const [sortKey, setSortKey] = useState<string | null>(null);
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
    setSortKey(key);
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
      <SelectableListItem
        isSelected={sortKey === 'symbol'}
        onClick={() => handleSort('symbol', 'alphanumeric', 'asc')}
      >
        Alphabetically (A-Z)
      </SelectableListItem>
      <SelectableListItem
        isSelected={sortKey === 'tokenFiatAmount'}
        onClick={() => handleSort('tokenFiatAmount', 'stringNumeric', 'dsc')}
      >
        Declining balance ($ high-low)
      </SelectableListItem>
    </>
  );
};

// intentionally used generic naming convention for styled selectable list item
// inspired from ui/components/multichain/network-list-item
// should probably be broken out into component library
type SelectableListItemProps = {
  isSelected: boolean;
  onClick?: React.MouseEventHandler<HTMLSpanElement>;
  children: ReactNode;
};

export const SelectableListItem = ({
  isSelected,
  onClick,
  children,
}: SelectableListItemProps) => {
  return (
    <Box className="selectable-list-item-wrapper">
      <Box
        className={classnames('selectable-list-item', {
          'selectable-list-item--selected': isSelected,
        })}
        onClick={onClick}
      >
        {children}
      </Box>
      {isSelected && (
        <Box
          className="selectable-list-item__selected-indicator"
          borderRadius={BorderRadius.pill}
          backgroundColor={BackgroundColor.primaryDefault}
        />
      )}
    </Box>
  );
};

export default SortControl;
