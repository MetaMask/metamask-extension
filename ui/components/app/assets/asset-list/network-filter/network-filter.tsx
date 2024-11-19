import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setTokenNetworkFilter } from '../../../../../store/actions';
import {
  getCurrentChainId,
  getCurrentNetwork,
  getIsTestnet,
  getPreferences,
  getNetworkConfigurationsByChainId,
  getShouldHideZeroBalanceTokens,
  getSelectedAccount,
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
import UserPreferencedCurrencyDisplay from '../../../user-preferenced-currency-display';
import {
  CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP,
  TEST_CHAINS,
} from '../../../../../../shared/constants/network';
import { useGetFormattedTokensPerChain } from '../../../../../hooks/useGetFormattedTokensPerChain';
import { useAccountTotalCrossChainFiatBalance } from '../../../../../hooks/useAccountTotalCrossChainFiatBalance';

type SortControlProps = {
  handleClose: () => void;
};

const NetworkFilter = ({ handleClose }: SortControlProps) => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const chainId = useSelector(getCurrentChainId);
  const selectedAccount = useSelector(getSelectedAccount)
  const currentNetwork = useSelector(getCurrentNetwork);
  const allNetworks = useSelector(getNetworkConfigurationsByChainId);
  const isTestnet = useSelector(getIsTestnet);

  const [chainsToShow, setChainsToShow] = useState<string[]>([]);
  const { tokenNetworkFilter } = useSelector(getPreferences);
  const shouldHideZeroBalanceTokens = useSelector(
    getShouldHideZeroBalanceTokens,
  );

  const { formattedTokensWithBalancesPerChain } = useGetFormattedTokensPerChain(
    selectedAccount,
    shouldHideZeroBalanceTokens,
    true,
  );
  const { totalFiatBalance: selectedAccountBalance } =
    useAccountTotalCrossChainFiatBalance(
      selectedAccount,
      formattedTokensWithBalancesPerChain,
    );

  const { formattedTokensWithBalancesPerChain: formattedTokensForAllNetworks } =
    useGetFormattedTokensPerChain(
      selectedAccount,
      shouldHideZeroBalanceTokens,
      false,
    );
  const { totalFiatBalance: selectedAccountBalanceForAllNetworks } =
    useAccountTotalCrossChainFiatBalance(
      selectedAccount,
      formattedTokensForAllNetworks,
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
              {/* TODO: Should query cross chain account balance */}

              <UserPreferencedCurrencyDisplay
                value={selectedAccountBalanceForAllNetworks}
                type="PRIMARY"
                ethNumberOfDecimals={4}
                hideTitle
                showFiat
                shouldCheckShowNativeToken
                isAggregatedFiatOverviewBalance={!isTestnet}
              />
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
            <UserPreferencedCurrencyDisplay
              value={selectedAccountBalance}
              type="PRIMARY"
              textProps={{
                color: TextColor.textAlternative,
                variant: TextVariant.bodySmMedium,
              }}
              ethNumberOfDecimals={4}
              hideTitle
              showFiat
              shouldCheckShowNativeToken
              isAggregatedFiatOverviewBalance={!isTestnet}
            />
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
