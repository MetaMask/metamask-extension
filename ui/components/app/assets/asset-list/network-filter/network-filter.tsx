import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setTokenNetworkFilter } from '../../../../../store/actions';
import {
  getCurrentChainId,
  getCurrentNetwork,
  getIsTestnet,
  getPreferences,
  getNetworkConfigurationsByChainId,
  getSelectedAccount,
  getShouldHideZeroBalanceTokens,
  getCurrentCurrency,
  getSelectedAccountTokensAcrossChains,
  getSelectedAccountNativeTokenCachedBalanceByChainId,
  getMarketData,
  getCurrencyRates,
} from '../../../../../selectors';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { SelectableListItem } from '../sort-control/sort-control';
import { Text } from '../../../../component-library/text/text';
import {
  AlignItems,
  Display,
  JustifyContent,
  TextColor,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
import { Box } from '../../../../component-library/box/box';
import {
  AvatarNetwork,
  AvatarNetworkSize,
} from '../../../../component-library';
import {
  CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP,
  TEST_CHAINS,
} from '../../../../../../shared/constants/network';
import { useAccountTotalCrossChainFiatBalance } from '../../../../../hooks/useAccountTotalCrossChainFiatBalance';
import { useGetFormattedTokensPerChain } from '../../../../../hooks/useGetFormattedTokensPerChain';
import { formatWithThreshold } from '../../token-cell/token-cell';
import { getIntlLocale } from '../../../../../ducks/locale/locale';
import { useTokenBalances } from '../../../../../hooks/useTokenBalances';
import { calculateTokenBalance } from '../../util/calculateTokenBalance';
import { Hex } from '@metamask/utils';
import { ChainAddressMarketData, Token } from '../../token-list/token-list';
import { calculateTokenFiatAmount } from '../../util/calculateTokenFiatAmount';
import { zeroAddress } from 'ethereumjs-util';
import { findAssetByAddress } from '../../../../../pages/asset/util';

type SortControlProps = {
  handleClose: () => void;
};

const NetworkFilter = ({ handleClose }: SortControlProps) => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const locale = useSelector(getIntlLocale);
  const chainId = useSelector(getCurrentChainId);
  const selectedAccount = useSelector(getSelectedAccount);
  const currentNetwork = useSelector(getCurrentNetwork);
  const currentCurrency = useSelector(getCurrentCurrency);
  const allNetworks = useSelector(getNetworkConfigurationsByChainId);
  const { tokenNetworkFilter, showNativeTokenAsMainBalance } =
    useSelector(getPreferences);
  const shouldHideZeroBalanceTokens = useSelector(
    getShouldHideZeroBalanceTokens,
  );

  const selectedAccountTokensChains: Record<Hex, Token[]> = useSelector(
    getSelectedAccountTokensAcrossChains,
  ) as Record<Hex, Token[]>;

  const nativeBalances: Record<Hex, Hex> = useSelector(
    getSelectedAccountNativeTokenCachedBalanceByChainId,
  ) as Record<Hex, Hex>;

  const marketData: ChainAddressMarketData = useSelector(
    getMarketData,
  ) as ChainAddressMarketData;

  const currencyRates = useSelector(getCurrencyRates);

  const { formattedTokensWithBalancesPerChain } = useGetFormattedTokensPerChain(
    selectedAccount,
    shouldHideZeroBalanceTokens,
  );
  const { totalFiatBalance } = useAccountTotalCrossChainFiatBalance(
    selectedAccount,
    formattedTokensWithBalancesPerChain,
  );

  const { tokenBalances } = useTokenBalances();

  const [chainsToShow, setChainsToShow] = useState<string[]>([]);

  const currentChainBalances =
    tokenBalances[selectedAccount.address]?.[chainId];
  const currentChainTokenInfo = selectedAccountTokensChains[chainId];
  const nativeToken = currentChainTokenInfo.find((token) => token.isNative);

  const selectedAccountBalances = useMemo(() => {
    if (!currentChainBalances || !currentChainTokenInfo) {
      return { aggregatedFiatAmount: 0, nativeTokenBalance: 0 }; // Return 0 for both if no balances or token info
    }

    let nativeTokenBalance = 0;

    // Aggregate the total fiat amount and find native token balance
    const aggregatedFiatAmount = Object.entries({
      ...currentChainBalances,
      nativeToken,
    }).reduce((totalFiat, [address]) => {
      const tokenInfo =
        address === 'nativeToken'
          ? nativeToken
          : currentChainTokenInfo.find((token) => token.address === address);

      if (!tokenInfo) {
        return totalFiat; // Skip if tokenInfo is not found
      }

      const calculatedTokenBalance =
        calculateTokenBalance({
          isNative: tokenInfo.isNative,
          chainId: tokenInfo.chainId,
          address: tokenInfo.address,
          decimals: tokenInfo.decimals,
          nativeBalances,
          selectedAccountTokenBalancesAcrossChains:
            tokenBalances[selectedAccount.address],
        }) || '0';

      const tokenFiatAmount = calculateTokenFiatAmount({
        token: tokenInfo,
        chainId: tokenInfo.chainId,
        balance: calculatedTokenBalance,
        marketData,
        currencyRates,
      });

      // If it's the native token, set the native token balance
      if (address === 'nativeToken') {
        nativeTokenBalance = parseFloat(String(calculatedTokenBalance) || '0');
      }

      // Accumulate fiat amount for all tokens
      return totalFiat + parseFloat(String(tokenFiatAmount) || '0');
    }, 0); // Initial total fiat amount is 0

    return { aggregatedFiatAmount, nativeTokenBalance }; // Return both values
  }, [
    tokenBalances,
    selectedAccount.address,
    chainId,
    selectedAccountTokensChains,
    nativeBalances,
    marketData,
    currencyRates,
  ]);

  const formattedAggregatedMultichainBalance = formatWithThreshold(
    totalFiatBalance,
    0.01,
    locale,
    {
      style: 'currency',
      currency: currentCurrency.toUpperCase(),
    },
  );

  const formattedAggregatedCurrentChainFiatBalance = formatWithThreshold(
    selectedAccountBalances.aggregatedFiatAmount || 0,
    0.01,
    locale,
    {
      style: 'currency',
      currency: currentCurrency.toUpperCase(),
    },
  );

  const num = Number(selectedAccountBalances.aggregatedFiatAmount);
  const hasNonZeroDecimal = num % 1 !== 0;

  const formattedAggregatedCurrentChainNativeTokenBalance = formatWithThreshold(
    selectedAccountBalances.nativeTokenBalance || 0,
    0.0001,
    locale,
    {
      minimumFractionDigits: hasNonZeroDecimal ? 4 : 0,
      maximumFractionDigits: hasNonZeroDecimal ? 4 : 0,
    },
    nativeToken?.symbol,
  );

  const handleFilter = (chainFilters: Record<string, boolean>) => {
    dispatch(setTokenNetworkFilter(chainFilters));

    // TODO Add metrics
    handleClose();
  };

  useEffect(() => {
    const testnetChains: string[] = TEST_CHAINS;
    const mainnetChainIds = Object.keys(allNetworks).filter(
      (chain) => !testnetChains.includes(chain),
    );
    setChainsToShow(mainnetChainIds);
  }, []);

  const allOpts: Record<string, boolean> = {};
  Object.keys(allNetworks).forEach((chain) => {
    allOpts[chain] = true;
  });

  return (
    <>
      <SelectableListItem
        isSelected={
          Object.keys(tokenNetworkFilter).length ===
          Object.keys(allNetworks).length
        }
        onClick={() => handleFilter(allOpts)}
      >
        <Box
          display={Display.Flex}
          justifyContent={JustifyContent.spaceBetween}
        >
          <Box>
            <Text
              variant={TextVariant.bodyMdMedium}
              color={TextColor.textDefault}
            >
              {t('allNetworks')}
            </Text>
            <Text
              variant={TextVariant.bodySmMedium}
              color={TextColor.textAlternative}
            >
              {formattedAggregatedMultichainBalance}
            </Text>
          </Box>
          <Box display={Display.Flex} alignItems={AlignItems.center}>
            {chainsToShow
              .slice(0, 5) // only show a max of 5 icons overlapping
              .map((chain, index) => {
                const networkImageUrl =
                  CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP[
                    chain as keyof typeof CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP
                  ];
                return (
                  <AvatarNetwork
                    key={chainId}
                    name="All"
                    src={networkImageUrl ?? undefined}
                    size={AvatarNetworkSize.Sm}
                    // overlap the icons
                    style={{
                      marginLeft: index === 0 ? 0 : '-20px',
                      zIndex: 5 - index,
                    }}
                  />
                );
              })}
          </Box>
        </Box>
      </SelectableListItem>
      <SelectableListItem
        isSelected={
          tokenNetworkFilter[chainId] &&
          Object.keys(tokenNetworkFilter).length === 1
        }
        onClick={() => handleFilter({ [chainId]: true })}
      >
        <Box
          display={Display.Flex}
          justifyContent={JustifyContent.spaceBetween}
          alignItems={AlignItems.center}
        >
          <Box>
            <Text
              variant={TextVariant.bodyMdMedium}
              color={TextColor.textDefault}
            >
              {t('currentNetwork')}
            </Text>
            <Text
              variant={TextVariant.bodySmMedium}
              color={TextColor.textAlternative}
            >
              {showNativeTokenAsMainBalance
                ? formattedAggregatedCurrentChainNativeTokenBalance
                : formattedAggregatedCurrentChainFiatBalance}
            </Text>
          </Box>
          <AvatarNetwork
            name="Current"
            src={currentNetwork?.rpcPrefs?.imageUrl}
          />
        </Box>
      </SelectableListItem>
    </>
  );
};

export default NetworkFilter;
