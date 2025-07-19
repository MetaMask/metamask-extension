import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { InternalAccount } from '@metamask/keyring-internal-api';
import { CaipChainId } from '@metamask/utils';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  BackgroundColor,
  BlockSize,
  BorderRadius,
  Display,
  FlexDirection,
  TextAlign,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import {
  Box,
  Text,
  TextFieldSearch,
  TextFieldSearchSize,
} from '../../component-library';
import { MultichainAddressRow } from '../multichain-address-row/multichain-address-row';
import { getMultichainNetworkConfigurationsByChainId } from '../../../selectors/multichain/networks';
import { convertCaipToHexChainId } from '../../../../shared/modules/network.utils';
import {
  CHAIN_IDS,
  FEATURED_NETWORK_CHAIN_IDS,
  TEST_NETWORK_IDS,
} from '../../../../shared/constants/network';
import { MultichainNetworks } from '../../../../shared/constants/multichain/networks';

type NetworkAddressItem = {
  chainId: string;
  networkName: string;
  address: string;
};

type MultichainAddressRowsListProps = {
  /**
   * Array of InternalAccount objects to determine compatible networks for
   */
  accounts?: InternalAccount[];
  /**
   * Optional className for additional styling
   */
  className?: string;
};

/**
 * Sorts network address items according to priority:
 * 1. Ethereum first
 * 2. Solana second
 * 3. Featured networks (popular networks)
 * 4. Other custom networks
 * 5. Test networks last
 *
 * @param items
 */
const sortNetworkAddressItems = (
  items: NetworkAddressItem[],
): NetworkAddressItem[] => {
  return items.sort((a, b) => {
    // Chain IDs are now already in hex format, no conversion needed
    const aChainId = a.chainId;
    const bChainId = b.chainId;

    // Ethereum first
    if (aChainId === CHAIN_IDS.MAINNET) {
      return -1;
    }
    if (bChainId === CHAIN_IDS.MAINNET) {
      return 1;
    }

    // Solana second
    if (a.chainId === MultichainNetworks.SOLANA) {
      return -1;
    }
    if (b.chainId === MultichainNetworks.SOLANA) {
      return 1;
    }

    // Test networks last
    const aIsTestnet = TEST_NETWORK_IDS.includes(
      aChainId as (typeof TEST_NETWORK_IDS)[number],
    );
    const bIsTestnet = TEST_NETWORK_IDS.includes(
      bChainId as (typeof TEST_NETWORK_IDS)[number],
    );

    if (aIsTestnet && !bIsTestnet) {
      return 1;
    }
    if (!aIsTestnet && bIsTestnet) {
      return -1;
    }

    // Featured networks (popular networks) before other custom networks
    const aIsFeatured = FEATURED_NETWORK_CHAIN_IDS.includes(
      aChainId as (typeof FEATURED_NETWORK_CHAIN_IDS)[number],
    );
    const bIsFeatured = FEATURED_NETWORK_CHAIN_IDS.includes(
      bChainId as (typeof FEATURED_NETWORK_CHAIN_IDS)[number],
    );

    if (aIsFeatured && !bIsFeatured) {
      return -1;
    }
    if (!aIsFeatured && bIsFeatured) {
      return 1;
    }

    // Alphabetical order for networks in the same category
    return a.networkName.localeCompare(b.networkName);
  });
};

/**
 * Gets compatible networks for an InternalAccount based on its scopes
 *
 * @param account
 * @param allNetworks
 */
const getCompatibleNetworksForAccount = (
  account: InternalAccount,
  allNetworks: Record<string, { name: string; chainId: string }>,
): NetworkAddressItem[] => {
  const compatibleItems: NetworkAddressItem[] = [];

  if (!account.scopes || account.scopes.length === 0) {
    return compatibleItems;
  }

  account.scopes.forEach((scope: string) => {
    if (scope.includes(':*') || scope.endsWith(':0')) {
      // Wildcard scope like "eip155:*" or "eip155:0" (which means all EVM networks)
      const namespace = scope.split(':')[0];

      // Add all networks for this namespace
      Object.entries(allNetworks).forEach(([chainId, network]) => {
        const networkNamespace = chainId.split(':')[0];
        if (networkNamespace === namespace) {
          // Convert CAIP chain ID to hex format for EVM networks only
          // Non-EVM networks (solana, bip122) should stay in CAIP format
          const hexChainId =
            chainId.includes(':') && chainId.startsWith('eip155:')
              ? convertCaipToHexChainId(chainId as CaipChainId)
              : chainId;

          compatibleItems.push({
            chainId: hexChainId,
            networkName: network.name,
            address: account.address,
          });
        }
      });
    } else {
      // Specific network scope like "eip155:1"
      const network = allNetworks[scope];
      if (network) {
        // Convert CAIP chain ID to hex format for EVM networks only
        // Non-EVM networks (solana, bip122) should stay in CAIP format
        const hexChainId =
          scope.includes(':') && scope.startsWith('eip155:')
            ? convertCaipToHexChainId(scope as CaipChainId)
            : scope;

        compatibleItems.push({
          chainId: hexChainId,
          networkName: network.name,
          address: account.address,
        });
      }
    }
  });

  return compatibleItems;
};

export const MultichainAddressRowsList = ({
  accounts = [],
  className = '',
}: MultichainAddressRowsListProps) => {
  const t = useI18nContext();
  const [searchPattern, setSearchPattern] = React.useState<string>('');

  const [multichainNetworks] = useSelector(
    getMultichainNetworkConfigurationsByChainId,
  );

  const allNetworks = useMemo(() => {
    const networks: Record<string, { name: string; chainId: string }> = {};

    if (!multichainNetworks) {
      return networks;
    }

    Object.entries(multichainNetworks).forEach(([chainId, networkConfig]) => {
      if (networkConfig && networkConfig.name) {
        networks[chainId] = {
          name: networkConfig.name,
          chainId,
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
      className={`multichain-address-rows-list ${className}`}
      display={Display.Flex}
      flexDirection={FlexDirection.Column}
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
          <Box padding={6} textAlign={TextAlign.Center}>
            <Text
              variant={TextVariant.bodyMd}
              color={TextColor.textAlternative}
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
