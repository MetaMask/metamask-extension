import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from 'react';

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
   * show delete controls; all other wallets show visibility controls. Menus
   * are suppressed while editing.
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
  } | null>(null);

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
    console.log('this account will be deleted');
    setAccountToDelete(null);
  }, []);

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

  const pinnedGroups = useMemo(() => {
    const pinned: {
      groupId: string;
      groupData: (typeof wallets)[AccountWalletId]['groups'][AccountGroupId];
      walletId: string;
    }[] = [];

    Object.entries(wallets).forEach(([walletId, walletData]) => {
      Object.entries(walletData.groups || {}).forEach(
        ([groupId, groupData]) => {
          if (groupData.metadata.pinned) {
            pinned.push({ groupId, groupData, walletId });
          }
        },
      );
    });

    return pinned;
  }, [wallets]);

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

      const wallet = wallets[walletId as AccountWalletId];
      const isRemovable = wallet ? isPrivateKeyWallet(wallet) : false;
      // Private-key accounts use delete mode in edit mode; all other wallets
      // use visible/hidden mode. These modes are mutually exclusive.
      const isDeleteMode = isEditMode && isRemovable;
      const isHidden = isDeleteMode
        ? false
        : (groupData.metadata.hidden ?? false);

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
            onClick={isEditMode ? undefined : handleAccountClickToUse}
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
                    dispatch(
                      setAccountGroupHidden(
                        accountGroupId,
                        !(groupData.metadata.hidden ?? false),
                      ),
                    );
                  }
                : undefined
            }
            onDeleteIconClick={
              isDeleteMode
                ? () => {
                    setAccountToDelete({
                      groupId: groupId as AccountGroupId,
                      accountName: groupData.metadata.name,
                    });
                  }
                : undefined
            }
            walletName={
              showWalletName
                ? wallet?.metadata?.name
                : undefined
            }
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
      dispatch,
      setAccountToDelete,
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

          if (groupData.metadata?.hidden) {
            hiddenAccounts.push(accountItem);
          } else {
            visibleAccounts.push(accountItem);
          }
        },
      );

      const accounts: ListItem[] = [...visibleAccounts];

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

      // Keep the wallet visible even when every account is hidden (and therefore
      // omitted outside edit mode), so users can still find and manage it.
      const hasAccountsInWallet =
        visibleAccounts.length > 0 || hiddenAccounts.length > 0;

      if (accounts.length > 0 || hasAccountsInWallet) {
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

    return result;
  }, [
    wallets,
    pinnedGroups,
    isInSearchMode,
    displayWalletHeader,
    collapsedSectionKeys,
    showDefaultAddress,
    isEditMode,
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
