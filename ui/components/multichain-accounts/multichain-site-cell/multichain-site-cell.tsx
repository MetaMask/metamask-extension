import React, { useContext, useState } from 'react';
import { CaipChainId } from '@metamask/utils';
import { AccountGroupId } from '@metamask/account-api';
import { AvatarAccountSize } from '@metamask/design-system-react';

import {
  BackgroundColor,
  BorderRadius,
} from '../../../helpers/constants/design-system';
import { PreferredAvatar } from '../../app/preferred-avatar';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { Box, IconName } from '../../component-library';
import { EditNetworksModal } from '../../multichain/edit-networks-modal';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { AccountGroupWithInternalAccounts } from '../../../selectors/multichain-accounts/account-tree.types';
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

export const MultichainSiteCell: React.FC<MultichainSiteCellProps> = ({
  nonTestNetworks,
  testNetworks,
  supportedAccountGroups,
  showEditAccounts,
  onSelectChainIds,
  selectedAccountGroupIds,
  selectedChainIds,
  isConnectFlow,
  hideAllToasts = () => undefined,
}) => {
  const t = useI18nContext();
  const trackEvent = useContext(MetaMetricsContext);
  const allNetworks = [...nonTestNetworks, ...testNetworks];

  const [showEditNetworksModal, setShowEditNetworksModal] = useState(false);

  const selectedNetworks = allNetworks.filter(({ caipChainId }) =>
    selectedChainIds.includes(caipChainId),
  );

  const selectedChainIdsLength = selectedChainIds.length;

  const handleOpenAccountsModal = () => {
    hideAllToasts?.();
    trackEvent({
      category: MetaMetricsEventCategory.Navigation,
      event: MetaMetricsEventName.ViewPermissionedAccounts,
      properties: {
        location:
          'Connect view (permissions tab), Permissions toast, Permissions (dapp)',
      },
    });
    showEditAccounts();
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
          connectedMessage={t('requestingFor', [
            selectedAccountGroupIds.length,
          ])}
          unconnectedMessage={t('requestingFor', [
            selectedAccountGroupIds.length,
          ])}
          isConnectFlow={isConnectFlow}
          onClick={handleOpenAccountsModal}
          paddingBottomValue={2}
          paddingTopValue={0}
          content={
            selectedAccountGroupIds.length === 1 ? (
              <PreferredAvatar
                address={
                  supportedAccountGroups.find(
                    (account) => account.id === selectedAccountGroupIds[0],
                  )?.accounts[0].address || ''
                }
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
          unconnectedMessage={t('requestingForNetwork', [
            selectedChainIdsLength,
          ])}
          isConnectFlow={isConnectFlow}
          onClick={handleOpenNetworksModal}
          paddingTopValue={2}
          paddingBottomValue={0}
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
