import React, {
  useMemo,
  useCallback,
  useRef,
  useState,
  useEffect,
} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { type AccountGroupId } from '@metamask/account-api';
import { CaipChainId } from '@metamask/utils';
import { InternalAccount } from '@metamask/keyring-internal-api';
import {
  Box,
  BoxAlignItems,
  BoxBackgroundColor,
  BoxFlexDirection,
  BoxJustifyContent,
  Button,
  ButtonSize,
  ButtonVariant,
  FontWeight,
  Icon,
  IconName,
  IconSize,
  IconColor,
  Text,
  TextButton,
  TextButtonSize,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { useNavigate } from 'react-router-dom';
import { BackgroundColor } from '../../../helpers/constants/design-system';
import { shortenAddress } from '../../../helpers/utils/util';
import { Popover, PopoverPosition } from '../../component-library';
import ToggleButton from '../../ui/toggle-button';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard';
import {
  getAllAccountGroups,
  getDefaultScopeAddressByAccountGroupId,
  getInternalAccountListSpreadByScopesByGroupId,
} from '../../../selectors/multichain-accounts/account-tree';
import {
  GENERAL_ROUTE,
  MULTICHAIN_ACCOUNT_ADDRESS_LIST_PAGE_ROUTE,
} from '../../../helpers/constants/routes';
import { DEFAULT_ADDRESS_DISPLAY_KEY_BY_SCOPE } from '../../../../shared/constants/default-address';
import {
  getDefaultAddressScope,
  getShowDefaultAddress,
} from '../../../selectors';
import { setShowDefaultAddress } from '../../../store/actions';
import { selectBalanceForAllWallets } from '../../../selectors/assets';
import { useFormatters } from '../../../hooks/useFormatters';
// eslint-disable-next-line import/no-restricted-paths
import { normalizeSafeAddress } from '../../../../app/scripts/lib/multichain/address';
import { MultichainAccountNetworkGroup } from '../multichain-account-network-group';
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
   * When true, the trigger is an unstyled wrapper (ref + hover only).
   * Use when the trigger is e.g. the account avatar and should look unchanged.
   */
  minimalTrigger?: boolean;
  /**
   * When true, use children as the trigger
   * Use on the account list so the avatar is the only trigger.
   */
  useChildrenAsTrigger?: boolean;
};

