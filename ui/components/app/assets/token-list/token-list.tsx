import React, { ReactNode, useMemo } from 'react';
import { shallowEqual, useSelector } from 'react-redux';
import TokenCell from '../token-cell';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { Box } from '../../../component-library';
import {
  AlignItems,
  Display,
  JustifyContent,
} from '../../../../helpers/constants/design-system';
import { TokenWithBalance } from '../asset-list/asset-list';
import { sortAssets } from '../util/sort';
import {
  getPreferences,
  getSelectedAccount,
  getShouldHideZeroBalanceTokens,
  getTokenExchangeRates,
} from '../../../../selectors';
import { useAccountTotalFiatBalance } from '../../../../hooks/useAccountTotalFiatBalance';
import { getConversionRate } from '../../../../ducks/metamask/metamask';
import { useNativeTokenBalance } from '../asset-list/native-token/use-native-token-balance';

type TokenListProps = {
  onTokenClick: (arg: string) => void;
  nativeToken: ReactNode;
};

export default function TokenList({
  onTokenClick,
  nativeToken,
}: TokenListProps) {
  const t = useI18nContext();
  const { tokenSortConfig } = useSelector(getPreferences);
  const selectedAccount = useSelector(getSelectedAccount);
  const conversionRate = useSelector(getConversionRate);
  const nativeTokenWithBalance = useNativeTokenBalance();
  const shouldHideZeroBalanceTokens = useSelector(
    getShouldHideZeroBalanceTokens,
  );
  const contractExchangeRates = useSelector(
    getTokenExchangeRates,
    shallowEqual,
  );
  const { tokensWithBalances, loading } = useAccountTotalFiatBalance(
    selectedAccount,
    shouldHideZeroBalanceTokens,
  ) as {
    tokensWithBalances: TokenWithBalance[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mergedRates: any;
    loading: boolean;
  };

  const sortedTokens = useMemo(() => {
    return sortAssets(
      [nativeTokenWithBalance, ...tokensWithBalances],
      tokenSortConfig,
    );
  }, [
    tokensWithBalances,
    tokenSortConfig,
    conversionRate,
    contractExchangeRates,
  ]);

  return loading ? (
    <Box
      display={Display.Flex}
      alignItems={AlignItems.center}
      justifyContent={JustifyContent.center}
      padding={7}
      data-testid="token-list-loading-message"
    >
      {t('loadingTokens')}
    </Box>
  ) : (
    <div>
      {sortedTokens.map((tokenData) => {
        if (tokenData?.isNative) {
          // we need cloneElement so that we can pass the unique key
          return React.cloneElement(nativeToken as React.ReactElement, {
            key: `${tokenData.symbol}-${tokenData.address}`,
          });
        }
        return (
          <TokenCell
            key={`${tokenData.symbol}-${tokenData.address}`}
            {...tokenData}
            onClick={onTokenClick}
          />
        );
      })}
    </div>
  );
}
