import React, { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { toChecksumAddress } from 'ethereumjs-util';
import { getNativeTokenAddress } from '@metamask/assets-controllers';
import { Hex } from '@metamask/utils';
import { Box, Skeleton } from '@metamask/design-system-react';
import {
  getSelectedAccount,
  getShouldHideZeroBalanceTokens,
  getMarketData,
  getChainIdsToPoll,
  selectAnyEnabledNetworksAreAvailable,
} from '../../../selectors';
import { getPreferences } from '../../../../shared/lib/selectors/preferences';
import { getCurrentCurrency } from '../../../ducks/metamask/metamask';

import {
  formatValue,
  isValidAmount,
} from '../../../../shared/lib/format-value';
import { useFormatters } from '../../../hooks/useFormatters';
import {
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { SensitiveText } from '../../component-library';
import { getCalculatedTokenAmount1dAgo } from '../../../helpers/utils/util';
import { useAccountTotalCrossChainFiatBalance } from '../../../hooks/useAccountTotalCrossChainFiatBalance';
import { useGetFormattedTokensPerChain } from '../../../hooks/useGetFormattedTokensPerChain';
import { isZeroAmount } from '../../../helpers/utils/number-utils';
import { TokenWithBalance } from '../../multichain/asset-picker-amount/asset-picker-modal/types';

export const AggregatedPercentageOverviewCrossChains = ({
  trailingChild,
}: {
  trailingChild: () => JSX.Element | null;
}) => {
  const { formatCurrencyCompact } = useFormatters();
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
  const anyEnabledNetworksAreAvailable = useSelector(
    selectAnyEnabledNetworksAreAvailable,
  );

  const getPerChainTotalFiat1dAgo = useCallback(
    (
      chainId: string,
      tokenFiatBalances: (string | undefined)[],
      tokensWithBalances: TokenWithBalance[],
    ) => {
      const totalPerChain1dAgoERC20 = tokensWithBalances.reduce(
        (total1dAgo: number, item: { address: string }, idx: number) => {
          const found =
            crossChainMarketData?.[chainId as Hex]?.[
              toChecksumAddress(item.address) as Hex
            ];

          const tokenFiat1dAgo = getCalculatedTokenAmount1dAgo(
            tokenFiatBalances[idx],
            found?.pricePercentChange1d,
          );
          return total1dAgo + Number(tokenFiat1dAgo);
        },
        0,
      );

      return totalPerChain1dAgoERC20;
    },
    [crossChainMarketData],
  );

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
          crossChainMarketData?.[item.chainId as Hex]?.[
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

  const {
    amountChangeCrossChains,
    formattedPercentChangeCrossChains,
    formattedAmountChangeCrossChains,
    color,
  } = useMemo(() => {
    const totalCrossChainBalance: number = Number(totalFiatCrossChains);
    const crossChainTotalBalance1dAgo = totalFiat1dAgoCrossChains;
    const change = totalCrossChainBalance - crossChainTotalBalance1dAgo;
    const pctChange =
      crossChainTotalBalance1dAgo === 0
        ? 0
        : (change / crossChainTotalBalance1dAgo) * 100;

    const fmtPctChange = formatValue(change === 0 ? 0 : pctChange, true);

    let fmtAmountChange = '';
    if (isValidAmount(change)) {
      fmtAmountChange = (change as number) >= 0 ? '+' : '';
      fmtAmountChange += formatCurrencyCompact(change, fiatCurrency);
    }

    let derivedColor = TextColor.textDefault;
    if (!privacyMode && isValidAmount(change)) {
      if ((change as number) === 0) {
        derivedColor = TextColor.textDefault;
      } else if ((change as number) > 0) {
        derivedColor = TextColor.successDefault;
      } else {
        derivedColor = TextColor.errorDefault;
      }
    } else {
      derivedColor = TextColor.textAlternative;
    }

    return {
      amountChangeCrossChains: change,
      formattedPercentChangeCrossChains: fmtPctChange,
      formattedAmountChangeCrossChains: fmtAmountChange,
      color: derivedColor,
    };
  }, [
    totalFiatCrossChains,
    totalFiat1dAgoCrossChains,
    formatCurrencyCompact,
    fiatCurrency,
    privacyMode,
  ]);

  return (
    <Skeleton
      hideChildren={
        !anyEnabledNetworksAreAvailable &&
        isZeroAmount(formattedAmountChangeCrossChains)
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
      {trailingChild()}
    </Skeleton>
  );
};