export const MultichainHoveredAddressRowsList = ({
  groupId,
  children,
  showAccountHeaderAndBalance = true,
  hoverCloseDelay = 50,
  onViewAllClick,
  showViewAllButton = true,
  showDefaultAddressSection = true,
  minimalTrigger = false,
  useChildrenAsTrigger = false,
}: MultichainAddressRowsListProps) => {
  const t = useI18nContext();
  const dispatch = useDispatch();

  // useCopyToClipboard analysis: Copies one of your public addresses
  const [, handleCopy] = useCopyToClipboard({ clearDelayMs: null });
  const navigate = useNavigate();
  const showDefaultAddress = useSelector(getShowDefaultAddress);
  const defaultAddressScope = useSelector(getDefaultAddressScope);
  const defaultScopeDisplayLabel = t(
    DEFAULT_ADDRESS_DISPLAY_KEY_BY_SCOPE[defaultAddressScope],
  );
  const [isHoverOpen, setIsHoverOpen] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [defaultAddressCopied, setDefaultAddressCopied] = useState(false);
  const defaultAddressCopiedTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [referenceElement, setReferenceElement] = useState<HTMLElement | null>(
    null,
  );
  const [dynamicPosition, setDynamicPosition] = useState<PopoverPosition>(
    PopoverPosition.BottomStart,
  );

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

  const { defaultAddress, defaultScopes } = useSelector((state) =>
    getDefaultScopeAddressByAccountGroupId(state, groupId),
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

  const sortedAccountsByNetworkByGroupId = useMemo(
    () => sortByPriorityNetworks(getAccountsSpreadByNetworkByGroupId),
    [getAccountsSpreadByNetworkByGroupId, sortByPriorityNetworks],
  );

  const handleDefaultAddressClick = useCallback(() => {
    if (!defaultAddress) {
      return;
    }
    if (defaultAddressCopiedTimeoutRef.current) {
      clearTimeout(defaultAddressCopiedTimeoutRef.current);
    }
    handleCopy(normalizeSafeAddress(defaultAddress));
    setDefaultAddressCopied(true);
    defaultAddressCopiedTimeoutRef.current = setTimeout(() => {
      setDefaultAddressCopied(false);
      defaultAddressCopiedTimeoutRef.current = null;
    }, 2000);
  }, [defaultAddress, handleCopy]);

  useEffect(() => {
    return () => {
      if (defaultAddressCopiedTimeoutRef.current) {
        clearTimeout(defaultAddressCopiedTimeoutRef.current);
      }
    };
  }, []);

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

  const renderedRows = useMemo(
    () =>
      sortedAccountsByNetworkByGroupId.map((item, index) =>
        renderAddressItem(item, index),
      ),
    [sortedAccountsByNetworkByGroupId, renderAddressItem],
  );

  const triggerContent =
    !useChildrenAsTrigger && showDefaultAddress && defaultAddress ? (
      <Box
        ref={setReferenceElement}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleDefaultAddressClick}
        flexDirection={BoxFlexDirection.Row}
        alignItems={BoxAlignItems.Center}
        backgroundColor={
          defaultAddressCopied
            ? BoxBackgroundColor.SuccessMuted
            : BoxBackgroundColor.BackgroundMuted
        }
        padding={1}
        gap={1}
        className="cursor-pointer rounded-lg"
        data-testid="default-address-trigger"
      >
        <MultichainAccountNetworkGroup
          groupId={groupId}
          chainIds={defaultScopes.slice(0, MAX_NETWORK_AVATARS)}
          limit={MAX_NETWORK_AVATARS}
        />
        <Text
          variant={TextVariant.BodyXs}
          color={
            defaultAddressCopied
              ? TextColor.SuccessDefault
              : TextColor.TextAlternative
          }
          style={{ lineHeight: 0 }} // Required to override default line height styles
        >
          {defaultAddressCopied
            ? t('addressCopied')
            : shortenAddress(normalizeSafeAddress(defaultAddress))}
        </Text>
        <Icon
          name={defaultAddressCopied ? IconName.CopySuccess : IconName.Copy}
          size={IconSize.Sm}
          color={
            defaultAddressCopied
              ? IconColor.SuccessDefault
              : IconColor.IconAlternative
          }
          aria-label={t('copyAddressShort')}
        />
      </Box>
    ) : minimalTrigger ? (
      <Box
        ref={setReferenceElement}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {children}
      </Box>
    ) : (
      <Box
        ref={setReferenceElement}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        flexDirection={BoxFlexDirection.Row}
        alignItems={BoxAlignItems.Center}
        backgroundColor={BoxBackgroundColor.BackgroundMuted}
        padding={1}
        gap={1}
        className="rounded-lg"
      >
        {children}
      </Box>
    );

  return (
    <>
      {triggerContent}
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
        paddingInline={1}
        paddingBottom={1}
        paddingTop={1}
        style={{
          zIndex: 99999,
          maxHeight: '400px',
          minWidth: '340px',
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
              <Text variant={TextVariant.BodySm} fontWeight={FontWeight.Medium}>
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
          <Box>{renderedRows}</Box>
          {showViewAllButton && (
            <Button
              size={ButtonSize.Sm}
              variant={ButtonVariant.Secondary}
              onClick={handleViewAllClick}
              className="mt-2 ml-3 mr-3"
              data-testid="multichain-address-rows-view-all-button"
            >
              {t('multichainAddressViewAll')}
            </Button>
          )}
          {showDefaultAddressSection && (
            <>
              <Box
                marginHorizontal={4}
                marginVertical={3}
                className="border-t border-border-muted"
              />
              <Box paddingLeft={4} paddingBottom={2}>
                <Box
                  flexDirection={BoxFlexDirection.Row}
                  justifyContent={BoxJustifyContent.Between}
                  alignItems={BoxAlignItems.Center}
                >
                  <Box flexDirection={BoxFlexDirection.Column}>
                    <Text
                      variant={TextVariant.BodySm}
                      fontWeight={FontWeight.Medium}
                      color={TextColor.TextDefault}
                    >
                      {t('showDefaultAddress')}
                    </Text>
                    <Box flexDirection={BoxFlexDirection.Row} gap={2}>
                      <Text
                        variant={TextVariant.BodyXs}
                        color={TextColor.TextAlternative}
                      >
                        {t('default')}: {defaultScopeDisplayLabel}
                      </Text>
                      <TextButton
                        size={TextButtonSize.BodyXs}
                        onClick={(e: React.MouseEvent) => {
                          e.stopPropagation();
                          navigate(`${GENERAL_ROUTE}#show-default-address`);
                        }}
                        data-testid="change-in-settings-link"
                      >
                        {t('changeInSettings')}
                      </TextButton>
                    </Box>
                  </Box>
                  <ToggleButton
                    value={showDefaultAddress}
                    onToggle={(value: boolean) =>
                      dispatch(setShowDefaultAddress(!value))
                    }
                    dataTestId="show-default-address-toggle"
                  />
                </Box>
              </Box>
            </>
          )}
        </Box>
      </Popover>
    </>
  );
};

export default MultichainHoveredAddressRowsList;
