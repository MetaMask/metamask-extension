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
import { Box, Checkbox, Text } from '../../component-library';

import {
  AlignItems,
  Display,
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

    return Object.entries(wallets).reduce(
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
            // If prop is provided, attempt render balance. Otherwise do not render balance.
            const account = allBalances?.wallets?.[walletId]?.groups?.[groupId];
            const balance = account?.totalBalanceInUserCurrency ?? 0;
            const currency = account?.userCurrency ?? '';

            // TODO: Implement logic for removable accounts
            const isRemovable = false;

            return [
              <Box
                className="multichain-account-menu-popover__list--menu-item"
                key={`multichain-account-cell-${groupId}`}
              >
                <MultichainAccountCell
                  accountId={groupId as AccountGroupId}
                  accountName={groupData.metadata.name}
                  balance={formatCurrencyWithMinThreshold(balance, currency)}
                  selected={selectedAccountGroupsSet.has(
                    groupId as AccountGroupId,
                  )}
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
                      onToggle={() =>
                        handleMenuToggle(groupId as AccountGroupId)
                      }
                    />
                  }
                />
              </Box>,
            ];
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
