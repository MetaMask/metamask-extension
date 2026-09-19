import React, { useMemo, useCallback, useId } from 'react';
import { useSelector } from 'react-redux';
import { type AccountGroupId } from '@metamask/account-api';
import { CaipChainId } from '@metamask/utils';
import { InternalAccount } from '@metamask/keyring-internal-api';
import {
  Box,
  BoxFlexDirection,
  BoxJustifyContent,
  Button,
  ButtonSize,
  ButtonVariant,
  FontWeight,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { useNavigate } from 'react-router-dom';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard';
import {
  getAllAccountGroups,
  getInternalAccountListSpreadByScopesByGroupId,
} from '../../../selectors/multichain-accounts/account-tree';
import { MULTICHAIN_ACCOUNT_ADDRESS_LIST_PAGE_ROUTE } from '../../../helpers/constants/routes';
import { selectBalanceForAllWallets } from '../../../selectors/assets';
import { useFormatters } from '../../../hooks/useFormatters';
import { getAccountGroupDisplayBalance } from '../../../helpers/utils/account-group-balance';
import { normalizeSafeAddress } from '../../../../shared/lib/multichain/address';
import { MultichainAggregatedAddressListRow } from './multichain-aggregated-list-row';
import { DefaultAddress } from './default-address';

// Priority networks that should appear first (using CAIP chain IDs)
const PRIORITY_CHAIN_IDS = new Map<CaipChainId, number>([
  ['eip155:1' as CaipChainId, 0], // Ethereum mainnet
  ['bip122:000000000019d6689c085ae165831e93' as CaipChainId, 1], // Bitcoin mainnet
  ['solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp' as CaipChainId, 2], // Solana mainnet
  ['tron:0x2b6653dc' as CaipChainId, 3], // Tron mainnet
]);

const MAX_NETWORK_AVATARS = 4;

// Caps the popover content. The address rows scroll once this is reached, so
// the "View all" button and the default address section always stay visible.
const POPOVER_CONTENT_MAX_HEIGHT = 300;

export type MultichainAddressRowsListProps = {
  /**
   * The account group ID.
   */
  groupId: AccountGroupId;
  /**
   * The child element that triggers the popover.
   */
  children: React.ReactNode;
  /**
   * Whether to show the account header and balance.
   */
  showAccountHeaderAndBalance?: boolean;
  /**
   * Optional callback triggered when the "View All" button is clicked,
   * before navigation occurs. Useful for analytics or tracing.
   */
  onViewAllClick?: () => void;
  /**
   * When false, the popover does not show the "View All" button.
   * Used e.g. on the account list page.
   */
  showViewAllButton?: boolean;
  /**
   * When false, the popover does not show the "Show default address" toggle section.
   * Used e.g. on the account list page.
   */
  showDefaultAddressSection?: boolean;
  /**
   * How the popover is triggered: 'hover' (default) or 'click'.
   * When 'click', the popover toggles on click and closes when clicking outside.
   */
  triggerMode?: 'hover' | 'click';
};

const Divider = () => (
  <div className="my-3 mx-4 shrink-0 border-t border-border-muted" />
);

const ViewAllButton = ({
  handleViewAllClick,
  showDefaultAddressStyles,
  text,
}: {
  handleViewAllClick: React.MouseEventHandler<HTMLButtonElement>;
  showDefaultAddressStyles: boolean;
  text: string;
}) =>
  showDefaultAddressStyles ? (
    <Button
      size={ButtonSize.Sm}
      variant={ButtonVariant.Secondary}
      onClick={handleViewAllClick}
      className="mt-2 ml-3 mr-3 shrink-0"
      data-testid="multichain-address-rows-view-all-button"
    >
      {text}
    </Button>
  ) : (
    <>
      <div className="my-1 -mx-1 shrink-0 border-t border-border-muted" />
      <Button
        size={ButtonSize.Sm}
        variant={ButtonVariant.Tertiary}
        onClick={handleViewAllClick}
        className="shrink-0"
        data-testid="multichain-address-rows-view-all-button"
      >
        {text}
      </Button>
    </>
  );

export const MultichainTriggeredAddressRowsList = ({
  children,
  groupId,
  showAccountHeaderAndBalance = true,
  onViewAllClick,
  showViewAllButton = true,
  showDefaultAddressSection = true,
  triggerMode = 'hover',
}: MultichainAddressRowsListProps) => {
  const t = useI18nContext();
  const popoverId = useId().replace(/:/gu, '');

  // useCopyToClipboard analysis: Copies one of your public addresses
  const [, handleCopy] = useCopyToClipboard({ clearDelayMs: null });
  const navigate = useNavigate();

  const allAccountGroups = useSelector(getAllAccountGroups);
  const allBalances = useSelector(selectBalanceForAllWallets);
  const { formatCurrencyWithMinThreshold } = useFormatters();

  const { balance, accountGroup } = useMemo(() => {
    const group = allAccountGroups.find((g) => g.id === groupId);
    // Undefined when this group has no known balance yet, so nothing is
    // rendered instead of a misleading "$0.00".
    const groupBalance = getAccountGroupDisplayBalance(
      allBalances?.wallets?.[group?.walletId]?.groups?.[groupId],
    );
    return {
      balance:
        groupBalance &&
        formatCurrencyWithMinThreshold(
          groupBalance.amount,
          groupBalance.currency,
        ),
      accountGroup: group,
    };
  }, [allBalances, groupId, allAccountGroups, formatCurrencyWithMinThreshold]);

  const getAccountsSpreadByNetworkByGroupId = useSelector((state) =>
    getInternalAccountListSpreadByScopesByGroupId(state, groupId),
  );

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (triggerMode !== 'click') {
        return;
      }
      e.stopPropagation();
    },
    [triggerMode],
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
    ): JSX.Element => {
      const handleCopyClick = () => {
        handleCopy(normalizeSafeAddress(item.account.address));
      };

      return (
        <MultichainAggregatedAddressListRow
          key={`${item.account.address}-${index}`}
          chainIds={item.scopes.slice(0, MAX_NETWORK_AVATARS)}
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

  const handleViewAllClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      onViewAllClick?.();
      navigate(
        `${MULTICHAIN_ACCOUNT_ADDRESS_LIST_PAGE_ROUTE}?accountGroupId=${encodeURIComponent(groupId)}`,
      );
    },
    [groupId, navigate, onViewAllClick],
  );

  const renderedRows = useMemo(() => {
    const rows = sortByPriorityNetworks(getAccountsSpreadByNetworkByGroupId);
    return rows.map((item, index) => renderAddressItem(item, index));
  }, [
    getAccountsSpreadByNetworkByGroupId,
    renderAddressItem,
    sortByPriorityNetworks,
  ]);

  return (
    <>
      <button
        type="button"
        className="border-0 bg-transparent p-0 text-inherit"
        {...(triggerMode === 'click' && {
          commandfor: popoverId,
          command: 'toggle-popover',
        })}
        {...(triggerMode === 'hover' && {
          interestfor: popoverId,
        })}
        onClick={handleClick}
      >
        {children}
      </button>
      <div
        id={popoverId}
        popover="auto"
        className="rounded-lg border border-border-muted bg-background-elevated2 p-2 inset-auto"
        style={{
          width: '360px',
          margin: '2px 0 0',
          top: 'anchor(bottom)',
          left: 'anchor(left)',
        }}
      >
        <Box
          flexDirection={BoxFlexDirection.Column}
          style={{ maxHeight: `${POPOVER_CONTENT_MAX_HEIGHT}px` }}
          data-testid="multichain-address-rows-list"
        >
          {showAccountHeaderAndBalance && (
            <Box
              marginBottom={2}
              flexDirection={BoxFlexDirection.Row}
              justifyContent={BoxJustifyContent.Between}
              className="shrink-0"
            >
              <Text variant={TextVariant.BodySm} fontWeight={FontWeight.Medium}>
                {accountGroup?.metadata.name}
              </Text>
              <Text
                variant={TextVariant.BodySm}
                fontWeight={FontWeight.Medium}
                color={TextColor.TextAlternative}
              >
                {balance}
              </Text>
            </Box>
          )}
          {/* Only the address rows scroll, so the footer below them keeps its
              spacing instead of being cut off by the max height. */}
          <Box className="overflow-y-auto">{renderedRows}</Box>
          {showViewAllButton && (
            <ViewAllButton
              handleViewAllClick={handleViewAllClick}
              text={t('multichainAddressViewAll')}
              showDefaultAddressStyles={showDefaultAddressSection}
            />
          )}
          {showDefaultAddressSection && (
            <>
              <Divider />
              <DefaultAddress />
            </>
          )}
        </Box>
      </div>
    </>
  );
};

export default MultichainTriggeredAddressRowsList;
