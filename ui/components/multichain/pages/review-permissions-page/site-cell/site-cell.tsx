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

// Define types for networks, accounts, and other props
type Network = {
  name: string;
  chainId: string;
  caipChainId: CaipChainId;
};

type SiteCellProps = {
  nonTestNetworks: Network[];
  testNetworks: Network[];
  accounts: MergedInternalAccountWithCaipAccountId[];
  onSelectAccountAddresses: (addresses: CaipAccountId[]) => void;
  onSelectChainIds: (chainIds: CaipChainId[]) => void;
  selectedAccountAddresses: CaipAccountId[];
  selectedChainIds: CaipChainId[];
  isConnectFlow?: boolean;
  hideAllToasts?: () => void;
};

export const SiteCell: React.FC<SiteCellProps> = ({
  nonTestNetworks,
  testNetworks,
  accounts,
  onSelectAccountAddresses,
  onSelectChainIds,
  selectedAccountAddresses,
  selectedChainIds,
  isConnectFlow,
  hideAllToasts = () => undefined,
}) => {
  const t = useI18nContext();
  const trackEvent = useContext(MetaMetricsContext);
  const allNetworks = [...nonTestNetworks, ...testNetworks];

  const [showEditAccountsModal, setShowEditAccountsModal] = useState(false);
  const [showEditNetworksModal, setShowEditNetworksModal] = useState(false);

  const selectedAccounts = accounts.filter(({ caipAccountId }) =>
    selectedAccountAddresses.some((selectedAccountAddress) =>
      isEqualCaseInsensitive(selectedAccountAddress, caipAccountId),
    ),
  );
  const selectedNetworks = allNetworks.filter(({ caipChainId }) =>
    selectedChainIds.includes(caipChainId),
  );

  const selectedChainIdsLength = selectedChainIds.length;

  // Determine the messages for connected and not connected states
  const accountMessageConnectedState =
    selectedAccounts.length === 1
      ? t('connectedWithAccountName', [
          selectedAccounts[0].metadata.name || selectedAccounts[0].label, // TODO Wallet UX?: Migrate to new account group name
        ])
      : t('connectedWithAccount', [selectedAccounts.length]);
  const accountMessageNotConnectedState =
    selectedAccounts.length === 1
      ? t('requestingForAccount', [
          selectedAccounts[0].metadata.name || selectedAccounts[0].label, // TODO Wallet UX?: Migrate to new account group name,
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
            selectedAccounts.length === 1 ? (
              <AvatarAccount
                address={selectedAccounts[0].address}
                size={AvatarAccountSize.Xs}
                borderColor={BorderColor.transparent}
              />
            ) : (
              <SiteCellTooltip accounts={selectedAccounts} />
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
        <EditAccountsModal
          accounts={accounts}
          defaultSelectedAccountAddresses={selectedAccountAddresses}
          onClose={() => setShowEditAccountsModal(false)}
          onSubmit={onSelectAccountAddresses}
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
