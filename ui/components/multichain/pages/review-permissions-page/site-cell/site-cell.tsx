import React, { useState } from 'react';
import { BorderColor } from '../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import {
  AvatarAccount,
  AvatarAccountSize,
  IconName,
} from '../../../../component-library';
import { EditAccountsModal, EditNetworksModal } from '../../..';
import { MergedInternalAccount } from '../../../../../selectors/selectors.types';
import { SiteCellTooltip } from './site-cell-tooltip';
import { SiteCellConnectionListItem } from './site-cell-connection-list-item';

// Define types for networks, accounts, and other props
type Network = {
  name: string;
  chainId: string;
};

type SiteCellProps = {
  nonTestNetworks: Network[];
  testNetworks: Network[];
  accounts: MergedInternalAccount[];
  onSelectAccountAddresses: (addresses: string[]) => void;
  onSelectChainIds: (chainIds: string[]) => void;
  selectedAccountAddresses: string[];
  selectedChainIds: string[];
  activeTabOrigin: string;
  isConnectFlow?: boolean;
};

export const SiteCell: React.FC<SiteCellProps> = ({
  nonTestNetworks,
  testNetworks,
  accounts,
  onSelectAccountAddresses,
  onSelectChainIds,
  selectedAccountAddresses,
  selectedChainIds,
  activeTabOrigin,
  isConnectFlow,
}) => {
  const t = useI18nContext();

  const allNetworks = [...nonTestNetworks, ...testNetworks];

  const [showEditAccountsModal, setShowEditAccountsModal] = useState(false);
  const [showEditNetworksModal, setShowEditNetworksModal] = useState(false);

  const selectedAccounts = accounts.filter(({ address }) =>
    selectedAccountAddresses.includes(address),
  );
  const selectedNetworks = allNetworks.filter(({ chainId }) =>
    selectedChainIds.includes(chainId),
  );

  // Determine the messages for connected and not connected states
  const accountMessageConnectedState =
    selectedAccounts.length === 1
      ? t('connectedWithAccount', [
          selectedAccounts[0].label || selectedAccounts[0].metadata.name,
        ])
      : t('connectedWith');
  const accountMessageNotConnectedState =
    selectedAccounts.length === 1
      ? t('requestingForAccount', [
          selectedAccounts[0].label || selectedAccounts[0].metadata.name,
        ])
      : t('requestingFor');

  return (
    <>
      <SiteCellConnectionListItem
        title={t('accountsPermissionsTitle')}
        iconName={IconName.Wallet}
        connectedMessage={accountMessageConnectedState}
        unconnectedMessage={accountMessageNotConnectedState}
        isConnectFlow={isConnectFlow}
        onClick={() => setShowEditAccountsModal(true)}
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
        connectedMessage={t('connectedWith')}
        unconnectedMessage={t('requestingFor')}
        isConnectFlow={isConnectFlow}
        onClick={() => setShowEditNetworksModal(true)}
        content={<SiteCellTooltip networks={selectedNetworks} />}
      />

      {showEditAccountsModal && (
        <EditAccountsModal
          activeTabOrigin={activeTabOrigin}
          accounts={accounts}
          defaultSelectedAccountAddresses={selectedAccountAddresses}
          onClose={() => setShowEditAccountsModal(false)}
          onSubmit={onSelectAccountAddresses}
        />
      )}

      {showEditNetworksModal && (
        <EditNetworksModal
          activeTabOrigin={activeTabOrigin}
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
