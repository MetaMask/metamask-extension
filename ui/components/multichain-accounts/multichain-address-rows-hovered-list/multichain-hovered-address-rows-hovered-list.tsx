import React, {
  useMemo,
  useCallback,
  useRef,
  useState,
  useEffect,
} from 'react';
import { useSelector } from 'react-redux';
import { type AccountGroupId } from '@metamask/account-api';
import { CaipChainId } from '@metamask/utils';
import { InternalAccount } from '@metamask/keyring-internal-api';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  BoxJustifyContent,
  Button,
  ButtonVariant,
  FontWeight,
  Icon,
  IconName,
  IconSize,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { useNavigate } from 'react-router-dom-v5-compat';
import { BackgroundColor } from '../../../helpers/constants/design-system';
import { Popover, PopoverPosition } from '../../component-library';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard';
import {
  getAllAccountGroups,
  getInternalAccountListSpreadByScopesByGroupId,
} from '../../../selectors/multichain-accounts/account-tree';
import { MULTICHAIN_ACCOUNT_ADDRESS_LIST_PAGE_ROUTE } from '../../../helpers/constants/routes';
import { selectBalanceForAllWallets } from '../../../selectors/assets';
import { useFormatters } from '../../../hooks/useFormatters';
// eslint-disable-next-line import/no-restricted-paths
import { normalizeSafeAddress } from '../../../../app/scripts/lib/multichain/address';
import { MultichainAggregatedAddressListRow } from './multichain-aggregated-list-row';

// Priority networks that should appear first (using CAIP chain IDs)
const PRIORITY_CHAIN_IDS = new Map<CaipChainId, number>([
  ['eip155:1' as CaipChainId, 0], // Ethereum mainnet
  ['bip122:000000000019d6689c085ae165831e93' as CaipChainId, 1], // Bitcoin mainnet
  ['solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp' as CaipChainId, 2], // Solana mainnet
  ['tron:0x2b6653dc' as CaipChainId, 3], // Tron mainnet
]);

const MAX_NETWORK_AVATARS = 4;

export type MultichainAddressRowsListProps = {
  /**
   * The account group ID.
   */
  groupId: AccountGroupId;
  /**
   * The child element that triggers the popover on hover.
   */
  children: React.ReactNode;
  /**
   * Whether to show the account header and balance.
   */
  showAccountHeaderAndBalance?: boolean;
  /**
   * The delay of the hover.
   */
  hoverCloseDelay?: number;
  /**
   * Optional callback triggered when the "View All" button is clicked,
   * before navigation occurs. Useful for analytics or tracing.
   */
  onViewAllClick?: () => void;
};

export const MultichainHoveredAddressRowsList = ({
  groupId,
  children,
  showAccountHeaderAndBalance = true,
  hoverCloseDelay = 50,
  onViewAllClick,
}: MultichainAddressRowsListProps) => {
  const t = useI18nContext();
  const [, handleCopy] = useCopyToClipboard();
  const navigate = useNavigate();
  const [isHoverOpen, setIsHoverOpen] = useState(false);
  const [referenceElement, setReferenceElement] = useState<HTMLElement | null>(
    null,
  );
  const [dynamicPosition, setDynamicPosition] = useState<PopoverPosition>(
    PopoverPosition.BottomStart,
  );
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const allAccountGroups = useSelector(getAllAccountGroups);

  const allBalances = useSelector(selectBalanceForAllWallets);
  const { balance, currency, accountGroup } = useMemo(() => {
    const group = allAccountGroups.find((g) => g.id === groupId);
    const account = allBalances?.wallets?.[group?.walletId]?.groups?.[groupId];
    const bal = account?.totalBalanceInUserCurrency ?? 0;
    const curr = account?.userCurrency ?? '';
    return { balance: bal, currency: curr, accountGroup: group };
  }, [allBalances, groupId, allAccountGroups]);

  const { formatCurrencyWithMinThreshold } = useFormatters();

  const getAccountsSpreadByNetworkByGroupId = useSelector((state) =>
    getInternalAccountListSpreadByScopesByGroupId(state, groupId),
  );

  // Calculate whether popover should show above or below
  const calculatePopoverPosition = useCallback(() => {
    if (!referenceElement) {
      return PopoverPosition.BottomStart;
    }

    const rect = referenceElement.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const popoverEstimatedHeight = 400; // Based on the maxHeight set on the popover
    const spaceBelow = viewportHeight - rect.bottom;

    // If there's not enough space below, use TopStart
    if (spaceBelow < popoverEstimatedHeight) {
      return PopoverPosition.TopStart;
    }

    // Default to BottomStart
    return PopoverPosition.BottomStart;
  }, [referenceElement]);

  const handleMouseEnter = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setDynamicPosition(calculatePopoverPosition());
    setIsHoverOpen(true);
  }, [calculatePopoverPosition]);

  const handleMouseLeave = useCallback(() => {
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHoverOpen(false);
    }, hoverCloseDelay);
  }, [hoverCloseDelay]);

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

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
        `${MULTICHAIN_ACCOUNT_ADDRESS_LIST_PAGE_ROUTE}/${encodeURIComponent(groupId)}`,
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
      <Box
        ref={setReferenceElement}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {children}
      </Box>
      <Popover
        referenceElement={referenceElement}
        isOpen={isHoverOpen}
        position={dynamicPosition}
        hasArrow={true}
        backgroundColor={BackgroundColor.backgroundDefault}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        preventOverflow
        isPortal={true}
        offset={[0, 3]}
        style={{
          zIndex: 99999,
          maxHeight: '400px',
          minWidth: '320px',
        }}
      >
        <Box
          flexDirection={BoxFlexDirection.Column}
          data-testid="multichain-address-rows-list"
        >
          {showAccountHeaderAndBalance && (
            <Box
              marginBottom={2}
              flexDirection={BoxFlexDirection.Row}
              justifyContent={BoxJustifyContent.Between}
            >
              <Text variant={TextVariant.BodyMd} fontWeight={FontWeight.Bold}>
                {accountGroup?.metadata.name}
              </Text>
              <Text
                variant={TextVariant.BodySm}
                fontWeight={FontWeight.Medium}
                color={TextColor.TextAlternative}
              >
                {formatCurrencyWithMinThreshold(balance, currency)}
              </Text>
            </Box>
          )}
          <Box marginBottom={2}>{renderedRows}</Box>
          <Button
            variant={ButtonVariant.Secondary}
            onClick={handleViewAllClick}
          >
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
      </Popover>
    </>
  );
};

export default MultichainHoveredAddressRowsList;
