import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setTokenNetworkFilter } from '../../../../../store/actions';
import {
  getCurrentNetwork,
  getShouldHideZeroBalanceTokens,
  getSelectedAccount,
  getAllChainsToPoll,
  getTokenNetworkFilter,
  getIsTokenNetworkFilterEqualCurrentNetwork,
} from '../../../../../selectors';
import {
  getCurrentChainId,
  getNetworkConfigurationsByChainId,
} from '../../../../../../shared/modules/selectors/networks';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { SelectableListItem } from '../sort-control/sort-control';
import { Text } from '../../../../component-library/text/text';
import {
  AlignItems,
  BlockSize,
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
  FEATURED_NETWORK_CHAIN_IDS,
} from '../../../../../../shared/constants/network';
import { useGetFormattedTokensPerChain } from '../../../../../hooks/useGetFormattedTokensPerChain';
import { useAccountTotalCrossChainFiatBalance } from '../../../../../hooks/useAccountTotalCrossChainFiatBalance';
import InfoTooltip from '../../../../ui/info-tooltip';

type SortControlProps = {
  handleClose: () => void;
};

const NetworkFilter = ({ handleClose }: SortControlProps) => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const chainId = useSelector(getCurrentChainId);
  const currentNetwork = useSelector(getCurrentNetwork);
  const selectedAccount = useSelector(getSelectedAccount);
  const allNetworks = useSelector(getNetworkConfigurationsByChainId);
  const tokenNetworkFilter = useSelector(getTokenNetworkFilter);
  const isTokenNetworkFilterEqualCurrentNetwork = useSelector(
    getIsTokenNetworkFilterEqualCurrentNetwork,
  );

  const shouldHideZeroBalanceTokens = useSelector(
    getShouldHideZeroBalanceTokens,
  );
  const allChainIDs = useSelector(getAllChainsToPoll);
  const { formattedTokensWithBalancesPerChain } = useGetFormattedTokensPerChain(
    selectedAccount,
    shouldHideZeroBalanceTokens,
    true, // true to get formattedTokensWithBalancesPerChain for the current chain
    allChainIDs,
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
      false, // false to get the value for all networks
      allChainIDs,
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

  const allOpts: Record<string, boolean> = {};
  Object.keys(allNetworks || {}).forEach((chain) => {
    allOpts[chain] = true;
  });

  const allAddedPopularNetworks = FEATURED_NETWORK_CHAIN_IDS.filter(
    (chain) => allOpts[chain],
  ).map((chain) => {
    return allNetworks[chain].name;
  });

  return (
    <>
      <SelectableListItem
        isSelected={!isTokenNetworkFilterEqualCurrentNetwork}
        onClick={() => handleFilter(allOpts)}
        testId="network-filter-all"
      >
        <Box
          display={Display.Flex}
          justifyContent={JustifyContent.spaceBetween}
          width={BlockSize.Full}
          gap={3}
        >
          <Box>
            <Text
              variant={TextVariant.bodyMdMedium}
              color={TextColor.textDefault}
            >
              {t('popularNetworks')}
            </Text>
            <Text
              variant={TextVariant.bodySmMedium}
              color={TextColor.textAlternative}
              data-testid="network-filter-all__total"
            >
              <UserPreferencedCurrencyDisplay
                value={selectedAccountBalanceForAllNetworks}
                type="PRIMARY"
                ethNumberOfDecimals={4}
                hideTitle
                showFiat
                isAggregatedFiatOverviewBalance
              />
            </Text>
          </Box>
          <Box display={Display.Flex} alignItems={AlignItems.center}>
            <InfoTooltip
              position="bottom"
              contentText={allAddedPopularNetworks.join(', ')}
            />
            {FEATURED_NETWORK_CHAIN_IDS.filter((chain) => allOpts[chain]).map(
              (chain, index) => {
                const networkImageUrl =
                  CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP[
                    chain as keyof typeof CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP
                  ];
                return (
                  <AvatarNetwork
                    key={networkImageUrl}
                    name={networkImageUrl}
                    src={networkImageUrl ?? undefined}
                    size={AvatarNetworkSize.Sm}
                    // overlap the icons
                    style={{
                      marginLeft: index === 0 ? 0 : '-20px',
                      zIndex: 5 - index,
                    }}
                  />
                );
              },
            )}
          </Box>
        </Box>
      </SelectableListItem>
      <SelectableListItem
        isSelected={
          Object.keys(tokenNetworkFilter).length === 1 &&
          tokenNetworkFilter[chainId]
        }
        onClick={() => handleFilter({ [chainId]: true })}
        testId="network-filter-current"
      >
        <Box
          display={Display.Flex}
          justifyContent={JustifyContent.spaceBetween}
          gap={3}
          alignItems={AlignItems.center}
          width={BlockSize.Full}
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
              <UserPreferencedCurrencyDisplay
                value={selectedAccountBalance}
                type="PRIMARY"
                ethNumberOfDecimals={4}
                hideTitle
                showFiat
                isAggregatedFiatOverviewBalance
              />
            </Text>
          </Box>
          <AvatarNetwork
            size={AvatarNetworkSize.Sm}
            name={currentNetwork?.nickname || ''}
            src={currentNetwork?.rpcPrefs?.imageUrl}
          />
        </Box>
      </SelectableListItem>
    </>
  );
};

export default NetworkFilter;
