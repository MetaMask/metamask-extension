import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  AccountGroupId,
  AccountWalletId,
  AccountWalletType,
} from '@metamask/account-api';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { parseCaipAccountId } from '@metamask/utils';
import {
  Box,
  Checkbox,
  Icon,
  IconName,
  IconSize,
  Text,
} from '../../component-library';
import { useI18nContext } from '../../../hooks/useI18nContext';

import {
  AlignItems,
  BackgroundColor,
  BlockSize,
  Display,
  IconColor,
  JustifyContent,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { MultichainAccountCell } from '../multichain-account-cell';
import {
  AccountTreeWallets,
  MultichainAccountsState,
} from '../../../selectors/multichain-accounts/account-tree.types';
import { setSelectedMultichainAccount } from '../../../store/actions';
import { DEFAULT_ROUTE } from '../../../helpers/constants/routes';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { endTrace, trace, TraceName } from '../../../../shared/lib/trace';
import {
  ACCOUNT_OVERVIEW_TAB_KEY_TO_TRACE_NAME_MAP,
  AccountOverviewTabKey,
} from '../../../../shared/constants/app-state';
import {
  getAllPermittedAccountsForCurrentTab,
  getDefaultHomeActiveTabName,
  getHDEntropyIndex,
  getPreferences,
} from '../../../selectors';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { MultichainAccountMenu } from '../multichain-account-menu';
import { AddMultichainAccount } from '../add-multichain-account';
import { MultichainAccountEditModal } from '../multichain-account-edit-modal';
import { getAccountGroupsByAddress } from '../../../selectors/multichain-accounts/account-tree';
import {
  STATUS_CONNECTED,
  STATUS_CONNECTED_TO_ANOTHER_ACCOUNT,
} from '../../../helpers/constants/connected-sites';
import { selectBalanceForAllWallets } from '../../../selectors/assets';
import { useFormatters } from '../../../hooks/useFormatters';

export type MultichainAccountListProps = {
  wallets: AccountTreeWallets;
  selectedAccountGroups: AccountGroupId[];
  handleAccountClick?: (accountGroupId: AccountGroupId) => void;
  isInSearchMode?: boolean;
  displayWalletHeader?: boolean;
  showAccountCheckbox?: boolean;
  showConnectionStatus?: boolean;
};

export const MultichainAccountList = ({
  wallets,
  selectedAccountGroups,
  handleAccountClick,
  isInSearchMode = false,
  displayWalletHeader = true,
  showAccountCheckbox = false,
  showConnectionStatus = false,
}: MultichainAccountListProps) => {
  const showAccountMenu = !showAccountCheckbox;

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const trackEvent = useContext(MetaMetricsContext);
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

  const [renameAccountGroupId, setRenameAccountGroupId] = useState(undefined);

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
        return [];
      }
      return getAccountGroupsByAddress(state, permittedAddresses);
    },
    [showConnectionStatus, permittedAddresses],
  );

  const connectedAccountGroups = useSelector(selectConnectedAccountGroups);
  const [isHiddenAccountsExpanded, setIsHiddenAccountsExpanded] =
    useState(false);

  const handleAccountRenameActionModalClose = useCallback(() => {
    setIsAccountRenameModalOpen(false);
    setRenameAccountGroupId(undefined);
  }, [setIsAccountRenameModalOpen, setRenameAccountGroupId]);

  const handleAccountRenameAction = useCallback(
    (accountGroupId) => {
      setRenameAccountGroupId(accountGroupId);
      setIsAccountRenameModalOpen(true);
      setOpenMenuAccountId(null);
    },
    [setIsAccountRenameModalOpen, setRenameAccountGroupId],
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
          } else if (groupData.metadata.hidden) {
            hidden.push({ groupId, groupData, walletId });
          }
        },
      );
    });

    return { pinnedGroups: pinned, hiddenGroups: hidden };
  }, [wallets]);

  const walletTree = useMemo(() => {
    const defaultHandleAccountClick = (accountGroupId: AccountGroupId) => {
      trackEvent({
        category: MetaMetricsEventCategory.Navigation,
        event: MetaMetricsEventName.NavAccountSwitched,
        properties: {
          location: 'Main Menu',
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          hd_entropy_index: hdEntropyIndex,
        },
      });
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

      dispatch(setSelectedMultichainAccount(accountGroupId));
      navigate(DEFAULT_ROUTE);
    };

    const handleAccountClickToUse = (accountGroupId: AccountGroupId) => {
      const handlerToUse = handleAccountClick ?? defaultHandleAccountClick;
      handlerToUse?.(accountGroupId);
    };

    const renderAccountCell = (
      groupId: string,
      groupData: (typeof wallets)[AccountWalletId]['groups'][AccountGroupId],
      walletId: string,
      showWalletName = false,
    ) => {
      // If prop is provided, attempt render balance. Otherwise do not render balance.
      const account = allBalances?.wallets?.[walletId]?.groups?.[groupId];
      const balance = account?.totalBalanceInUserCurrency ?? 0;
      const currency = account?.userCurrency ?? '';

      // TODO: Implement logic for removable accounts
      const isRemovable = false;

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
        <Box
          className="multichain-account-menu-popover__list--menu-item"
          key={`multichain-account-cell-${groupId}`}
        >
          <MultichainAccountCell
            accountId={groupId as AccountGroupId}
            accountName={groupData.metadata.name}
            accountNameString={groupData.metadata.name}
            balance={formatCurrencyWithMinThreshold(balance, currency)}
            selected={selectedAccountGroupsSet.has(groupId as AccountGroupId)}
            onClick={handleAccountClickToUse}
            connectionStatus={
              connectedStatus as
                | typeof STATUS_CONNECTED
                | typeof STATUS_CONNECTED_TO_ANOTHER_ACCOUNT
                | undefined
            }
            privacyMode={privacyMode}
            walletName={
              showWalletName
                ? wallets[walletId as AccountWalletId]?.metadata?.name
                : undefined
            }
            startAccessory={
              showAccountCheckbox ? (
                <Box>
                  <Checkbox
                    isChecked={selectedAccountGroupsSet.has(
                      groupId as AccountGroupId,
                    )}
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
    };

    const result: React.ReactNode[] = [];

    // Render pinned section (if there are any pinned accounts)
    if (pinnedGroups.length > 0) {
      const pinnedHeader = (
        <Box
          key="pinned-header"
          data-testid="multichain-account-tree-pinned-header"
          display={Display.Flex}
          alignItems={AlignItems.center}
          paddingLeft={4}
          paddingRight={4}
          paddingTop={2}
          paddingBottom={2}
        >
          <Text
            variant={TextVariant.bodyMdMedium}
            color={TextColor.textAlternative}
          >
            {t('pinned')}
          </Text>
        </Box>
      );
      result.push(pinnedHeader);

      pinnedGroups.forEach(({ groupId, groupData, walletId }) => {
        result.push(renderAccountCell(groupId, groupData, walletId, true));
      });
    }

    // Render wallets with their non-pinned, non-hidden accounts
    // Show wallet headers if there are multiple wallets OR if there are pinned accounts
    const shouldShowWalletHeaders =
      displayWalletHeader || pinnedGroups.length > 0;

    const walletSections = Object.entries(wallets).reduce(
      (walletsAccumulator, [walletId, walletData]) => {
        const walletName = walletData.metadata?.name;

        const walletHeader = (
          <Box
            key={`wallet-header-${walletId}`}
            data-testid="multichain-account-tree-wallet-header"
            display={Display.Flex}
            justifyContent={JustifyContent.spaceBetween}
            alignItems={AlignItems.center}
            paddingLeft={4}
            paddingRight={4}
            paddingTop={2}
            paddingBottom={2}
          >
            <Text
              variant={TextVariant.bodyMdMedium}
              color={TextColor.textAlternative}
            >
              {walletName}
            </Text>
          </Box>
        );

        const groupsItems = Object.entries(walletData.groups || {}).flatMap(
          ([groupId, groupData]) => {
            const shouldSkip =
              groupData.metadata?.pinned || groupData.metadata?.hidden;
            if (shouldSkip) {
              return [];
            }
            return [renderAccountCell(groupId, groupData, walletId)];
          },
        );

        if (!isInSearchMode && walletData.type === AccountWalletType.Entropy) {
          groupsItems.push(
            <AddMultichainAccount
              walletId={walletId as AccountWalletId}
              key={`add-multichain-account-${walletId}`}
            />,
          );
        }

        // Only show wallet header if we should show headers AND there are accounts to display in this wallet
        const showThisWalletHeader =
          shouldShowWalletHeaders && groupsItems.length > 0;

        return [
          ...walletsAccumulator,
          showThisWalletHeader ? walletHeader : null,
          ...groupsItems,
        ];
      },
      [] as React.ReactNode[],
    );

    result.push(...walletSections);

    // Render hidden section (if there are any hidden accounts)
    if (hiddenGroups.length > 0) {
      const hiddenHeader = (
        <Box
          key="hidden-header"
          as="button"
          onClick={() => setIsHiddenAccountsExpanded(!isHiddenAccountsExpanded)}
          backgroundColor={BackgroundColor.backgroundDefault}
          display={Display.Flex}
          justifyContent={JustifyContent.spaceBetween}
          alignItems={AlignItems.center}
          paddingLeft={4}
          paddingRight={6}
          paddingTop={2}
          paddingBottom={2}
          width={BlockSize.Full}
          className="hidden-accounts-list"
          data-testid="multichain-account-tree-hidden-header"
        >
          <Text
            variant={TextVariant.bodyMdMedium}
            color={TextColor.textAlternative}
          >
            {t('hidden')} ({hiddenGroups.length})
          </Text>
          <Icon
            name={
              isHiddenAccountsExpanded ? IconName.ArrowUp : IconName.ArrowDown
            }
            size={IconSize.Md}
            color={IconColor.iconAlternative}
          />
        </Box>
      );
      result.push(hiddenHeader);

      // Only render hidden accounts when expanded
      if (isHiddenAccountsExpanded) {
        hiddenGroups.forEach(({ groupId, groupData, walletId }) => {
          result.push(renderAccountCell(groupId, groupData, walletId, true));
        });
      }
    }

    return result;
  }, [
    handleAccountClick,
    wallets,
    pinnedGroups,
    hiddenGroups,
    trackEvent,
    hdEntropyIndex,
    defaultHomeActiveTabName,
    dispatch,
    navigate,
    isInSearchMode,
    displayWalletHeader,
    allBalances,
    formatCurrencyWithMinThreshold,
    selectedAccountGroupsSet,
    privacyMode,
    showAccountCheckbox,
    handleAccountRenameAction,
    handleMenuToggle,
    openMenuAccountId,
    showConnectionStatus,
    connectedAccountGroups,
    t,
    isHiddenAccountsExpanded,
  ]);

  useEffect(() => {
    endTrace({ name: TraceName.ShowAccountList });
  }, []);

  return (
    <>
      {walletTree}
      {isAccountRenameModalOpen && (
        <MultichainAccountEditModal
          key={renameAccountGroupId}
          isOpen={isAccountRenameModalOpen}
          onClose={handleAccountRenameActionModalClose}
          accountGroupId={renameAccountGroupId as unknown as AccountGroupId}
        />
      )}
    </>
  );
};
