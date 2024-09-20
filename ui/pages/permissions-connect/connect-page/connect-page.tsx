import React, { useState } from 'react';
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
import { AccountType } from '../../../components/multichain/pages/review-permissions-page/review-permission.types';

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
  activeTabOrigin: string;
};

export const ConnectPage: React.FC<ConnectPageProps> = ({
  request,
  permissionsRequestId,
  rejectPermissionsRequest,
  approveConnection,
  accounts,
  activeTabOrigin,
}) => {
  const t = useI18nContext();

  const testNetworks = useSelector(getTestNetworks);
  const nonTestNetworks = useSelector(getNonTestNetworks);
  const defaultSelectedChainIds = nonTestNetworks.map(({ chainId }) => chainId);
  const [selectedChainIds, setSelectedChainIds] = useState(
    defaultSelectedChainIds,
  );

  const currentAccount = useSelector(getSelectedInternalAccount);
  const defaultAccountsAddresses = [currentAccount?.address];
  const [selectedAccountAddresses, setSelectedAccountAddresses] = useState(
    defaultAccountsAddresses,
  );

  const onConfirm = () => {
    const _request = {
      ...request,
      approvedAccounts: selectedAccountAddresses,
      approvedChainIds: selectedChainIds,
    };
    approveConnection(_request);
  };

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
          nonTestNetworks={nonTestNetworks}
          testNetworks={testNetworks}
          accounts={accounts}
          onSelectAccountAddresses={setSelectedAccountAddresses}
          onSelectChainIds={setSelectedChainIds}
          selectedAccountAddresses={selectedAccountAddresses}
          selectedChainIds={selectedChainIds}
          activeTabOrigin={activeTabOrigin}
          isConnectFlow
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
            disabled={
              selectedAccountAddresses.length === 0 ||
              selectedChainIds.length === 0
            }
          >
            {t('confirm')}
          </Button>
        </Box>
      </Footer>
    </Page>
  );
};
