import React, { useCallback, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { AccountGroupId } from '@metamask/account-api';
import { Box, BoxFlexDirection } from '@metamask/design-system-react';
import { useDispatch } from '../../../store/hooks';
import { setAccountGroupHidden } from '../../../store/actions';
import { selectBalanceForAllWallets } from '../../../selectors/assets';
import { getPreferences } from '../../../../shared/lib/selectors/preferences';
import {
  getIsDefaultAddressEnabled,
  getShowDefaultAddressPreference,
  getMetaMaskHdKeyrings,
} from '../../../selectors';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { useAnalytics } from '../../../hooks/useAnalytics';
import { useFormatters } from '../../../hooks/useFormatters';
import { getAccountGroupDisplayBalance } from '../../../helpers/utils/account-group-balance';
import { AccountTreeWallets } from '../../../selectors/multichain-accounts/account-tree.types';
import { AddMultichainAccount } from '../add-multichain-account';
import { WalletSectionHeader } from '../wallet-section-header';
import { AccountManagementRow } from './account-management-row';
import {
  AccountManagementRowItem,
  AccountManagementSection,
  projectAccountManagementSections,
} from './account-management-list.utils';

export type AccountManagementListProps = {
  wallets: AccountTreeWallets;
  isInSearchMode?: boolean;
  onAccountClick?: (accountGroupId: AccountGroupId) => void;
  onRemoveWallet?: (section: AccountManagementSection) => void;
  onRemoveAccount?: (item: AccountManagementRowItem) => void;
  onRenameAccount?: (groupId: AccountGroupId, newName: string) => void;
  onRenameWallet?: (section: AccountManagementSection, newTitle: string) => void;
  primaryEntropySourceId?: string;
};

export const AccountManagementList = ({
  wallets,
  isInSearchMode = false,
  onAccountClick,
  onRemoveWallet,
  onRemoveAccount,
  onRenameAccount,
  onRenameWallet,
  primaryEntropySourceId,
}: AccountManagementListProps) => {
  const dispatch = useDispatch();
  const { trackEvent, createEventBuilder } = useAnalytics();
  const { formatCurrencyWithMinThreshold } = useFormatters();
  const allBalances = useSelector(selectBalanceForAllWallets);
  const { privacyMode } = useSelector(getPreferences);
  const isDefaultAddressEnabled = useSelector(getIsDefaultAddressEnabled);
  const showDefaultAddressPreference = useSelector(
    getShowDefaultAddressPreference,
  );
  const showDefaultAddress =
    isDefaultAddressEnabled && showDefaultAddressPreference;

  const hdKeyrings = useSelector(getMetaMaskHdKeyrings);

  const effectivePrimaryEntropySourceId = useMemo(() => {
    if (primaryEntropySourceId) {
      return primaryEntropySourceId;
    }
    return hdKeyrings?.[0]?.metadata?.id;
  }, [primaryEntropySourceId, hdKeyrings]);

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

  const sections = useMemo(
    () =>
      projectAccountManagementSections({
        wallets,
        primaryEntropySourceId: effectivePrimaryEntropySourceId,
      }),
    [wallets, effectivePrimaryEntropySourceId],
  );

  const handleToggleAccountVisibility = useCallback(
    async (accountGroupId: AccountGroupId, currentHidden: boolean) => {
      const newHiddenState = !currentHidden;
      await dispatch(setAccountGroupHidden(accountGroupId, newHiddenState));

      trackEvent(
        createEventBuilder(MetaMetricsEventName.AccountHidden)
          .addCategory(MetaMetricsEventCategory.Accounts)
          .addProperties({
            hidden: newHiddenState,
          })
          .build(),
      );
    },
    [dispatch, trackEvent, createEventBuilder],
  );

  return (
    <Box
      className="account-management-list flex flex-col w-full"
      flexDirection={BoxFlexDirection.Column}
      data-testid="account-management-list"
    >
      {sections.map((section) => {
        const isExpanded = !collapsedSectionKeys.has(section.id);
        const handleRenameWallet = onRenameWallet
          ? (newTitle: string) => onRenameWallet(section, newTitle)
          : undefined;

        return (
          <Box
            key={section.id}
            className="wallet-section flex flex-col w-full"
            flexDirection={BoxFlexDirection.Column}
            data-testid={`wallet-section-${section.id}`}
          >
            <WalletSectionHeader
              title={section.title}
              testId={`wallet-section-header-${section.id}`}
              isCollapsible={section.isCollapsible}
              isExpanded={isExpanded}
              onToggleExpand={() => toggleSectionExpanded(section.id)}
              isLocked={section.isLocked}
              isRemovable={section.isRemovable}
              showDragHandle
              onRemove={
                onRemoveWallet ? () => onRemoveWallet(section) : undefined
              }
              onRename={handleRenameWallet}
            />
            {isExpanded && (
              <Box
                className="wallet-section__accounts flex flex-col w-full"
                flexDirection={BoxFlexDirection.Column}
              >
                {section.accounts.map((item) => {
                  const groupBalance = getAccountGroupDisplayBalance(
                    allBalances?.wallets?.[item.walletId]?.groups?.[
                      item.groupId
                    ],
                  );
                  const balance =
                    groupBalance &&
                    formatCurrencyWithMinThreshold(
                      groupBalance.amount,
                      groupBalance.currency,
                    );

                  return (
                    <AccountManagementRow
                      key={item.id}
                      item={item}
                      balance={balance}
                      privacyMode={privacyMode}
                      showDefaultAddress={showDefaultAddress}
                      onClick={onAccountClick}
                      onToggleVisibility={handleToggleAccountVisibility}
                      onRemoveAccount={onRemoveAccount}
                      onRenameAccount={onRenameAccount}
                    />
                  );
                })}
                {!isInSearchMode &&
                  section.canAddAccount &&
                  section.walletId && (
                    <AddMultichainAccount
                      walletId={section.walletId}
                      data-testid={`add-account-to-${section.walletId}`}
                    />
                  )}
              </Box>
            )}
          </Box>
        );
      })}
    </Box>
  );
};
