import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { InternalAccount } from '@metamask/keyring-internal-api';
import { CaipChainId } from '@metamask/utils';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  BackgroundColor,
  BlockSize,
  BorderRadius,
} from '../../../helpers/constants/design-system';
import {
  Box,
  BoxFlexDirection,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { TextFieldSearch, TextFieldSearchSize } from '../../component-library';
import { MultichainAddressRow } from '../multichain-address-row/multichain-address-row';
import { getMultichainNetworkConfigurationsByChainId } from '../../../selectors/multichain/networks';
import {
  NetworkAddressItem,
  sortNetworkAddressItems,
  getCompatibleNetworksForAccount,
} from './utils';

export type MultichainAddressRowsListProps = {
  /**
   * Array of InternalAccount objects to determine compatible networks for
   */
  accounts?: InternalAccount[];
};

export const MultichainAddressRowsList = ({
  accounts = [],
}: MultichainAddressRowsListProps) => {
  const t = useI18nContext();
  const [searchPattern, setSearchPattern] = React.useState<string>('');

  const [multichainNetworks] = useSelector(
    getMultichainNetworkConfigurationsByChainId,
  );

  const allNetworks = useMemo(() => {
    const networks: Record<string, { name: string; chainId: CaipChainId }> = {};

    if (!multichainNetworks) {
      return networks;
    }

    Object.entries(multichainNetworks).forEach(([chainId, networkConfig]) => {
      if (networkConfig && networkConfig.name) {
        networks[chainId] = {
          name: networkConfig.name,
          chainId: chainId as CaipChainId,
        };
      }
    });

    return networks;
  }, [multichainNetworks]);

  // Generate network address items for all accounts and their compatible networks
  const networkAddressItems = useMemo(() => {
    const items: NetworkAddressItem[] = [];

    accounts.forEach((account) => {
      const compatibleItems = getCompatibleNetworksForAccount(
        account,
        allNetworks,
      );
      items.push(...compatibleItems);
    });

    return items;
  }, [accounts, allNetworks]);

  const filteredItems = useMemo(() => {
    if (!searchPattern.trim()) {
      return sortNetworkAddressItems(networkAddressItems);
    }

    const pattern = searchPattern.toLowerCase();
    const filtered = networkAddressItems.filter((item) => {
      return (
        item.networkName.toLowerCase().includes(pattern) ||
        item.address.toLowerCase().includes(pattern)
      );
    });

    return sortNetworkAddressItems(filtered);
  }, [networkAddressItems, searchPattern]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchPattern(event.target.value);
  };

  const handleClearSearch = () => {
    setSearchPattern('');
  };

  return (
    <Box
      flexDirection={BoxFlexDirection.Column}
      data-testid="multichain-address-rows-list"
    >
      <Box padding={4}>
        <TextFieldSearch
          size={TextFieldSearchSize.Lg}
          placeholder={t('searchNetworks')}
          value={searchPattern}
          onChange={handleSearchChange}
          clearButtonOnClick={handleClearSearch}
          width={BlockSize.Full}
          borderWidth={0}
          backgroundColor={BackgroundColor.backgroundMuted}
          borderRadius={BorderRadius.LG}
          data-testid="multichain-address-rows-list-search"
        />
      </Box>

      <Box>
        {filteredItems.length > 0 ? (
          filteredItems.map((item, index) => (
            <MultichainAddressRow
              key={`${item.address}-${item.chainId}-${index}`}
              chainId={item.chainId}
              networkName={item.networkName}
              address={item.address}
            />
          ))
        ) : (
          <Box padding={6}>
            <Text
              variant={TextVariant.BodyMd}
              color={TextColor.TextAlternative}
              data-testid="multichain-address-rows-list-empty-message"
            >
              {searchPattern ? t('noNetworksFound') : t('noNetworksAvailable')}
            </Text>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default MultichainAddressRowsList;
