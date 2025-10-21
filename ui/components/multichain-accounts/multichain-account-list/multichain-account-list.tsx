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
import { useHistory } from 'react-router-dom';
import {
  AvatarIcon,
  AvatarIconSize,
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
import { AccountTreeWallets } from '../../../selectors/multichain-accounts/account-tree.types';
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
  getDefaultHomeActiveTabName,
  getHDEntropyIndex,
  getPreferences,
} from '../../../selectors';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { MultichainAccountMenu } from '../multichain-account-menu';
import { AddMultichainAccount } from '../add-multichain-account';
import { MultichainAccountEditModal } from '../multichain-account-edit-modal';
import { selectBalanceForAllWallets } from '../../../selectors/assets';
import { useFormatters } from '../../../hooks/useFormatters';

export type MultichainAccountListProps = {
  wallets: AccountTreeWallets;
  selectedAccountGroups: AccountGroupId[];
  handleAccountClick?: (accountGroupId: AccountGroupId) => void;
  isInSearchMode?: boolean;
  displayWalletHeader?: boolean;
  showAccountCheckbox?: boolean;
};

export const MultichainAccountList = ({
  wallets,
  selectedAccountGroups,
  handleAccountClick,
  isInSearchMode = false,
  displayWalletHeader = true,
  showAccountCheckbox = false,
}: MultichainAccountListProps) => {
  const dispatch = useDispatch();
  const history = useHistory();
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
      history.push(DEFAULT_ROUTE);
    };

    const handleAccountClickToUse =
      handleAccountClick ?? defaultHandleAccountClick;

    // Collect all groups to categorize them
    const pinnedGroups: {
      groupId: string;
      groupData: (typeof wallets)[AccountWalletId]['groups'][AccountGroupId];
      walletId: string;
    }[] = [];
    const hiddenGroups: {
      groupId: string;
      groupData: (typeof wallets)[AccountWalletId]['groups'][AccountGroupId];
      walletId: string;
    }[] = [];

    // First pass: collect pinned and hidden accounts
    Object.entries(wallets).forEach(([walletId, walletData]) => {
      Object.entries(walletData.groups || {}).forEach(
        ([groupId, groupData]) => {
          if (groupData.metadata.pinned) {
            pinnedGroups.push({ groupId, groupData, walletId });
          } else if (groupData.metadata.hidden) {
            hiddenGroups.push({ groupId, groupData, walletId });
          }
        },
      );
    });

    const renderAccountCell = (
      groupId: string,
      groupData: (typeof wallets)[AccountWalletId]['groups'][AccountGroupId],
      walletId: string,
      isHidden = false,
    ) => {
      // If prop is provided, attempt render balance. Otherwise do not render balance.
      const account = allBalances?.wallets?.[walletId]?.groups?.[groupId];
      const balance = account?.totalBalanceInUserCurrency ?? 0;
      const currency = account?.userCurrency ?? '';

      // TODO: Implement logic for removable accounts
      const isRemovable = false;

      // Render account name with EyeSlash icon prefix if hidden
      const accountNameElement: string | React.ReactNode = isHidden ? (
        <Box display={Display.Flex} alignItems={AlignItems.center} gap={1}>
          <Icon
            name={IconName.EyeSlash}
            size={IconSize.Xs}
            color={IconColor.iconDefault}
          />
          <Text variant={TextVariant.bodyMdMedium}>
            {groupData.metadata.name}
          </Text>
        </Box>
      ) : (
        groupData.metadata.name
      );

      return (
        <Box
          className={`multichain-account-menu-popover__list--menu-item${isHidden ? ' multichain-account-menu-popover__list--menu-item-hidden-account' : ''}`}
          key={`multichain-account-cell-${groupId}`}
          style={isHidden ? { opacity: 0.5 } : undefined}
        >
          <MultichainAccountCell
            accountId={groupId as AccountGroupId}
            accountName={accountNameElement as string | React.ReactNode}
            accountNameString={groupData.metadata.name}
            balance={formatCurrencyWithMinThreshold(balance, currency)}
            selected={selectedAccountGroupsSet.has(groupId as AccountGroupId)}
            onClick={handleAccountClickToUse}
            privacyMode={privacyMode}
            startAccessory={
              showAccountCheckbox ? (
                <Box marginRight={4}>
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
              <MultichainAccountMenu
                accountGroupId={groupId as AccountGroupId}
                isRemovable={isRemovable}
                handleAccountRenameAction={handleAccountRenameAction}
                isOpen={openMenuAccountId === groupId}
                onToggle={() => handleMenuToggle(groupId as AccountGroupId)}
              />
            }
          />
        </Box>
      );
    };

    const result: React.ReactNode[] = [];

    // Render pinned section (if there are any pinned accounts)
    // TODO: Add translation for 'Pinned accounts'
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
          gap={2}
        >
          <Icon
            name={IconName.Pin}
            size={IconSize.Sm}
            color={IconColor.iconMuted}
          />
          <Text variant={TextVariant.bodyMdMedium} color={TextColor.textMuted}>
            Pinned accounts
          </Text>
        </Box>
      );
      result.push(pinnedHeader);

      pinnedGroups.forEach(({ groupId, groupData, walletId }) => {
        result.push(renderAccountCell(groupId, groupData, walletId));
      });
    }

    // Render wallets with their non-pinned, non-hidden accounts
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
              color={TextColor.textMuted}
            >
              {walletName}
            </Text>
          </Box>
        );

        const groupsItems = Object.entries(walletData.groups || {}).flatMap(
          ([groupId, groupData]) => {
            // Skip pinned and hidden accounts (they're shown in their own sections)
            if (groupData.metadata.pinned || groupData.metadata.hidden) {
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

        return [
          ...walletsAccumulator,
          displayWalletHeader ? walletHeader : null,
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
          padding={4}
          alignItems={AlignItems.center}
          width={BlockSize.Full}
          justifyContent={JustifyContent.spaceBetween}
          className="hidden-accounts-list"
          data-testid="multichain-account-tree-hidden-header"
        >
          <Box
            display={Display.Flex}
            alignItems={AlignItems.center}
            width={BlockSize.TwoThirds}
            gap={2}
          >
            <AvatarIcon
              iconName={IconName.EyeSlash}
              color={IconColor.infoDefault}
              backgroundColor={BackgroundColor.infoMuted}
              size={AvatarIconSize.Sm}
            />
            <Box display={Display.Flex}>
              <Text variant={TextVariant.bodyMdMedium}>
                {t('hiddenAccounts')}
              </Text>
            </Box>
          </Box>
          <Box
            gap={2}
            display={Display.Flex}
            alignItems={AlignItems.center}
            width={BlockSize.OneThird}
            justifyContent={JustifyContent.flexEnd}
          >
            <Text variant={TextVariant.bodyMdMedium}>
              {hiddenGroups.length}
            </Text>
            <Icon
              name={
                isHiddenAccountsExpanded ? IconName.ArrowUp : IconName.ArrowDown
              }
              size={IconSize.Sm}
              color={IconColor.iconDefault}
            />
          </Box>
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
    trackEvent,
    hdEntropyIndex,
    defaultHomeActiveTabName,
    dispatch,
    history,
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
    t,
    isHiddenAccountsExpanded,
  ]);

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
