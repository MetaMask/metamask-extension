import React, { useMemo, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { type AccountGroupId } from '@metamask/account-api';
import { CaipChainId } from '@metamask/utils';
import { InternalAccount } from '@metamask/keyring-internal-api';
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
import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard';
import { MultichainAddressRow } from '../multichain-address-row/multichain-address-row';
import { getInternalAccountListSpreadByScopesByGroupId } from '../../../selectors/multichain-accounts/account-tree';

// Priority networks that should appear first (using CAIP chain IDs)
const PRIORITY_CHAIN_IDS: CaipChainId[] = [
  'eip155:1' as CaipChainId, // Ethereum mainnet
  'bip122:000000000019d6689c085ae165831e93' as CaipChainId, // Bitcoin mainnet
  'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp' as CaipChainId, // Solana mainnet
  'tron:0x2b6653dc' as CaipChainId, // Tron mainnet
  'eip155:59144' as CaipChainId, // Linea mainnet
];

export type MultichainAddressRowsListProps = {
  /**
   * The account group ID.
   */
  groupId: AccountGroupId;
  /**
   * Callback for when QR code button is clicked
   */
  onQrClick: (
    address: string,
    networkName: string,
    chainId: CaipChainId,
    networkImageSrc?: string,
  ) => void;
};

export const MultichainAddressRowsList = ({
  groupId,
  onQrClick,
}: MultichainAddressRowsListProps) => {
  const t = useI18nContext();
  const [searchPattern, setSearchPattern] = React.useState<string>('');
  const [, handleCopy] = useCopyToClipboard();

  const getAccountsSpreadByNetworkByGroupId = useSelector((state) =>
    getInternalAccountListSpreadByScopesByGroupId(state, groupId),
  );

  const sortByPriorityNetworks = useCallback(
    (items: typeof getAccountsSpreadByNetworkByGroupId) => {
      const priorityItems: typeof items = [];
      const otherItems: typeof items = [];

      items.forEach((item) => {
        const priorityIndex = PRIORITY_CHAIN_IDS.findIndex(
          (chainId) => chainId === item.scope,
        );

        if (priorityIndex >= 0) {
          // Store with priority index for proper ordering
          priorityItems[priorityIndex] = item;
        } else {
          otherItems.push(item);
        }
      });

      // Filter out undefined entries and maintain priority order
      return [...priorityItems.filter(Boolean), ...otherItems];
    },
    [],
  );

  const filteredItems = useMemo(() => {
    let items = getAccountsSpreadByNetworkByGroupId;

    // Apply search filter if there's a search pattern
    if (searchPattern.trim()) {
      const pattern = searchPattern.toLowerCase();
      items = items.filter(({ networkName, account }) => {
        return (
          networkName.toLowerCase().includes(pattern) ||
          account.address.toLowerCase().includes(pattern)
        );
      });
    }

    // Sort by priority networks
    return sortByPriorityNetworks(items);
  }, [
    getAccountsSpreadByNetworkByGroupId,
    searchPattern,
    sortByPriorityNetworks,
  ]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchPattern(event.target.value);
  };

  const handleClearSearch = () => {
    setSearchPattern('');
  };

  const renderAddressItem = useCallback(
    (
      item: {
        scope: CaipChainId;
        account: InternalAccount;
        networkName: string;
      },
      index: number,
    ): React.JSX.Element => {
      const handleCopyClick = () => {
        handleCopy(item.account.address);
      };

      return (
        <MultichainAddressRow
          key={`${item.account.address}-${item.scope}-${index}`}
          chainId={item.scope}
          networkName={item.networkName}
          address={item.account.address}
          copyActionParams={{
            message: t('multichainAccountAddressCopied'),
            callback: handleCopyClick,
          }}
          qrActionParams={{
            callback: onQrClick,
          }}
        />
      );
    },
    [handleCopy, onQrClick, t],
  );

  const renderedRows = useMemo(() => {
    return filteredItems.map((item, index) => renderAddressItem(item, index));
  }, [filteredItems, renderAddressItem]);

  return (
    <Box
      display={Display.Flex}
      flexDirection={FlexDirection.Column}
      data-testid="multichain-address-rows-list"
    >
      <Box paddingLeft={4} paddingRight={4}>
        <TextFieldSearch
          size={TextFieldSearchSize.Lg}
          placeholder={t('searchNetworks')}
          value={searchPattern}
          onChange={handleSearchChange}
          clearButtonOnClick={handleClearSearch}
          width={BlockSize.Full}
          borderWidth={0}
          marginBottom={2}
          backgroundColor={BackgroundColor.backgroundMuted}
          borderRadius={BorderRadius.LG}
          data-testid="multichain-address-rows-list-search"
        />
      </Box>

      <Box>
        {filteredItems.length > 0 ? (
          renderedRows
        ) : (
          <Text
            variant={TextVariant.bodyMd}
            color={TextColor.textAlternative}
            textAlign={TextAlign.Center}
            paddingTop={8}
            data-testid="multichain-address-rows-list-empty-message"
          >
            {searchPattern ? t('noNetworksFound') : t('noNetworksAvailable')}
          </Text>
        )}
      </Box>
    </Box>
  );
};

export default MultichainAddressRowsList;
