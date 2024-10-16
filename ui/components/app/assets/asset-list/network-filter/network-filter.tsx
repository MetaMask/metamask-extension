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

  const { totalFiatBalance: selectedAccountBalance, loading } =
    useAccountTotalFiatBalance(selectedAccount, shouldHideZeroBalanceTokens);

  // TODO: fetch balances across networks
  // const multiNetworkAccountBalance = useMultichainAccountBalance()

  const handleFilter = (chainFilters: Record<string, boolean>) => {
    dispatch(setTokenNetworkFilter(chainFilters));

    // TODO Add metrics
    handleClose();
  };

  return (
    <>
      <SelectableListItem
        isSelected={!Object.keys(tokenNetworkFilter).length}
        onClick={() => handleFilter({})}
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
              All Networks
            </Text>
            <Text
              variant={TextVariant.bodyMdMedium}
              color={TextColor.textDefault}
            >
              $1,000.00
            </Text>
          </Box>
          <Box display={Display.Flex}>
            {Object.values(allNetworks).map((network, index) => {
              if (index >= 5) return null; // only show a max of 5 icons overlapping
              const chainId =
                network.chainId as keyof typeof CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP;
              return (
                <AvatarNetwork
                  name="All"
                  src={CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP[chainId] ?? undefined}
                  // overlap the icons
                  style={{
                    marginLeft: index === 0 ? 0 : '-20px',
                    zIndex: Object.values(allNetworks).length - index,
                  }}
                />
              );
            })}
          </Box>
        </Box>
      </SelectableListItem>
      <SelectableListItem
        isSelected={tokenNetworkFilter[chainId]}
        onClick={() => handleFilter({ [chainId]: true })}
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
              Current Network
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
