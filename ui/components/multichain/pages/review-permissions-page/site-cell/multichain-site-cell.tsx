import React, { useContext, useState } from 'react';
import { CaipAccountId, CaipChainId } from '@metamask/utils';
import {
  BackgroundColor,
  BorderColor,
  BorderRadius,
} from '../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import {
  AvatarAccount,
  AvatarAccountSize,
  Box,
  IconName,
} from '../../../../component-library';
import { EditAccountsModal, EditNetworksModal } from '../../..';
import { MergedInternalAccountWithCaipAccountId } from '../../../../../selectors/selectors.types';
import { MetaMetricsContext } from '../../../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../../../shared/constants/metametrics';
import { isEqualCaseInsensitive } from '../../../../../../shared/modules/string-utils';
import { SiteCellTooltip } from './site-cell-tooltip';
import { SiteCellConnectionListItem } from './site-cell-connection-list-item';
import { AccountGroupObject } from '@metamask/account-tree-controller';
import { AccountGroupWithInternalAccounts } from '../../../../../selectors/multichain-accounts/account-tree';
import { MultichainEditAccountsModal } from '../../../edit-accounts-modal/multichain-edit-accounts-modal';
import { MultichainSiteCellTooltip } from './multichain-site-cell-tooltip';

// Define types for networks, accounts, and other props
type Network = {
  name: string;
  chainId: string;
  caipChainId: CaipChainId;
};

type MultichainSiteCellProps = {
  nonTestNetworks: Network[];
  testNetworks: Network[];
  accountsGroups: AccountGroupWithInternalAccounts[];
  onSelectAccountGroupIds: (addresses: AccountGroupObject['id'][]) => void;
  onSelectChainIds: (chainIds: CaipChainId[]) => void;
  selectedAccountGroupIds: AccountGroupObject['id'][];
  selectedChainIds: CaipChainId[];
  isConnectFlow?: boolean;
  hideAllToasts?: () => void;
};

export const MultichainSiteCell: React.FC<MultichainSiteCellProps> = ({
  nonTestNetworks,
  testNetworks,
  accountsGroups,
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
          accountsGroups.find(
            (account) => account.id === selectedAccountGroupIds[0],
          )?.metadata.name,
        ])
      : t('connectedWithAccount', [selectedAccountGroupIds.length]);
  const accountMessageNotConnectedState =
    selectedAccountGroupIds.length === 1
      ? t('requestingForAccount', [
          accountsGroups.find(
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
          iconName={IconName.Wallet}
          connectedMessage={accountMessageConnectedState}
          unconnectedMessage={accountMessageNotConnectedState}
          isConnectFlow={isConnectFlow}
          onClick={handleOpenAccountsModal}
          paddingBottomValue={2}
          paddingTopValue={0}
          content={
            // Why this difference?
            selectedAccountGroupIds.length === 1 ? (
              <AvatarAccount
                address={
                  accountsGroups.find(
                    (account) => account.id === selectedAccountGroupIds[0],
                  )?.accounts[0].address || ''
                }
                size={AvatarAccountSize.Xs}
                borderColor={BorderColor.transparent}
              />
            ) : (
              <MultichainSiteCellTooltip
                accounts={accountsGroups.filter((account) =>
                  selectedAccountGroupIds.includes(account.id),
                )}
                networks={selectedNetworks}
              />
            )
          }
        />
        <SiteCellConnectionListItem
          title={t('permission_walletSwitchEthereumChain')}
          iconName={IconName.Data}
          connectedMessage={networkMessageConnectedState}
          unconnectedMessage={networkMessageNotConnectedState}
          isConnectFlow={isConnectFlow}
          onClick={handleOpenNetworksModal}
          paddingTopValue={2}
          paddingBottomValue={0}
          content={<SiteCellTooltip networks={selectedNetworks} />}
        />
      </Box>
      {showEditAccountsModal && (
        <MultichainEditAccountsModal
          accountsGroups={accountsGroups}
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
