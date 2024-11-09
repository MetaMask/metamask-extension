import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setTokenNetworkFilter } from '../../../../../store/actions';
import {
  getCurrentChainId,
  getCurrentNetwork,
  getIsTestnet,
  getPreferences,
  getSelectedInternalAccount,
  getShouldHideZeroBalanceTokens,
  getNetworkConfigurationsByChainId,
} from '../../../../../selectors';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { SelectableListItem } from '../sort-control/sort-control';
import { useAccountTotalFiatBalance } from '../../../../../hooks/useAccountTotalFiatBalance';
import { Text } from '../../../../component-library/text/text';
import {
  Display,
  JustifyContent,
  TextColor,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
import { Box } from '../../../../component-library/box/box';
import { AvatarNetwork } from '../../../../component-library';
import UserPreferencedCurrencyDisplay from '../../../user-preferenced-currency-display';
import { CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP } from '../../../../../../shared/constants/network';

type SortControlProps = {
  handleClose: () => void;
};

const NetworkFilter = ({ handleClose }: SortControlProps) => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const chainId = useSelector(getCurrentChainId);
  const selectedAccount = useSelector(getSelectedInternalAccount);
  const currentNetwork = useSelector(getCurrentNetwork);
  const allNetworks = useSelector(getNetworkConfigurationsByChainId);
  const isTestnet = useSelector(getIsTestnet);
  const { tokenNetworkFilter, showNativeTokenAsMainBalance } =
    useSelector(getPreferences);
  const shouldHideZeroBalanceTokens = useSelector(
    getShouldHideZeroBalanceTokens,
  );

  // const { totalFiatBalance: selectedAccountBalance } =
  //   useAccountTotalFiatBalance(selectedAccount, shouldHideZeroBalanceTokens);

  const selectedAccountBalance = 100;

  // TODO: fetch balances across networks
  // const multiNetworkAccountBalance = useMultichainAccountBalance()

  const handleFilter = (chainFilters: Record<string, boolean>) => {
    dispatch(setTokenNetworkFilter(chainFilters));

    // TODO Add metrics
    handleClose();
  };

  const allOpts: Record<string, boolean> = {};
  Object.keys(allNetworks).forEach((chainId) => {
    allOpts[chainId] = true;
  });

  return (
    <>
      <SelectableListItem
        isSelected={
          Object.keys(tokenNetworkFilter).length ===
          Object.keys(allNetworks).length
        }
        onClick={() => handleFilter(allOpts)}
        testId="network-filter-all"
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
              variant={TextVariant.bodyMdMedium}
              color={TextColor.textDefault}
              data-testid="network-filter-all__total"
            >
              {/* TODO: Should query cross chain account balance */}
              $1,000.00
            </Text>
          </Box>
          <Box display={Display.Flex}>
            {Object.values(allNetworks)
              .slice(0, 5) // only show a max of 5 icons overlapping
              .map((network, index) => {
                const networkImageUrl =
                  CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP[
                    network.chainId as keyof typeof CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP
                  ];
                return (
                  <AvatarNetwork
                    key={network.chainId}
                    name="All"
                    src={networkImageUrl ?? undefined}
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
        testId="network-filter-current"
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
              {t('currentNetwork')}
            </Text>
            <UserPreferencedCurrencyDisplay
              value={selectedAccountBalance}
              type="PRIMARY"
              ethNumberOfDecimals={4}
              hideTitle
              shouldCheckShowNativeToken
              isAggregatedFiatOverviewBalance={
                !showNativeTokenAsMainBalance && !isTestnet
              }
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
