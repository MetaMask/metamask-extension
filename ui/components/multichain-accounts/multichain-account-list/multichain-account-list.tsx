import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from 'react';
import { flushSync } from 'react-dom';

import {
  AccountGroupId,
  AccountWalletId,
  AccountWalletType,
} from '@metamask/account-api';
import type { AccountWalletObject } from '@metamask/account-tree-controller';
import { KeyringTypes } from '@metamask/keyring-controller';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { parseCaipAccountId } from '@metamask/utils';
import {
  Box,
  BoxBackgroundColor,
  Checkbox,
  FontWeight,
  Icon,
  IconColor,
  IconName,
  IconSize,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { MultichainAccountCell } from '../multichain-account-cell';
import {
  AccountTreeWallets,
  MultichainAccountsState,
} from '../../../selectors/multichain-accounts/account-tree.types';
import {
  removeAccount,
  setAccountGroupHidden,
  setSelectedMultichainAccount,
} from '../../../store/actions';
import { DEFAULT_ROUTE } from '../../../helpers/constants/routes';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { useAnalytics } from '../../../hooks/useAnalytics';
import { endTrace, trace, TraceName } from '../../../../shared/lib/trace';
import {
  ACCOUNT_OVERVIEW_TAB_KEY_TO_TRACE_NAME_MAP,
  AccountOverviewTabKey,
} from '../../../../shared/constants/app-state';
import {
  getAllPermittedAccountsForCurrentTab,
  getDefaultHomeActiveTabName,
  getHDEntropyIndex,
} from '../../../selectors';
import { getInternalAccountsObject } from '../../../selectors/accounts';
import { getPreferences } from '../../../../shared/lib/selectors/preferences';
import { MultichainAccountMenu } from '../multichain-account-menu';
import { AddMultichainAccount } from '../add-multichain-account';
import { MultichainAccountEditModal } from '../multichain-account-edit-modal';
import { AccountDeleteConfirmModal } from '../account-delete-confirm-modal';
import { getAccountGroupsByAddress } from '../../../selectors/multichain-accounts/account-tree';
import {
  STATUS_CONNECTED,
  STATUS_CONNECTED_TO_ANOTHER_ACCOUNT,
} from '../../../helpers/constants/connected-sites';
import { selectBalanceForAllWallets } from '../../../selectors/assets';
import { EMPTY_ARRAY } from '../../../selectors/shared';
import { useFormatters } from '../../../hooks/useFormatters';
import { getAccountGroupDisplayBalance } from '../../../helpers/utils/account-group-balance';
import { VirtualizedList } from '../../ui/virtualized-list/virtualized-list';
import { useDispatch } from '../../../store/hooks';

export type MultichainAccountListProps = {
  wallets: AccountTreeWallets;
  selectedAccountGroups: AccountGroupId[];
  handleAccountClick?: (accountGroupId: AccountGroupId) => void;
  isInSearchMode?: boolean;
  displayWalletHeader?: boolean;
  showAccountCheckbox?: boolean;
  showConnectionStatus?: boolean;
  showDefaultAddress?: boolean;
  /**
   * When true, account cells render in edit mode. Private-key wallet accounts
   * show delete controls; all other wallets show visibility controls. Menus are
   * suppressed and hidden accounts move inline under their own wallet instead
   * of the separate hidden section.
   * @default false
   */
  isEditMode?: boolean;
};

type GroupData = AccountTreeWallets[AccountWalletId]['groups'][AccountGroupId];

/**
 * Imported private-key wallets are the only wallets whose accounts can be
 * deleted from the account list edit mode.
 *
 * @param wallet - Wallet object from the account tree.
 * @returns True when the wallet is a simple (imported private key) keyring.
 */
function isPrivateKeyWallet(wallet: AccountWalletObject): boolean {
  return (
    wallet.type === AccountWalletType.Keyring &&
    wallet.metadata.keyring.type === KeyringTypes.simple
  );
}

const ACCOUNT_LIST_FLIP_DURATION_MS = 280;
const ACCOUNT_LIST_FLIP_EASING = 'cubic-bezier(0.4, 0, 0.2, 1)';

/**
 * FLIP-animates account rows after a synchronous list reorder.
 *
 * Uses the CSS `translate` property so it composes with VirtualizedList's
 * `transform: translateY(...)` positioning instead of overwriting it.
 *
 * @param update - Synchronous state update that reorders the list.
 */
function animateAccountListReorder(update: () => void): void {
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  if (process.env.IN_TEST || prefersReducedMotion) {
    update();
    return;
  }

  const firstTops = new Map<string, number>();
  document
    .querySelectorAll<HTMLElement>('[data-account-list-flip-id]')
    .forEach((node) => {
      const id = node.dataset.accountListFlipId;
      if (id) {
        firstTops.set(id, node.getBoundingClientRect().top);
      }
    });

  flushSync(update);

  document
    .querySelectorAll<HTMLElement>('[data-account-list-flip-id]')
    .forEach((node) => {
      const id = node.dataset.accountListFlipId;
      const firstTop = id === undefined ? undefined : firstTops.get(id);
      if (firstTop === undefined) {
        return;
      }

      const deltaY = firstTop - node.getBoundingClientRect().top;
      if (Math.abs(deltaY) < 1) {
        return;
      }

      node.style.transition = 'none';
      node.style.translate = `0 ${deltaY}px`;
      // Reading layout forces the inverted position to be committed before the
      // transition is switched back on, so the browser plays it.
      node.getBoundingClientRect();
      node.style.transition = `translate ${ACCOUNT_LIST_FLIP_DURATION_MS}ms ${ACCOUNT_LIST_FLIP_EASING}`;
      node.style.translate = '0 0';

      const cleanup = (event: TransitionEvent) => {
        if (event.propertyName !== 'translate') {
          return;
        }
        node.style.transition = '';
        node.style.translate = '';
        node.removeEventListener('transitionend', cleanup);
      };
      node.addEventListener('transitionend', cleanup);
    });
}

/**
 * Finds an account group across every wallet in the tree.
 *
 * @param wallets - Account tree wallets.
 * @param groupId - Account group id to look up.
 * @returns The matching group, or undefined when it is no longer in the tree.
 */
function findAccountGroup(
  wallets: AccountTreeWallets,
  groupId: string,
): GroupData | undefined {
  for (const wallet of Object.values(wallets)) {
    const group = wallet.groups?.[groupId as AccountGroupId];
    if (group) {
      return group;
    }
  }
  return undefined;
}

/**
 * Drops optimistic overrides that account tree metadata has caught up with, so
 * only in-flight hide/reveal toggles keep overriding the store.
 *
 * @param overrides - Pending optimistic visibility map.
 * @param wallets - Account tree wallets.
 * @returns The same map when nothing settled, otherwise a pruned copy.
 */
function pruneSettledOverrides(
  overrides: Record<string, boolean>,
  wallets: AccountTreeWallets,
): Record<string, boolean> {
  const pending = Object.entries(overrides).filter(([groupId, hidden]) => {
    const group = findAccountGroup(wallets, groupId);
    return group ? (group.metadata.hidden ?? false) !== hidden : true;
  });

  return pending.length === Object.keys(overrides).length
    ? overrides
    : Object.fromEntries(pending);
}

/**
 * Resolves whether a group is currently treated as hidden, preferring any
 * optimistic override applied while a hide/reveal is still in flight.
 *
 * @param groupId - Account group id.
 * @param metadataHidden - Hidden flag from account tree metadata.
 * @param visibilityOverrides - Pending optimistic visibility map.
 * @returns Effective hidden state for list ordering and cell styling.
 */
function getEffectiveIsHidden(
  groupId: string,
  metadataHidden: boolean | undefined,
  visibilityOverrides: Record<string, boolean>,
): boolean {
  if (Object.prototype.hasOwnProperty.call(visibilityOverrides, groupId)) {
    return visibilityOverrides[groupId];
  }
  return metadataHidden ?? false;
}

type ListItem =
  | {
      type: 'header';
      key: string;
      text: string;
      testId?: string;
      sectionKey?: string;
      isCollapsible?: boolean;
      isExpanded?: boolean;
    }
  | {
      type: 'account';
      key: string;
      groupId: string;
      groupData: GroupData;
      walletId: string;
      showWalletName: boolean;
    }
  | { type: 'hidden-header'; key: string; count: number }
  | { type: 'add-account'; key: string; walletId: string };

export const MultichainAccountList = ({
  wallets,
  selectedAccountGroups,
  handleAccountClick,
  isInSearchMode = false,
  displayWalletHeader = true,
  showAccountCheckbox = false,
  showConnectionStatus = false,
  showDefaultAddress = false,
  isEditMode = false,
}: MultichainAccountListProps) => {
  const showAccountMenu = !showAccountCheckbox && !isEditMode;

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [isPending, startTransition] = useTransition();
  const { trackEvent, createEventBuilder } = useAnalytics();
  const t = useI18nContext();
  const defaultHomeActiveTabName: AccountOverviewTabKey = useSelector(
    getDefaultHomeActiveTabName,
  );
  const { formatCurrencyWithMinThreshold } = useFormatters();
  const allBalances = useSelector(selectBalanceForAllWallets);
  const hdEntropyIndex = useSelector(getHDEntropyIndex);
  const { privacyMode } = useSelector(getPreferences);
  const internalAccountsById = useSelector(getInternalAccountsObject);

  useEffect(() => {
    endTrace({ name: TraceName.AccountList });
  }, []);

  const [isAccountRenameModalOpen, setIsAccountRenameModalOpen] =
    useState(false);

  const [renameAccountGroupId, setRenameAccountGroupId] = useState<
    string | undefined
  >(undefined);

  const [accountToDelete, setAccountToDelete] = useState<{
    groupId: AccountGroupId;
    accountName: string;
    address?: string;
    walletType?: AccountWalletType;
  } | null>(null);

  // Optimistic visibility so a hide/reveal can animate before Redux catches up.
  const [visibilityOverrides, setVisibilityOverrides] = useState<
    Record<string, boolean>
  >({});

  const [openMenuAccountId, setOpenMenuAccountId] =
    useState<AccountGroupId | null>(null);

  const permittedAccounts = useSelector(getAllPermittedAccountsForCurrentTab);
  const permittedAddresses = useMemo(
    () =>
      showConnectionStatus
        ? permittedAccounts.map(
            (caipAccountId) => parseCaipAccountId(caipAccountId).address,
          )
        : [],
    [permittedAccounts, showConnectionStatus],
  );

  // Memoize selector to avoid recreating it on every render
  const selectConnectedAccountGroups = useCallback(
    (state: MultichainAccountsState) => {
      if (!showConnectionStatus || permittedAddresses.length === 0) {
        return EMPTY_ARRAY;
      }
      return getAccountGroupsByAddress(state, permittedAddresses);
    },
    [showConnectionStatus, permittedAddresses],
  );

  const connectedAccountGroups = useSelector(selectConnectedAccountGroups);
  const [isHiddenAccountsExpanded, setIsHiddenAccountsExpanded] =
    useState(false);

  const [collapsedSectionKeys, setCollapsedSectionKeys] = useState<Set<string>>(
    () => new Set(),
  );

  const toggleSectionExpanded = useCallback((sectionKey: string) => {
    setCollapsedSectionKeys((prev) => {
      const next = new Set(prev);
      if (next.has(sectionKey)) {
        next.delete(sectionKey);
      } else {
        next.add(sectionKey);
      }
      return next;
    });
  }, []);

  const handleAccountRenameActionModalClose = useCallback(() => {
    setIsAccountRenameModalOpen(false);
    setRenameAccountGroupId(undefined);
  }, [setIsAccountRenameModalOpen, setRenameAccountGroupId]);

  const handleAccountRenameAction = useCallback(
    (accountGroupId: string) => {
      setRenameAccountGroupId(accountGroupId);
      setIsAccountRenameModalOpen(true);
      setOpenMenuAccountId(null);
    },
    [setIsAccountRenameModalOpen, setRenameAccountGroupId],
  );

  const handleAccountDeleteConfirmModalClose = useCallback(() => {
    setAccountToDelete(null);
  }, []);

  const handleAccountDeleteConfirm = useCallback(() => {
    const address = accountToDelete?.address;
    if (address) {
      dispatch(removeAccount(address));
      trackEvent(
        createEventBuilder(MetaMetricsEventName.AccountRemoved)
          .addCategory(MetaMetricsEventCategory.Accounts)
          .addProperties({
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
            // eslint-disable-next-line @typescript-eslint/naming-convention
            account_type: accountToDelete?.walletType,
          })
          .build(),
      );
    }
    setAccountToDelete(null);
  }, [accountToDelete, createEventBuilder, dispatch, trackEvent]);

  const handleVisibilityToggle = useCallback(
    (accountGroupId: AccountGroupId, currentlyHidden: boolean) => {
      const nextHidden = !currentlyHidden;

      animateAccountListReorder(() => {
        setVisibilityOverrides((previous) => ({
          // Settled overrides are dropped here so the map only ever holds
          // toggles the store has not confirmed yet.
          ...pruneSettledOverrides(previous, wallets),
          [accountGroupId]: nextHidden,
        }));
      });

      dispatch(setAccountGroupHidden(accountGroupId, nextHidden));
    },
    [dispatch, wallets],
  );

  // An override only applies while the store disagrees with it, so this is
  // derived from the tree on every render rather than pruned in an effect.
  const pendingVisibilityOverrides = useMemo(
    () => pruneSettledOverrides(visibilityOverrides, wallets),
    [visibilityOverrides, wallets],
  );

  const handleMenuToggle = useCallback((accountGroupId: AccountGroupId) => {
    // If the same menu is clicked, close it, otherwise open the new one
    setOpenMenuAccountId((current) =>
      current === accountGroupId ? null : accountGroupId,
    );
  }, []);

  // Convert selectedAccountGroups array to Set for O(1) lookup
  const selectedAccountGroupsSet = useMemo(
    () => new Set(selectedAccountGroups),
    [selectedAccountGroups],
  );

  const { pinnedGroups, hiddenGroups } = useMemo(() => {
    const pinned: {
      groupId: string;
      groupData: (typeof wallets)[AccountWalletId]['groups'][AccountGroupId];
      walletId: string;
    }[] = [];
    const hidden: {
      groupId: string;
      groupData: (typeof wallets)[AccountWalletId]['groups'][AccountGroupId];
      walletId: string;
    }[] = [];

    // Collect all groups to categorize them
    Object.entries(wallets).forEach(([walletId, walletData]) => {
      Object.entries(walletData.groups || {}).forEach(
        ([groupId, groupData]) => {
          if (groupData.metadata.pinned) {
            pinned.push({ groupId, groupData, walletId });
          } else if (
            getEffectiveIsHidden(
              groupId,
              groupData.metadata.hidden,
              pendingVisibilityOverrides,
            )
          ) {
            hidden.push({ groupId, groupData, walletId });
          }
        },
      );
    });

    return { pinnedGroups: pinned, hiddenGroups: hidden };
  }, [wallets, pendingVisibilityOverrides]);

  const defaultHandleAccountClick = useCallback(
    (accountGroupId: AccountGroupId) => {
      trackEvent(
        createEventBuilder(MetaMetricsEventName.NavAccountSwitched)
          .addCategory(MetaMetricsEventCategory.Navigation)
          .addProperties({
            location: 'Main Menu',
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
            // eslint-disable-next-line @typescript-eslint/naming-convention
            hd_entropy_index: hdEntropyIndex,
          })
          .build(),
      );
      endTrace({
        name: ACCOUNT_OVERVIEW_TAB_KEY_TO_TRACE_NAME_MAP[
          defaultHomeActiveTabName
        ],
      });
      trace({
        name: ACCOUNT_OVERVIEW_TAB_KEY_TO_TRACE_NAME_MAP[
          defaultHomeActiveTabName
        ],
      });

      // Defer expensive Home/Routes re-renders so the account list shell stays responsive.
      startTransition(() => {
        dispatch(setSelectedMultichainAccount(accountGroupId));
        navigate(DEFAULT_ROUTE);
      });
    },
    [
      trackEvent,
      createEventBuilder,
      hdEntropyIndex,
      defaultHomeActiveTabName,
      dispatch,
      navigate,
      startTransition,
    ],
  );

  const handleAccountClickToUse = useCallback(
    (accountGroupId: AccountGroupId) => {
      // Only gate the default switch path; custom handlers own their own pending UX.
      if (isPending && !handleAccountClick) {
        return;
      }
      const handlerToUse = handleAccountClick ?? defaultHandleAccountClick;
      handlerToUse?.(accountGroupId);
    },
    [handleAccountClick, defaultHandleAccountClick, isPending],
  );

  const isSwitchPending = isPending && !handleAccountClick;

  const renderAccountCell = useCallback(
    (
      groupId: string,
      groupData: GroupData,
      walletId: string,
      showWalletName: boolean,
    ) => {
      // Undefined when this group has no known balance yet, so the cell renders
      // nothing instead of a misleading "$0.00".
      const groupBalance = getAccountGroupDisplayBalance(
        allBalances?.wallets?.[walletId]?.groups?.[groupId],
      );
      const balance =
        groupBalance &&
        formatCurrencyWithMinThreshold(
          groupBalance.amount,
          groupBalance.currency,
        );

      // TODO: Implement logic for removable accounts
      const isRemovable = false;

      const wallet = wallets[walletId as AccountWalletId];
      // Only imported private-key accounts can be deleted, so they get delete
      // mode while every other wallet gets visible/hidden mode. The two modes
      // are mutually exclusive.
      const isDeleteMode =
        isEditMode && Boolean(wallet) && isPrivateKeyWallet(wallet);
      // Hidden styling is an edit-mode affordance; outside edit mode the hidden
      // section renders these cells with their normal appearance.
      const isHidden =
        isEditMode &&
        !isDeleteMode &&
        getEffectiveIsHidden(
          groupId,
          groupData.metadata.hidden,
          pendingVisibilityOverrides,
        );

      const isConnectedAccount = connectedAccountGroups.find(
        (accountGroup) => accountGroup.id === groupId,
      );

      let connectedStatus:
        | typeof STATUS_CONNECTED
        | typeof STATUS_CONNECTED_TO_ANOTHER_ACCOUNT
        | undefined;
      if (showConnectionStatus) {
        if (isConnectedAccount) {
          if (selectedAccountGroupsSet.has(groupId as AccountGroupId)) {
            connectedStatus = STATUS_CONNECTED;
          } else {
            connectedStatus = STATUS_CONNECTED_TO_ANOTHER_ACCOUNT;
          }
        }
      }

      return (
        <Box className="multichain-account-menu-popover__list--menu-item">
          <MultichainAccountCell
            accountId={groupId as AccountGroupId}
            accountName={groupData.metadata.name}
            accountNameString={groupData.metadata.name}
            balance={balance}
            selected={selectedAccountGroupsSet.has(groupId as AccountGroupId)}
            onClick={handleAccountClickToUse}
            pending={isSwitchPending}
            connectionStatus={
              connectedStatus as
                | typeof STATUS_CONNECTED
                | typeof STATUS_CONNECTED_TO_ANOTHER_ACCOUNT
                | undefined
            }
            privacyMode={privacyMode}
            showDefaultAddress={showDefaultAddress}
            isHidden={isHidden}
            isEditMode={isEditMode}
            isDeleteMode={isDeleteMode}
            onVisibilityIconClick={
              isEditMode && !isDeleteMode
                ? (accountGroupId) => {
                    handleVisibilityToggle(accountGroupId, isHidden);
                  }
                : undefined
            }
            onDeleteIconClick={
              isDeleteMode
                ? () => {
                    const firstAccountId = groupData.accounts[0];
                    const address = firstAccountId
                      ? internalAccountsById[firstAccountId]?.address
                      : undefined;
                    setAccountToDelete({
                      groupId: groupId as AccountGroupId,
                      accountName: groupData.metadata.name,
                      address,
                      walletType: wallet?.type,
                    });
                  }
                : undefined
            }
            walletName={showWalletName ? wallet?.metadata?.name : undefined}
            startAccessory={
              showAccountCheckbox ? (
                <Box onClick={(event) => event.stopPropagation()}>
                  <Checkbox
                    id={`multichain-account-checkbox-${groupId}`}
                    isSelected={selectedAccountGroupsSet.has(
                      groupId as AccountGroupId,
                    )}
                    isDisabled={isSwitchPending}
                    onChange={() => {
                      handleAccountClickToUse(groupId as AccountGroupId);
                    }}
                  />
                </Box>
              ) : undefined
            }
            endAccessory={
              showAccountMenu ? (
                <MultichainAccountMenu
                  accountGroupId={groupId as AccountGroupId}
                  isRemovable={isRemovable}
                  handleAccountRenameAction={handleAccountRenameAction}
                  isOpen={openMenuAccountId === groupId}
                  onToggle={() => handleMenuToggle(groupId as AccountGroupId)}
                />
              ) : undefined
            }
          />
        </Box>
      );
    },
    [
      allBalances,
      formatCurrencyWithMinThreshold,
      connectedAccountGroups,
      showConnectionStatus,
      selectedAccountGroupsSet,
      handleAccountClickToUse,
      isSwitchPending,
      privacyMode,
      showAccountCheckbox,
      wallets,
      showAccountMenu,
      handleAccountRenameAction,
      openMenuAccountId,
      handleMenuToggle,
      showDefaultAddress,
      isEditMode,
      internalAccountsById,
      pendingVisibilityOverrides,
      handleVisibilityToggle,
    ],
  );

  const walletTreeData = useMemo(() => {
    const result: ListItem[] = [];

    // Render pinned section (if there are any pinned accounts)
    if (pinnedGroups.length > 0) {
      const pinnedSectionKey = 'pinned';
      const isPinnedExpanded = !collapsedSectionKeys.has(pinnedSectionKey);
      result.push({
        type: 'header',
        key: 'pinned-header',
        text: t('pinned'),
        testId: 'multichain-account-tree-pinned-header',
        sectionKey: pinnedSectionKey,
        isCollapsible: true,
        isExpanded: isPinnedExpanded,
      });
      if (isPinnedExpanded) {
        pinnedGroups.forEach(({ groupId, groupData, walletId }) => {
          result.push({
            type: 'account',
            key: `account-${groupId}`,
            groupId,
            groupData,
            walletId,
            showWalletName: !showDefaultAddress,
          });
        });
      }
    }

    // Only show wallet header if we should show headers AND there are accounts to display in this wallet
    const shouldShowWalletHeaders =
      displayWalletHeader || pinnedGroups.length > 0;

    Object.entries(wallets).forEach(([walletId, walletData]) => {
      const visibleAccounts: ListItem[] = [];
      const hiddenAccounts: ListItem[] = [];

      Object.entries(walletData.groups || {}).forEach(
        ([groupId, groupData]) => {
          if (groupData.metadata?.pinned) {
            return;
          }

          const accountItem: ListItem = {
            type: 'account',
            key: `account-${groupId}`,
            groupId,
            groupData,
            walletId,
            showWalletName: false,
          };

          if (
            getEffectiveIsHidden(
              groupId,
              groupData.metadata?.hidden,
              pendingVisibilityOverrides,
            )
          ) {
            hiddenAccounts.push(accountItem);
          } else {
            visibleAccounts.push(accountItem);
          }
        },
      );

      const accounts: ListItem[] = [...visibleAccounts];

      // While editing, hidden accounts sit at the end of their own wallet so a
      // hide/reveal is a short move. Outside edit mode they stay in the
      // separate hidden section rendered below.
      if (isEditMode) {
        accounts.push(...hiddenAccounts);
      }

      if (!isInSearchMode && walletData.type === AccountWalletType.Entropy) {
        accounts.push({
          type: 'add-account',
          key: `add-${walletId}`,
          walletId,
        });
      }

      if (accounts.length > 0) {
        if (shouldShowWalletHeaders) {
          const walletSectionKey = `wallet-${walletId}`;
          const isWalletExpanded = !collapsedSectionKeys.has(walletSectionKey);
          result.push({
            type: 'header',
            key: `wallet-${walletId}`,
            text: walletData.metadata?.name || '',
            testId: 'multichain-account-tree-wallet-header',
            sectionKey: walletSectionKey,
            isCollapsible: true,
            isExpanded: isWalletExpanded,
          });
          if (isWalletExpanded) {
            result.push(...accounts);
          }
          return;
        }
        result.push(...accounts);
      }
    });

    // Render hidden section (if there are any hidden accounts). Edit mode lists
    // hidden accounts inline under their wallet instead.
    if (!isEditMode && hiddenGroups.length > 0) {
      result.push({
        type: 'hidden-header',
        key: 'hidden-header',
        count: hiddenGroups.length,
      });
      // Only render hidden accounts when expanded
      if (isHiddenAccountsExpanded) {
        hiddenGroups.forEach(({ groupId, groupData, walletId }) => {
          result.push({
            type: 'account',
            key: `account-hidden-${groupId}`,
            groupId,
            groupData,
            walletId,
            showWalletName: !showDefaultAddress,
          });
        });
      }
    }

    return result;
  }, [
    wallets,
    pinnedGroups,
    hiddenGroups,
    isInSearchMode,
    displayWalletHeader,
    isHiddenAccountsExpanded,
    collapsedSectionKeys,
    showDefaultAddress,
    isEditMode,
    pendingVisibilityOverrides,
    t,
  ]);

  useEffect(() => {
    endTrace({ name: TraceName.ShowAccountList });
  }, []);

  return (
    <>
      <VirtualizedList
        data={walletTreeData}
        estimatedItemSize={64}
        keyExtractor={(item) => item.key}
        itemRef={(node, { item }) => {
          if (!node) {
            return;
          }
          if (item.type === 'account') {
            node.dataset.accountListFlipId = item.groupId;
            return;
          }
          delete node.dataset.accountListFlipId;
          node.style.translate = '';
          node.style.transition = '';
        }}
        renderItem={({ item }) => {
          if (item.type === 'header') {
            if (item.isCollapsible && item.sectionKey) {
              const isExpanded = item.isExpanded ?? true;
              return (
                <Box
                  asChild
                  backgroundColor={BoxBackgroundColor.BackgroundDefault}
                  className="w-full"
                >
                  <button
                    type="button"
                    onClick={() =>
                      toggleSectionExpanded(item.sectionKey as string)
                    }
                    className="flex w-full px-4 py-2 justify-between items-center"
                    data-testid={item.testId}
                    aria-expanded={isExpanded}
                  >
                    <Text
                      variant={TextVariant.BodyMd}
                      fontWeight={FontWeight.Medium}
                      color={TextColor.TextAlternative}
                    >
                      {item.text}
                    </Text>
                    <Icon
                      name={isExpanded ? IconName.ArrowUp : IconName.ArrowDown}
                      size={IconSize.Md}
                      color={IconColor.IconAlternative}
                    />
                  </button>
                </Box>
              );
            }

            return (
              <Box data-testid={item.testId} className="flex px-4 py-2">
                <Text
                  variant={TextVariant.BodyMd}
                  fontWeight={FontWeight.Medium}
                  color={TextColor.TextAlternative}
                >
                  {item.text}
                </Text>
              </Box>
            );
          }

          if (item.type === 'hidden-header') {
            return (
              <Box
                asChild
                backgroundColor={BoxBackgroundColor.BackgroundDefault}
                className="w-full"
              >
                <button
                  type="button"
                  onClick={() =>
                    setIsHiddenAccountsExpanded(!isHiddenAccountsExpanded)
                  }
                  className="hidden-accounts-list flex w-full px-4 py-2 justify-between items-center"
                  data-testid="multichain-account-tree-hidden-header"
                >
                  <Text
                    variant={TextVariant.BodyMd}
                    fontWeight={FontWeight.Medium}
                    color={TextColor.TextAlternative}
                  >
                    {t('hidden')} ({item.count})
                  </Text>
                  <Icon
                    name={
                      isHiddenAccountsExpanded
                        ? IconName.ArrowUp
                        : IconName.ArrowDown
                    }
                    size={IconSize.Md}
                    color={IconColor.IconAlternative}
                  />
                </button>
              </Box>
            );
          }

          if (item.type === 'add-account') {
            return (
              <AddMultichainAccount
                walletId={item.walletId as AccountWalletId}
              />
            );
          }

          const { groupId, groupData, walletId, showWalletName } = item;
          return renderAccountCell(
            groupId,
            groupData,
            walletId,
            showWalletName,
          );
        }}
      />
      {isAccountRenameModalOpen && (
        <MultichainAccountEditModal
          key={renameAccountGroupId}
          isOpen={isAccountRenameModalOpen}
          onClose={handleAccountRenameActionModalClose}
          accountGroupId={renameAccountGroupId as unknown as AccountGroupId}
        />
      )}
      {accountToDelete && (
        <AccountDeleteConfirmModal
          isOpen
          accountName={accountToDelete.accountName}
          onClose={handleAccountDeleteConfirmModalClose}
          onConfirm={handleAccountDeleteConfirm}
        />
      )}
    </>
  );
};
