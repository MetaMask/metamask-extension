import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { zeroAddress, toChecksumAddress } from 'ethereumjs-util';
import {
  getCurrentCurrency,
  getSelectedAccount,
  getShouldHideZeroBalanceTokens,
  getPreferences,
  getMarketData,
  getNetworkConfigurationsByChainId,
  getAllTokens,
} from '../../../selectors';

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
import { TEST_CHAINS } from '../../../../shared/constants/network';
import { useTokenTracker } from '../../../hooks/useTokenBalances';

export const AggregatedPercentageOverviewCrossChains = () => {
  const locale = useSelector(getIntlLocale);
  const fiatCurrency = useSelector(getCurrentCurrency);
  const { privacyMode } = useSelector(getPreferences);
  const selectedAccount = useSelector(getSelectedAccount);
  const shouldHideZeroBalanceTokens = useSelector(
    getShouldHideZeroBalanceTokens,
  );
  const crossChainMarketData = useSelector(getMarketData);

  const allNetworks = useSelector(getNetworkConfigurationsByChainId);
  const allChainIDs = Object.entries(allNetworks)
    .map(([chainIdElm, _]) => {
      return chainIdElm;
    })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter((singleChainId) => !TEST_CHAINS.includes(singleChainId as any));

  const detectedTokens = useSelector(getAllTokens);
  const dataTokensWithBalancesCrossChain = allChainIDs.map((singleChain) => {
    const tokens =
      detectedTokens?.[singleChain]?.[selectedAccount?.address] ?? [];
    const { tokensWithBalances } = useTokenTracker({
      chainId: singleChain as `0x${string}`,
      tokens,
      address: selectedAccount.address,
      hideZeroBalanceTokens: shouldHideZeroBalanceTokens,
    });
    return {
      chainId: singleChain,
      tokensWithBalances,
    };
  });
  const {
    totalFiatBalance: totalFiatCrossChains,
    tokenFiatBalancesCrossChains,
  } = useAccountTotalCrossChainFiatBalance(
    selectedAccount,
    dataTokensWithBalancesCrossChain,
  );

  const getPerChainTotalFiat1dAgo = (
    chainId: string,
    tokenFiatBalances: { [x: string]: any },
    tokensWithBalances: any[],
  ) => {
    const totalPerChain1dAgoERC20 = tokensWithBalances.reduce(
      (total1dAgo: number, item: { address: string }, idx: string | number) => {
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
      (total1dAgoCrossChains: any, item: any) => {
        const perChainERC20Total = getPerChainTotalFiat1dAgo(
          item.chainId,
          item.tokenFiatBalances,
          item.tokensWithBalances,
        );
        const nativePricePercentChange1d =
          crossChainMarketData?.[item.chainId]?.[zeroAddress()]
            ?.pricePercentChange1d;

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
