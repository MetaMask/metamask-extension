import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  getNonTestNetworks,
  getSelectedAccountsForDappConnection,
  getSelectedInternalAccount,
  getSelectedNetworksForDappConnection,
  getTestNetworks,
} from '../../../selectors';
import {
  Box,
  Button,
  ButtonSize,
  ButtonVariant,
  Text,
} from '../../../components/component-library';
import {
  Content,
  Footer,
  Header,
  Page,
} from '../../../components/multichain/pages/page';
import { SiteCell } from '../../../components/multichain/pages/review-permissions-page';
import {
  BlockSize,
  Display,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { PermissionNames } from '../../../../app/scripts/controllers/permissions/specifications';

export const ConnectPage = ({
  request,
  rejectPermissionsRequest,
  approveConnection,
  accounts,
  selectAccounts,
  selectedAccountAddresses,
  activeTabOrigin,
  permissionsRequestId,
}: {
  request: any;
  permissionsRequestId: string;
  rejectPermissionsRequest: () => void;
  approveConnection: (request: any) => void;
  accounts: any[];
  selectAccounts: (addresses: any[]) => void;
  selectedAccountAddresses: Set<string>;
  activeTabOrigin: string;
}) => {
  const t = useI18nContext();
  const networksList = useSelector(getNonTestNetworks);
  const selectednetworksList = useSelector(
    getSelectedNetworksForDappConnection,
  );
  const testNetworks = useSelector(getTestNetworks);
  const combinedNetworks = [...networksList, ...testNetworks];

  const currentAccount = useSelector(getSelectedInternalAccount);
  const [selectedAccounts, setSelectedAccounts] = useState(
    selectedAccountAddresses,
  );

  const selectedAccountsForDappConnection = useSelector(
    getSelectedAccountsForDappConnection,
  );

  // Handle account selection/deselection
  const handleAccountClick = (address: string) => {
    const newSelectedAccounts = new Set(selectedAccounts);
    if (newSelectedAccounts.has(address)) {
      newSelectedAccounts.delete(address);
    } else {
      newSelectedAccounts.add(address);
    }
    setSelectedAccounts(newSelectedAccounts);
  };
  // Filter networks based on chainId
  const filteredNetworks = Array.isArray(selectednetworksList)
    ? combinedNetworks.filter((network) =>
        selectednetworksList.includes(network.chainId),
      )
    : networksList;

  // Select approved accounts and networks
  const approvedAccounts =
    selectedAccountsForDappConnection.length > 0
      ? selectedAccountsForDappConnection
      : [currentAccount.address];

  // Handle confirmation
  const onConfirm = () => {
    const _request = {
      ...request,
      approvedAccounts,
      approvedChainIds: filteredNetworks.map((network) => network.chainId),
    };
    approveConnection(_request);
  };

  const filterAccountsByAddress = accounts.filter((account) =>
    approvedAccounts.includes(account.address),
  );

  return (
    <Page
      data-testid="connections-page"
      className="main-container connections-page"
    >
      <Header>
        <Text variant={TextVariant.headingLg}>{t('connectWithMetaMask')}</Text>
        <Text>This site wants to: </Text>
      </Header>
      <Content padding={0}>
        <SiteCell
          networks={filteredNetworks}
          accounts={filterAccountsByAddress}
          onAccountsClick={() => selectAccounts(Array.from(selectedAccounts))}
          onNetworksClick={() => console.log('testing')}
          approvedAccounts={approvedAccounts}
          activeTabOrigin={activeTabOrigin}
          combinedNetworks={networksList}
        />
      </Content>
      <Footer>
        <Box display={Display.Flex} gap={4} width={BlockSize.Full}>
          <Button
            block
            variant={ButtonVariant.Secondary}
            size={ButtonSize.Lg}
            data-testid="cancel-btn"
            onClick={() => rejectPermissionsRequest(permissionsRequestId)}
          >
            {t('cancel')}
          </Button>
          <Button
            block
            data-testid="confirm-btn"
            size={ButtonSize.Lg}
            onClick={onConfirm}
          >
            {t('confirm')}
          </Button>
        </Box>
      </Footer>
    </Page>
  );
};
