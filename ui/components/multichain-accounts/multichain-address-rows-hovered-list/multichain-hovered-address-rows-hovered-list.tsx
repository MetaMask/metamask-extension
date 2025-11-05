import React, { useMemo, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { type AccountGroupId } from '@metamask/account-api';
import { CaipChainId } from '@metamask/utils';
import { InternalAccount } from '@metamask/keyring-internal-api';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard';
import { getInternalAccountListSpreadByScopesByGroupId } from '../../../selectors/multichain-accounts/account-tree';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  Button,
  ButtonVariant,
  FontWeight,
  Icon,
  IconName,
  IconSize,
  Text,
  TextVariant,
} from '@metamask/design-system-react';
import { MultichainAggregatedAddressListRow } from './multichain-aggregated-list-row';
import { MULTICHAIN_ACCOUNT_ADDRESS_LIST_PAGE_ROUTE } from '../../../helpers/constants/routes';
import { useHistory } from 'react-router-dom';

// Priority networks that should appear first (using CAIP chain IDs)
const PRIORITY_CHAIN_IDS: CaipChainId[] = [
  'eip155:1' as CaipChainId, // Ethereum mainnet
  'bip122:000000000019d6689c085ae165831e93' as CaipChainId, // Bitcoin mainnet
  'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp' as CaipChainId, // Solana mainnet
  'tron:0x2b6653dc' as CaipChainId, // Tron mainnet
];

export type MultichainAddressRowsListProps = {
  /**
   * The account group ID.
   */
  groupId: AccountGroupId;
};

export const MultichainHoveredAddressRowsList = ({
  groupId,
}: MultichainAddressRowsListProps) => {
  const t = useI18nContext();
  const [, handleCopy] = useCopyToClipboard();
  const history = useHistory();

  const getAccountsSpreadByNetworkByGroupId = useSelector((state) =>
    getInternalAccountListSpreadByScopesByGroupId(state, groupId),
  );

  const sortByPriorityNetworks = useCallback(
    (items: typeof getAccountsSpreadByNetworkByGroupId) => {
      const accountGroups = items.reduce(
        (groups, item) => {
          const accountKey = item.account.address;
          if (!groups[accountKey]) {
            groups[accountKey] = {
              account: item.account,
              scopes: [],
            };
          }
          groups[accountKey].scopes.push(item.scope);
          return groups;
        },
        {} as Record<
          string,
          { account: InternalAccount; scopes: CaipChainId[] }
        >,
      );

      // Transform grouped data and separate eip155 scopes
      const transformedItems = Object.values(accountGroups)
        .map(({ account, scopes }) => {
          // Separate eip155 scopes from others
          const eip155Scopes = scopes.filter((scope) =>
            scope.startsWith('eip155:'),
          );
          const otherScopes = scopes.filter(
            (scope) => !scope.startsWith('eip155:'),
          );

          // Create items: one for grouped eip155 scopes (if any) and one for each other scope
          const items: Array<{
            scopes: CaipChainId[];
            account: InternalAccount;
          }> = [];

          if (eip155Scopes.length > 0) {
            items.push({
              scopes: eip155Scopes,
              account,
            });
          }

          otherScopes.forEach((scope) => {
            items.push({
              scopes: [scope],
              account,
            });
          });

          return items;
        })
        .flat();

      const priorityItems: Array<{
        scopes: CaipChainId[];
        account: InternalAccount;
      }> = [];
      const otherItems: typeof priorityItems = [];

      transformedItems.forEach((item) => {
        // Check if any of the scopes are in priority list
        const priorityIndex = PRIORITY_CHAIN_IDS.findIndex((chainId) =>
          item.scopes.includes(chainId),
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

    // Sort by priority networks
    return sortByPriorityNetworks(items);
  }, [getAccountsSpreadByNetworkByGroupId, sortByPriorityNetworks, t]);

  const renderAddressItem = useCallback(
    (
      item: {
        scopes: CaipChainId[];
        account: InternalAccount;
      },
      index: number,
    ): React.JSX.Element => {
      const handleCopyClick = () => {
        handleCopy(item.account.address);
      };

      return (
        <MultichainAggregatedAddressListRow
          key={`${item.account.address}-${index}`}
          chainIds={item.scopes}
          address={item.account.address}
          copyActionParams={{
            message: t('multichainAccountAddressCopied'),
            callback: handleCopyClick,
          }}
        />
      );
    },
    [handleCopy, t],
  );

  const handleViewAllClick = useCallback(() => {
    history.push(
      `${MULTICHAIN_ACCOUNT_ADDRESS_LIST_PAGE_ROUTE}/${encodeURIComponent(groupId)}`,
    );
  }, [groupId, history]);

  const renderedRows = useMemo(() => {
    return filteredItems.map((item, index) => renderAddressItem(item, index));
  }, [filteredItems, renderAddressItem]);

  return (
    <Box
      flexDirection={BoxFlexDirection.Column}
      data-testid="multichain-address-rows-list"
    >
      <Box>{renderedRows}</Box>
      <Button variant={ButtonVariant.Secondary} onClick={handleViewAllClick}>
        <Box
          flexDirection={BoxFlexDirection.Row}
          alignItems={BoxAlignItems.Center}
          gap={4}
        >
          <Text variant={TextVariant.BodySm} fontWeight={FontWeight.Medium}>
            {t('multichainAddressViewAll')}
          </Text>
          <Icon name={IconName.Arrow2Right} size={IconSize.Sm} />
        </Box>
      </Button>
    </Box>
  );
};

export default MultichainHoveredAddressRowsList;
