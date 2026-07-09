import React, { useContext, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { CaipChainId } from '@metamask/utils';
import { AccountGroupId } from '@metamask/account-api';
import {
  AvatarAccountSize,
  Box,
  BoxBackgroundColor,
  IconName,
} from '@metamask/design-system-react';
import { PreferredAvatar } from '../../app/preferred-avatar';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { EditNetworksModal } from '../../multichain/edit-networks-modal';
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
import { EvmAndMultichainNetworkConfigurationsWithCaipChainId } from '../../../selectors/selectors.types';
import { MultichainSiteCellTooltip } from './tool-tip/multichain-site-cell-tooltip';

type MultichainSiteCellProps = {
  nonTestNetworks: EvmAndMultichainNetworkConfigurationsWithCaipChainId[];
  testNetworks: EvmAndMultichainNetworkConfigurationsWithCaipChainId[];
  supportedAccountGroups: AccountGroupWithInternalAccounts[];
  showEditAccounts: () => void;
  onSelectChainIds: (chainIds: CaipChainId[]) => void;
  selectedAccountGroupIds: AccountGroupId[];
  selectedChainIds: CaipChainId[];
  isConnectFlow?: boolean;
  hideAllToasts?: () => void;
};

export const MultichainSiteCell = ({
  nonTestNetworks,
  testNetworks,
  supportedAccountGroups,
  showEditAccounts,
  onSelectChainIds,
  selectedAccountGroupIds,
  selectedChainIds,
  isConnectFlow,
  hideAllToasts = () => undefined,
}: MultichainSiteCellProps) => {
  const t = useI18nContext();
  const { trackEvent, createEventBuilder } = useAnalytics();
  const allNetworks = [...nonTestNetworks, ...testNetworks];
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

  const [showEditNetworksModal, setShowEditNetworksModal] = useState(false);

  const selectedNetworks = allNetworks.filter(({ caipChainId }) =>
    selectedChainIds.includes(caipChainId),
  );

  const selectedChainIdsLength = selectedChainIds.length;

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

  const handleOpenNetworksModal = () => {
    hideAllToasts?.();
    setShowEditNetworksModal(true);
    trackEvent(
      createEventBuilder(MetaMetricsEventName.ViewPermissionedNetworks)
        .addCategory(MetaMetricsEventCategory.Navigation)
        .addProperties({
          location:
            'Connect view (permissions tab), Permissions toast, Permissions (dapp)',
        })
        .build(),
    );
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
    <>
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
        <SiteCellConnectionListItem
          title={t('permission_walletSwitchEthereumChain')}
          iconName={IconName.Global}
          connectedMessage={t('connectedWithNetwork', [selectedChainIdsLength])}
          unconnectedMessage={t('requestingFor')}
          isConnectFlow={isConnectFlow}
          onClick={handleOpenNetworksModal}
          paddingTopValue={2}
          paddingBottomValue={0}
          // @ts-expect-error: React 18 ReactElement.key is Key|null, incompatible with @types/prop-types ReactNodeLike
          content={<MultichainSiteCellTooltip networks={selectedNetworks} />}
        />
      </Box>

      {showEditNetworksModal && (
        <EditNetworksModal
          nonTestNetworks={nonTestNetworks}
          testNetworks={testNetworks}
          defaultSelectedChainIds={selectedChainIds}
          onClose={() => setShowEditNetworksModal(false)}
          onSubmit={onSelectChainIds}
        />
      )}
    </>
  );
};
