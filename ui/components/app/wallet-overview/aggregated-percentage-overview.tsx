import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { toChecksumAddress } from 'ethereumjs-util';
import { getNativeTokenAddress } from '@metamask/assets-controllers';
import { Box, Skeleton } from '@metamask/design-system-react';
import { getCurrentCurrency } from '../../../ducks/metamask/metamask';
import {
  getSelectedAccount,
  getShouldHideZeroBalanceTokens,
  getTokensMarketData,
  selectAnyEnabledNetworksAreAvailable,
} from '../../../selectors';
import { getPreferences } from '../../../../shared/lib/selectors/preferences';
import { getSelectedInternalAccount } from '../../../../shared/lib/selectors/accounts';
import { getCurrentChainId } from '../../../../shared/lib/selectors/networks';
import { useAccountTotalFiatBalance } from '../../../hooks/useAccountTotalFiatBalance';
import {
  formatValue,
  isValidAmount,
} from '../../../../shared/lib/format-value';
import { getIntlLocale } from '../../../ducks/locale/locale';
import {
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { SensitiveText } from '../../component-library';
import { getCalculatedTokenAmount1dAgo } from '../../../helpers/utils/util';
import { getHistoricalMultichainAggregatedBalance } from '../../../selectors/assets';
import { formatWithThreshold } from '../assets/util/formatWithThreshold';
import { useFormatters } from '../../../hooks/useFormatters';
import { isZeroAmount } from '../../../helpers/utils/number-utils';

// core already has this exported type but its not yet available in this version
// todo remove this and use core type once available
type MarketDataDetails = {
  tokenAddress: string;
  pricePercentChange1d: number;
};

export const AggregatedPercentageOverview = ({
  trailingChild,
}: {
  trailingChild: () => JSX.Element | null;
}) => {
  const tokensMarketData: Record<string, MarketDataDetails> =
    useSelector(getTokensMarketData);
  const { formatCurrencyCompact } = useFormatters();
  const fiatCurrency = useSelector(getCurrentCurrency);
  const { privacyMode } = useSelector(getPreferences);
  const selectedAccount = useSelector(getSelectedAccount);
  const currentChainId = useSelector(getCurrentChainId);
  const shouldHideZeroBalanceTokens = useSelector(
    getShouldHideZeroBalanceTokens,
  );
  // Get total balance (native + tokens)
  const { totalFiatBalance, orderedTokenList } = useAccountTotalFiatBalance(
    selectedAccount,
    shouldHideZeroBalanceTokens,
  );

  const anyEnabledNetworksAreAvailable = useSelector(
    selectAnyEnabledNetworksAreAvailable,
  );

  // Memoize the calculation to avoid recalculating unless orderedTokenList or tokensMarketData changes
  const totalFiat1dAgo = useMemo(() => {
    return orderedTokenList.reduce((total1dAgo, item) => {
      if (item.address) {
        // This is a regular ERC20 token
        // find the relevant pricePercentChange1d in tokensMarketData
        // Find the corresponding market data for the token by filtering the values of the tokensMarketData object
        const found = tokensMarketData?.[toChecksumAddress(item.address)];

        const tokenFiat1dAgo = getCalculatedTokenAmount1dAgo(
          item.fiatBalance,
          found?.pricePercentChange1d,
        );
        return total1dAgo + Number(tokenFiat1dAgo);
      }
      // native token
      const nativePricePercentChange1d =
        tokensMarketData?.[getNativeTokenAddress(currentChainId)]
          ?.pricePercentChange1d;
      const nativeFiat1dAgo = getCalculatedTokenAmount1dAgo(
        item.fiatBalance,
        nativePricePercentChange1d,
      );
      return total1dAgo + Number(nativeFiat1dAgo);
    }, 0); // Initial total1dAgo is 0
  }, [orderedTokenList, tokensMarketData, currentChainId]); // Dependencies: recalculate if orderedTokenList or tokensMarketData changes

  const { amountChange, formattedPercentChange, formattedAmountChange, color } =
    useMemo(() => {
      const totalBalance: number = Number(totalFiatBalance);
      const totalBalance1dAgo = totalFiat1dAgo;
      const change = totalBalance - totalBalance1dAgo;
      const percentageChange = (change / totalBalance1dAgo) * 100 || 0;

      const fmtPctChange = formatValue(
        change === 0 ? 0 : percentageChange,
        true,
      );

      let fmtAmountChange = '';
      if (isValidAmount(change)) {
        fmtAmountChange = (change as number) >= 0 ? '+' : '';
        fmtAmountChange += formatCurrencyCompact(change, fiatCurrency);
      }

      let derivedColor = TextColor.textAlternative;
      if (!privacyMode && isValidAmount(change)) {
        if ((change as number) === 0) {
          derivedColor = TextColor.textAlternative;
        } else if ((change as number) > 0) {
          derivedColor = TextColor.successDefault;
        } else {
          derivedColor = TextColor.errorDefault;
        }
      }

      return {
        amountChange: change,
        formattedPercentChange: fmtPctChange,
        formattedAmountChange: fmtAmountChange,
        color: derivedColor,
      };
    }, [
      totalFiatBalance,
      totalFiat1dAgo,
      formatCurrencyCompact,
      fiatCurrency,
      privacyMode,
    ]);

  return (
    <Skeleton
      hideChildren={
        !anyEnabledNetworksAreAvailable && isZeroAmount(amountChange)
      }
    >
      <Box className="flex gap-1">
        <SensitiveText
          variant={TextVariant.bodyMdMedium}
          color={color}
          data-testid="aggregated-value-change"
          style={{ whiteSpace: 'pre' }}
          isHidden={privacyMode}
          ellipsis
          length="10"
        >
          {formattedAmountChange}
        </SensitiveText>
        <SensitiveText
          variant={TextVariant.bodyMdMedium}
          color={color}
          data-testid="aggregated-percentage-change"
          isHidden={privacyMode}
          ellipsis
          length="10"
        >
          {formattedPercentChange}
        </SensitiveText>
      </Box>
      {trailingChild()}
    </Skeleton>
  );
};

export const AggregatedMultichainPercentageOverview = ({
  trailingChild,
  privacyMode = false,
}: {
  trailingChild: () => JSX.Element | null;
  privacyMode?: boolean;
}) => {
  const locale = useSelector(getIntlLocale);
  const currentCurrency = useSelector(getCurrentCurrency);
  const selectedAccount = useSelector(getSelectedInternalAccount);
  const historicalAggregatedBalances = useSelector((state) =>
    getHistoricalMultichainAggregatedBalance(state, selectedAccount),
  );
  const anyEnabledNetworksAreAvailable = useSelector(
    selectAnyEnabledNetworksAreAvailable,
  );

  const {
    singleDayPercentChange,
    singleDayAmountChange,
    signPrefix,
    color,
    localizedAmountChange,
    localizedPercentChange,
  } = useMemo(() => {
    const pctChange = historicalAggregatedBalances.P1D.percentChange;
    const amtChange = historicalAggregatedBalances.P1D.amountChange;
    const prefix = pctChange >= 0 ? '+' : '-';

    let derivedColor = TextColor.textAlternative;
    if (!privacyMode && isValidAmount(pctChange)) {
      if ((pctChange as number) === 0) {
        derivedColor = TextColor.textAlternative;
      } else if ((pctChange as number) > 0) {
        derivedColor = TextColor.successDefault;
      } else {
        derivedColor = TextColor.errorDefault;
      }
    }

    const fmtAmountChange = formatWithThreshold(
      Math.abs(amtChange),
      0.01,
      locale,
      {
        style: 'currency',
        currency: currentCurrency,
      },
    );

    const fmtPercentChange = formatWithThreshold(
      Math.abs(pctChange) / 100,
      0.0001,
      locale,
      {
        style: 'percent',
        maximumFractionDigits: 2,
        minimumFractionDigits: 2,
      },
    );

    return {
      singleDayPercentChange: pctChange,
      singleDayAmountChange: amtChange,
      signPrefix: prefix,
      color: derivedColor,
      localizedAmountChange: fmtAmountChange,
      localizedPercentChange: fmtPercentChange,
    };
  }, [historicalAggregatedBalances, privacyMode, locale, currentCurrency]);

  return (
    <Skeleton
      hideChildren={
        !anyEnabledNetworksAreAvailable && isZeroAmount(singleDayAmountChange)
      }
    >
      <Box className="flex">
        <SensitiveText
          variant={TextVariant.bodyMdMedium}
          color={color}
          data-testid="aggregated-value-change"
          style={{ whiteSpace: 'pre' }}
          isHidden={privacyMode}
          ellipsis
          length="10"
        >
          {signPrefix}
          {localizedAmountChange}{' '}
        </SensitiveText>
        <SensitiveText
          variant={TextVariant.bodyMdMedium}
          color={color}
          data-testid="aggregated-percentage-change"
          isHidden={privacyMode}
          ellipsis
          length="10"
        >
          ({signPrefix}
          {localizedPercentChange})
        </SensitiveText>
      </Box>
      {trailingChild()}
    </Skeleton>
  );
};
