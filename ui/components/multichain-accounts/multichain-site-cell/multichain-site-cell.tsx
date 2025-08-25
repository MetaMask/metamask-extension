import React, { useContext, useState } from 'react';
import { CaipChainId } from '@metamask/utils';
import {
  BackgroundColor,
  BorderColor,
  BorderRadius,
} from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  AvatarAccount,
  AvatarAccountSize,
  Box,
  IconName,
} from '../../component-library';
import { EditNetworksModal } from '../../multichain/edit-networks-modal';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { MultichainSiteCellTooltip } from './tool-tip/multichain-site-cell-tooltip';
import { AccountGroupWithInternalAccounts } from '../../../selectors/multichain-accounts/account-tree.types';
import { SiteCellConnectionListItem } from '../../multichain/pages/review-permissions-page/site-cell/site-cell-connection-list-item';
import { MultichainEditAccountsModal } from '../permissions/edit-accounts-modal/multichain-edit-accounts-modal';
import { AccountGroupId } from '@metamask/account-api';
import { EvmAndMultichainNetworkConfigurationsWithCaipChainId } from '../../../selectors/selectors.types';

type MultichainSiteCellProps = {
  nonTestNetworks: EvmAndMultichainNetworkConfigurationsWithCaipChainId[];
  testNetworks: EvmAndMultichainNetworkConfigurationsWithCaipChainId[];
  supportedAccountGroups: AccountGroupWithInternalAccounts[];
  onSelectAccountGroupIds: (groupIds: AccountGroupId[]) => void;
  onSelectChainIds: (chainIds: CaipChainId[]) => void;
  selectedAccountGroupIds: AccountGroupId[];
  selectedChainIds: CaipChainId[];
  isConnectFlow?: boolean;
  hideAllToasts?: () => void;
};

export const MultichainSiteCell: React.FC<MultichainSiteCellProps> = ({
  nonTestNetworks,
  testNetworks,
  supportedAccountGroups,
  onSelectAccountGroupIds,
  onSelectChainIds,
  selectedAccountGroupIds,
  selectedChainIds,
  isConnectFlow,
  hideAllToasts = () => undefined,
}) => {
  const t = useI18nContext();
  const trackEvent = useContext(MetaMetricsContext);
  const allNetworks = [...nonTestNetworks, ...testNetworks];

  const [showEditAccountsModal, setShowEditAccountsModal] = useState(false);
  const [showEditNetworksModal, setShowEditNetworksModal] = useState(false);

  const selectedNetworks = allNetworks.filter(({ caipChainId }) =>
    selectedChainIds.includes(caipChainId),
  );

  const selectedChainIdsLength = selectedChainIds.length;

  // Determine the messages for connected and not connected states
  const accountMessageConnectedState =
    selectedAccountGroupIds.length === 1
      ? t('connectedWithAccountName', [
          supportedAccountGroups.find(
            (account) => account.id === selectedAccountGroupIds[0],
          )?.metadata.name,
        ])
      : t('connectedWithAccount', [selectedAccountGroupIds.length]);
  const accountMessageNotConnectedState =
    selectedAccountGroupIds.length === 1
      ? t('requestingForAccount', [
          supportedAccountGroups.find(
            (account) => account.id === selectedAccountGroupIds[0],
          )?.metadata.name,
        ])
      : t('requestingFor');

  const networkMessageConnectedState =
    selectedChainIdsLength === 1
      ? t('connectedWithNetworkName', [selectedNetworks[0].name])
      : t('connectedWithNetwork', [selectedChainIdsLength]);
  const networkMessageNotConnectedState =
    selectedChainIdsLength === 1
      ? t('requestingForNetwork', [selectedNetworks[0].name])
      : t('requestingFor');

  const handleOpenAccountsModal = () => {
    hideAllToasts?.();
    setShowEditAccountsModal(true);
    trackEvent({
      category: MetaMetricsEventCategory.Navigation,
      event: MetaMetricsEventName.ViewPermissionedAccounts,
      properties: {
        location:
          'Connect view (permissions tab), Permissions toast, Permissions (dapp)',
      },
    });
  };

  const handleOpenNetworksModal = () => {
    hideAllToasts?.();
    setShowEditNetworksModal(true);
    trackEvent({
      category: MetaMetricsEventCategory.Navigation,
      event: MetaMetricsEventName.ViewPermissionedNetworks,
      properties: {
        location:
          'Connect view (permissions tab), Permissions toast, Permissions (dapp)',
      },
    });
  };

  return (
    <>
      <Box
        padding={4}
        gap={4}
        backgroundColor={BackgroundColor.backgroundDefault}
        borderRadius={BorderRadius.LG}
      >
        <SiteCellConnectionListItem
          title={t('accountsPermissionsTitle')}
          iconName={IconName.Eye}
          connectedMessage={accountMessageConnectedState}
          unconnectedMessage={accountMessageNotConnectedState}
          isConnectFlow={isConnectFlow}
          onClick={handleOpenAccountsModal}
          paddingBottomValue={2}
          paddingTopValue={0}
          content={
            selectedAccountGroupIds.length === 1 ? (
              <AvatarAccount
                address={
                  supportedAccountGroups.find(
                    (account) => account.id === selectedAccountGroupIds[0],
                  )?.accounts[0].address || ''
                }
                size={AvatarAccountSize.Xs}
                borderColor={BorderColor.transparent}
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
          connectedMessage={networkMessageConnectedState}
          unconnectedMessage={networkMessageNotConnectedState}
          isConnectFlow={isConnectFlow}
          onClick={handleOpenNetworksModal}
          paddingTopValue={2}
          paddingBottomValue={0}
          content={<MultichainSiteCellTooltip networks={selectedNetworks} />}
        />
      </Box>
      {showEditAccountsModal && (
        <MultichainEditAccountsModal
          supportedAccountGroups={supportedAccountGroups}
          defaultSelectedAccountGroups={selectedAccountGroupIds}
          onClose={() => setShowEditAccountsModal(false)}
          onSubmit={onSelectAccountGroupIds}
        />
      )}

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
