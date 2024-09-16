import React from 'react';
import { useSelector } from 'react-redux';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  getNonTestNetworks,
  getSelectedInternalAccount,
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
import { AccountType } from '../../../components/multichain/pages/connections/components/connections.types';

type Request = {
  id: string;
  origin: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any; // Adjust this if you have a more specific shape for the request
};

type ConnectPageProps = {
  request: Request;
  permissionsRequestId: string;
  rejectPermissionsRequest: (id: string) => void;
  approveConnection: (request: Request) => void;
  accounts: AccountType[];
  selectAccounts: (addresses: Set<string>) => void;
  selectedAccounts: Set<string>;
  selectChainIds: (chainIds: Set<string>) => void;
  selectedChainIds: Set<string>;
  activeTabOrigin: string;
};

export const ConnectPage: React.FC<ConnectPageProps> = ({
  request,
  permissionsRequestId,
  rejectPermissionsRequest,
  approveConnection,
  accounts,
  selectAccounts,
  selectedAccounts,
  selectChainIds,
  selectedChainIds,
  activeTabOrigin,
}) => {
  const t = useI18nContext();

  // Get networks and accounts from Redux
  const networksList = useSelector(getNonTestNetworks);
  // const selectedNetworksList = useSelector(
  //   getSelectedNetworksForDappConnection,
  // );
  const testNetworks = useSelector(getTestNetworks);
  const combinedNetworks = [...networksList, ...testNetworks];

  const currentAccount = useSelector(getSelectedInternalAccount);

  // const selectedAccountsForDappConnection = useSelector(
  //   getSelectedAccountsForDappConnection,
  // );

  // Filter networks based on chainId
  const filteredNetworks = combinedNetworks.filter((network) =>
    selectedChainIds.has(network.chainId),
  );

  // Select approved accounts and networks
  const _selectedAccounts = Array.from(selectedAccounts);
  const approvedAccounts =
    _selectedAccounts.length > 0
      ? _selectedAccounts
      : [currentAccount?.address];

  const approvedChainIds = filteredNetworks.map((network) => network.chainId);

  // Handle confirmation
  const onConfirm = () => {
    const _request = {
      ...request,
      approvedAccounts,
      approvedChainIds,
    };
    approveConnection(_request);
  };

  // Filter accounts by address
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
        <Text>{t('connectionDescription')}: </Text>
      </Header>
      <Content padding={0}>
        <SiteCell
          networks={filteredNetworks}
          accounts={filterAccountsByAddress}
          onAccountsClick={() => {}}
          onNetworksClick={() => {}}
          setSelectedAccounts={(accounts) => selectAccounts(new Set(accounts))}
          setSelectedChainIds={(chainIds) => selectChainIds(new Set(chainIds))}
          selectedAccounts={approvedAccounts}
          selectedChainIds={approvedChainIds}
          activeTabOrigin={activeTabOrigin}
          combinedNetworks={networksList}
          onDisconnectClick={() => null}
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
