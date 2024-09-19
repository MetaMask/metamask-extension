import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { BorderColor } from '../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import {
  AvatarAccount,
  AvatarAccountSize,
  IconName,
} from '../../../../component-library';
import { EditAccountsModal, EditNetworksModal } from '../../..';
import { getPermittedAccountsByOrigin } from '../../../../../selectors/permissions';
import { AccountType } from '../../../connect-accounts-modal/connect-account-modal.types';
import { SiteCellTooltip } from './site-cell-tooltip';
import { SiteCellConnectionListItem } from './site-cell-connection-list-item';

// Define types for networks, accounts, and other props
type Network = {
  rpcPrefs?: { imageUrl?: string };
  nickname: string;
  chainId?: string;
};

type SiteCellProps = {
  networks: Network[];
  accounts: AccountType[];
  onAccountsClick: () => void;
  onNetworksClick: () => void;
  onDisconnectClick: () => void;
  approvedAccounts: string[];
  activeTabOrigin: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  combinedNetworks: any;
};

export const SiteCell: React.FC<SiteCellProps> = ({
  networks,
  accounts,
  onAccountsClick,
  onNetworksClick,
  approvedAccounts,
  activeTabOrigin,
  combinedNetworks,
  onDisconnectClick,
}) => {
  const t = useI18nContext();
  // Map networks and accounts to avatar data
  const avatarNetworksData = networks.map((network) => ({
    avatarValue: network.rpcPrefs?.imageUrl || '',
    symbol: network.nickname,
  }));

  const avatarAccountsData = accounts.map((account) => ({
    avatarValue: account.address,
  }));

  const [showEditAccountsModal, setShowEditAccountsModal] = useState(false);
  const [showEditNetworksModal, setShowEditNetworksModal] = useState(false);

  // Determine the messages for connected and not connected states
  const accountMessageConnectedState =
    accounts.length > 1
      ? t('connectedWith')
      : t('connectedWithAccount', [
          accounts[0].label || accounts[0].metadata.name,
        ]);
  const accountMessageNotConnectedState =
    accounts.length > 1
      ? t('requestingFor')
      : t('requestingForAccount', [
          accounts[0].label || accounts[0].metadata.name,
        ]);

  // Use selector to get permitted accounts by origin
  const permittedAccountsByOrigin = useSelector(
    getPermittedAccountsByOrigin,
    // TODO: Replace `any` with type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ) as { [key: string]: any[] };
  const currentTabHasNoAccounts =
    !permittedAccountsByOrigin[activeTabOrigin]?.length;

  return (
    <>
      <SiteCellConnectionListItem
        title={t('accountsPermissionsTitle')}
        iconName={IconName.Wallet}
        connectedMessage={accountMessageConnectedState}
        unconnectedMessage={accountMessageNotConnectedState}
        currentTabHasNoAccounts={currentTabHasNoAccounts}
        onClick={() => setShowEditAccountsModal(true)}
        content={
          accounts.length > 1 ? (
            <SiteCellTooltip
              accounts={accounts}
              avatarAccountsData={avatarAccountsData}
            />
          ) : (
            <AvatarAccount
              address={accounts[0].address}
              size={AvatarAccountSize.Xs}
              borderColor={BorderColor.transparent}
            />
          )
        }
      />

      <SiteCellConnectionListItem
        title={t('permission_walletSwitchEthereumChain')}
        iconName={IconName.Data}
        connectedMessage={t('connectedWith')}
        unconnectedMessage={t('requestingFor')}
        currentTabHasNoAccounts={currentTabHasNoAccounts}
        onClick={() => setShowEditNetworksModal(true)}
        content={
          <SiteCellTooltip
            networks={networks}
            avatarNetworksData={avatarNetworksData}
          />
        }
      />

      {showEditNetworksModal && (
        <EditNetworksModal
          onClose={() => setShowEditNetworksModal(false)}
          onClick={onNetworksClick}
          currentTabHasNoAccounts={currentTabHasNoAccounts}
          combinedNetworks={combinedNetworks}
          onDisconnectClick={onDisconnectClick}
        />
      )}

      {showEditAccountsModal && (
        <EditAccountsModal
          onClose={() => setShowEditAccountsModal(false)}
          onClick={onAccountsClick}
          approvedAccounts={approvedAccounts}
          activeTabOrigin={activeTabOrigin}
          currentTabHasNoAccounts={currentTabHasNoAccounts}
          onDisconnectClick={onDisconnectClick}
        />
      )}
    </>
  );
};
