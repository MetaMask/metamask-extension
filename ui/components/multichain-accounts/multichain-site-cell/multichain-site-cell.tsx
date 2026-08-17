import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { AccountGroupId } from '@metamask/account-api';
import {
  AvatarAccountSize,
  Box,
  BoxBackgroundColor,
  IconName,
} from '@metamask/design-system-react';
import { PreferredAvatar } from '../../app/preferred-avatar';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { useAnalytics } from '../../../hooks/useAnalytics';
import {
  AccountGroupWithInternalAccounts,
  MultichainAccountsState,
} from '../../../selectors/multichain-accounts/account-tree.types';
import { getIconSeedAddressByAccountGroupId } from '../../../selectors/multichain-accounts/account-tree';
import { SiteCellConnectionListItem } from '../../multichain/pages/review-permissions-page/site-cell/site-cell-connection-list-item';
import { MultichainSiteCellTooltip } from './tool-tip/multichain-site-cell-tooltip';

type MultichainSiteCellProps = {
  supportedAccountGroups: AccountGroupWithInternalAccounts[];
  showEditAccounts: () => void;
  selectedAccountGroupIds: AccountGroupId[];
  isConnectFlow?: boolean;
  hideAllToasts?: () => void;
};

export const MultichainSiteCell = ({
  supportedAccountGroups,
  showEditAccounts,
  selectedAccountGroupIds,
  isConnectFlow,
  hideAllToasts = () => undefined,
}: MultichainSiteCellProps) => {
  const t = useI18nContext();
  const { trackEvent, createEventBuilder } = useAnalytics();
  const seedAddressIcon = useSelector((state: MultichainAccountsState) => {
    // Only get seed address if we have a valid account group ID
    if (selectedAccountGroupIds.length > 0 && selectedAccountGroupIds[0]) {
      try {
        return getIconSeedAddressByAccountGroupId(
          state,
          selectedAccountGroupIds[0],
        );
      } catch (error) {
        // Handle case where account group is not found or has no accounts
        return '';
      }
    }
    return '';
  });

  const handleOpenAccountsModal = () => {
    hideAllToasts?.();
    trackEvent(
      createEventBuilder(MetaMetricsEventName.ViewPermissionedAccounts)
        .addCategory(MetaMetricsEventCategory.Navigation)
        .addProperties({
          location:
            'Connect view (permissions tab), Permissions toast, Permissions (dapp)',
        })
        .build(),
    );
    showEditAccounts();
  };

  const accountMessageConnectedState = useMemo(() => {
    return selectedAccountGroupIds.length === 1
      ? t('connectedWithAccountName', [
          supportedAccountGroups.find(
            (account) => account.id === selectedAccountGroupIds[0],
          )?.metadata.name || '',
        ])
      : t('connectedWithAccount', [selectedAccountGroupIds.length]);
  }, [selectedAccountGroupIds, supportedAccountGroups, t]);

  return (
    <Box
      padding={4}
      gap={4}
      backgroundColor={BoxBackgroundColor.BackgroundDefault}
    >
      <SiteCellConnectionListItem
        title={t('accountsPermissionsTitle')}
        iconName={IconName.Eye}
        connectedMessage={accountMessageConnectedState}
        unconnectedMessage={t('requestingFor', [
          selectedAccountGroupIds.length,
        ])}
        isConnectFlow={isConnectFlow}
        onClick={handleOpenAccountsModal}
        paddingBottomValue={2}
        paddingTopValue={0}
        // @ts-expect-error: React 18 ReactElement.key is Key|null, incompatible with @types/prop-types ReactNodeLike
        content={
          selectedAccountGroupIds.length === 1 ? (
            <PreferredAvatar
              address={seedAddressIcon}
              size={AvatarAccountSize.Xs}
            />
          ) : (
            <MultichainSiteCellTooltip
              accountGroups={supportedAccountGroups.filter((account) =>
                selectedAccountGroupIds.includes(account.id),
              )}
            />
          )
        }
      />
    </Box>
  );
};
