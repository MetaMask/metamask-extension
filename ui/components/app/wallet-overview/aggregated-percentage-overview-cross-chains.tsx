import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { toChecksumAddress } from 'ethereumjs-util';
import { getNativeTokenAddress } from '@metamask/assets-controllers';
import { Hex } from '@metamask/utils';
import {
  getSelectedAccount,
  getShouldHideZeroBalanceTokens,
  getPreferences,
  getMarketData,
  getChainIdsToPoll,
} from '../../../selectors';
import { getCurrentCurrency } from '../../../ducks/metamask/metamask';

// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import { formatValue, isValidAmount } from '../../../../app/scripts/lib/util';
import { getIntlLocale } from '../../../ducks/locale/locale';
import {
  Display,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { Box, SensitiveText } from '../../component-library';
import { getCalculatedTokenAmount1dAgo } from '../../../helpers/utils/util';
import { useAccountTotalCrossChainFiatBalance } from '../../../hooks/useAccountTotalCrossChainFiatBalance';
import { useGetFormattedTokensPerChain } from '../../../hooks/useGetFormattedTokensPerChain';
import { TokenWithBalance } from '../assets/asset-list/asset-list';

export const AggregatedPercentageOverviewCrossChains = () => {
  const locale = useSelector(getIntlLocale);
  const fiatCurrency = useSelector(getCurrentCurrency);
  const { privacyMode } = useSelector(getPreferences);
  const selectedAccount = useSelector(getSelectedAccount);
  const shouldHideZeroBalanceTokens = useSelector(
    getShouldHideZeroBalanceTokens,
  );
  const crossChainMarketData = useSelector(getMarketData);
  const allChainIDs = useSelector(getChainIdsToPoll);
  const { formattedTokensWithBalancesPerChain } = useGetFormattedTokensPerChain(
    selectedAccount,
    shouldHideZeroBalanceTokens,
    false,
    allChainIDs,
  );
  const {
    totalFiatBalance: totalFiatCrossChains,
    tokenFiatBalancesCrossChains,
  } = useAccountTotalCrossChainFiatBalance(
    selectedAccount,
    formattedTokensWithBalancesPerChain,
  );

  const getPerChainTotalFiat1dAgo = (
    chainId: string,
    tokenFiatBalances: (string | undefined)[],
    tokensWithBalances: TokenWithBalance[],
  ) => {
    const totalPerChain1dAgoERC20 = tokensWithBalances.reduce(
      (total1dAgo: number, item: { address: string }, idx: number) => {
        const found =
          crossChainMarketData?.[chainId]?.[toChecksumAddress(item.address)];

        const tokenFiat1dAgo = getCalculatedTokenAmount1dAgo(
          tokenFiatBalances[idx],
          found?.pricePercentChange1d,
        );
        return total1dAgo + Number(tokenFiat1dAgo);
      },
      0,
    );

    return totalPerChain1dAgoERC20;
  };

  const totalFiat1dAgoCrossChains = useMemo(() => {
    return tokenFiatBalancesCrossChains.reduce(
      (
        total1dAgoCrossChains: number,
        item: {
          chainId: string;
          nativeFiatValue: string;
          tokenFiatBalances: (string | undefined)[];
          tokensWithBalances: TokenWithBalance[];
        },
      ) => {
        const perChainERC20Total = getPerChainTotalFiat1dAgo(
          item.chainId,
          item.tokenFiatBalances,
          item.tokensWithBalances,
        );
        const nativePricePercentChange1d =
          crossChainMarketData?.[item.chainId]?.[
            getNativeTokenAddress(item.chainId as Hex)
          ]?.pricePercentChange1d;

        const nativeFiat1dAgo = getCalculatedTokenAmount1dAgo(
          item.nativeFiatValue,
          nativePricePercentChange1d,
        );
        return (
          total1dAgoCrossChains + perChainERC20Total + Number(nativeFiat1dAgo)
        );
      },
      0,
    ); // Initial total1dAgo is 0
  }, [tokenFiatBalancesCrossChains, crossChainMarketData]);

  const totalCrossChainBalance: number = Number(totalFiatCrossChains);
  const crossChainTotalBalance1dAgo = totalFiat1dAgoCrossChains;

  const amountChangeCrossChains =
    totalCrossChainBalance - crossChainTotalBalance1dAgo;
  const percentageChangeCrossChains =
    (amountChangeCrossChains / crossChainTotalBalance1dAgo) * 100 || 0;

  const formattedPercentChangeCrossChains = formatValue(
    amountChangeCrossChains === 0 ? 0 : percentageChangeCrossChains,
    true,
  );

  let formattedAmountChangeCrossChains = '';
  if (isValidAmount(amountChangeCrossChains)) {
    formattedAmountChangeCrossChains =
      (amountChangeCrossChains as number) >= 0 ? '+' : '';

    const options = {
      notation: 'compact',
      compactDisplay: 'short',
      maximumFractionDigits: 2,
    } as const;

    try {
      // For currencies compliant with ISO 4217 Standard
      formattedAmountChangeCrossChains += `${Intl.NumberFormat(locale, {
        ...options,
        style: 'currency',
        currency: fiatCurrency,
      }).format(amountChangeCrossChains as number)} `;
    } catch {
      // Non-standard Currency Codes
      formattedAmountChangeCrossChains += `${Intl.NumberFormat(locale, {
        ...options,
        minimumFractionDigits: 2,
        style: 'decimal',
      }).format(amountChangeCrossChains as number)} `;
    }
  }

  let color = TextColor.textDefault;

  if (!privacyMode && isValidAmount(amountChangeCrossChains)) {
    if ((amountChangeCrossChains as number) === 0) {
      color = TextColor.textDefault;
    } else if ((amountChangeCrossChains as number) > 0) {
      color = TextColor.successDefault;
    } else {
      color = TextColor.errorDefault;
    }
  } else {
    color = TextColor.textAlternative;
  }

  return (
    <Box display={Display.Flex}>
      <SensitiveText
        variant={TextVariant.bodyMdMedium}
        color={color}
        data-testid="aggregated-value-change"
        style={{ whiteSpace: 'pre' }}
        isHidden={privacyMode}
        ellipsis
        length="10"
      >
        {formattedAmountChangeCrossChains}
      </SensitiveText>
      <SensitiveText
        variant={TextVariant.bodyMdMedium}
        color={color}
        data-testid="aggregated-percentage-change"
        isHidden={privacyMode}
        ellipsis
        length="10"
      >
        {formattedPercentChangeCrossChains}
      </SensitiveText>
    </Box>
  );
};
