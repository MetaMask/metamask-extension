import React, { useMemo, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { type AccountGroupId } from '@metamask/account-api';
import { CaipChainId } from '@metamask/utils';
import { InternalAccount } from '@metamask/keyring-internal-api';
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
import { useHistory } from 'react-router-dom';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard';
import { getInternalAccountListSpreadByScopesByGroupId } from '../../../selectors/multichain-accounts/account-tree';
import { MULTICHAIN_ACCOUNT_ADDRESS_LIST_PAGE_ROUTE } from '../../../helpers/constants/routes';
import { MultichainAggregatedAddressListRow } from './multichain-aggregated-list-row';

// Priority networks that should appear first (using CAIP chain IDs)
const PRIORITY_CHAIN_IDS = new Map<CaipChainId, number>([
  ['eip155:1' as CaipChainId, 0], // Ethereum mainnet
  ['bip122:000000000019d6689c085ae165831e93' as CaipChainId, 1], // Bitcoin mainnet
  ['solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp' as CaipChainId, 2], // Solana mainnet
  ['tron:0x2b6653dc' as CaipChainId, 3], // Tron mainnet
]);

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

      // Create items: one for grouped eip155 scopes (if any) and one for each other scope
      const groupedItems: {
        scopes: CaipChainId[];
        account: InternalAccount;
      }[] = [];

      // Transform grouped data and separate eip155 scopes
      Object.values(accountGroups).forEach(({ account, scopes }) => {
        // Separate eip155 scopes from others
        const eip155Scopes = scopes.filter((scope) =>
          scope.startsWith('eip155:'),
        );
        const otherScopes = scopes.filter(
          (scope) => !scope.startsWith('eip155:'),
        );

        if (eip155Scopes.length > 0) {
          groupedItems.push({
            scopes: eip155Scopes,
            account,
          });
        }

        otherScopes.forEach((scope) => {
          groupedItems.push({
            scopes: [scope],
            account,
          });
        });
      });

      const priorityItems: {
        scopes: CaipChainId[];
        account: InternalAccount;
      }[] = [];
      const otherItems: typeof priorityItems = [];

      groupedItems.forEach((item) => {
        // Check if any of the scopes are in priority list
        let priorityIndex = -1;

        // Check each scope for priority chain membership
        for (const scope of item.scopes) {
          const index = PRIORITY_CHAIN_IDS.get(scope);
          if (index !== undefined) {
            priorityIndex = index;
            break;
          }
        }

        if (priorityIndex > -1) {
          // Store with priority index for proper ordering
          if (priorityItems[priorityIndex] === undefined) {
            priorityItems[priorityIndex] = item;
          } else {
            // If slot is already taken, add to other items
            otherItems.push(item);
          }
        } else {
          otherItems.push(item);
        }
      });
      // Filter out undefined entries and maintain priority order
      return [...priorityItems.filter(Boolean), ...otherItems];
    },
    [],
  );

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
    const rows = sortByPriorityNetworks(getAccountsSpreadByNetworkByGroupId);
    return rows.map((item, index) => renderAddressItem(item, index));
  }, [
    getAccountsSpreadByNetworkByGroupId,
    renderAddressItem,
    sortByPriorityNetworks,
  ]);

  return (
    <Box
      flexDirection={BoxFlexDirection.Column}
      data-testid="multichain-address-rows-list"
    >
      <Box marginBottom={2}>{renderedRows}</Box>
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
