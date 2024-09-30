import React, { useState } from 'react';
import { Hex } from '@metamask/utils';
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
  onSelectChainIds: (chainIds: Hex[]) => void;
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

  const selectedChainIdsLength = selectedChainIds.length;

  // Determine the messages for connected and not connected states
  const accountMessageConnectedState =
    selectedAccounts.length === 1
      ? t('connectedWithAccountName', [
          selectedAccounts[0].label || selectedAccounts[0].metadata.name,
        ])
      : t('connectedWithAccount', [accounts.length]);
  const accountMessageNotConnectedState =
    selectedAccounts.length === 1
      ? t('requestingForAccount', [
          selectedAccounts[0].label || selectedAccounts[0].metadata.name,
        ])
      : t('requestingFor');

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
          onClick={() => setShowEditAccountsModal(true)}
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
          connectedMessage={t('connectedWithNetworks', [
            selectedChainIdsLength,
          ])}
          unconnectedMessage={t('requestingFor')}
          isConnectFlow={isConnectFlow}
          onClick={() => setShowEditNetworksModal(true)}
          paddingTopValue={2}
          paddingBottomValue={0}
          content={<SiteCellTooltip networks={selectedNetworks} />}
        />
      </Box>
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
