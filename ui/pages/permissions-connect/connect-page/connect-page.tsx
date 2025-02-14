import React, { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { InternalAccount } from '@metamask/keyring-internal-api';
import { isEvmAccountType } from '@metamask/keyring-api';
import { NetworkConfiguration } from '@metamask/network-controller';
import { getEthAccounts, getPermittedEthChainIds } from '@metamask/multichain';
import { Hex } from '@metamask/utils';
import { isEqualCaseInsensitive } from '@metamask/controller-utils';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  getSelectedInternalAccount,
  getUpdatedAndSortedAccounts,
} from '../../../selectors';
import { getNetworkConfigurationsByChainId } from '../../../../shared/modules/selectors/networks';
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
import { SiteCell } from '../../../components/multichain/pages/review-permissions-page/site-cell/site-cell';
import {
  BackgroundColor,
  BlockSize,
  Display,
  FlexDirection,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { TEST_CHAINS } from '../../../../shared/constants/network';
import PermissionsConnectFooter from '../../../components/app/permissions-connect-footer';
import { getMultichainNetwork } from '../../../selectors/multichain';
import {
  getRequestedSessionScopes,
  getCaip25PermissionsResponse,
  PermissionsRequest,
} from './utils';

export type ConnectPageRequest = {
  id: string;
  origin: string;
  permissions?: PermissionsRequest;
};

export type ConnectPageProps = {
  request: ConnectPageRequest;
  permissionsRequestId: string;
  rejectPermissionsRequest: (id: string) => void;
  approveConnection: (request: ConnectPageRequest) => void;
  activeTabOrigin: string;
};

export const ConnectPage: React.FC<ConnectPageProps> = ({
  request,
  permissionsRequestId,
  rejectPermissionsRequest,
  approveConnection,
}) => {
  const t = useI18nContext();

  const requestedSessionsScopes = getRequestedSessionScopes(
    request.permissions,
  );
  const requestedAccounts = getEthAccounts(requestedSessionsScopes);
  const requestedChainIds = getPermittedEthChainIds(requestedSessionsScopes);

  const networkConfigurations = useSelector(getNetworkConfigurationsByChainId);
  const [nonTestNetworks, testNetworks] = useMemo(
    () =>
      Object.entries(networkConfigurations).reduce(
        ([nonTestNetworksList, testNetworksList], [chainId, network]) => {
          const isTest = (TEST_CHAINS as string[]).includes(chainId);
          (isTest ? testNetworksList : nonTestNetworksList).push(network);
          return [nonTestNetworksList, testNetworksList];
        },
        [[] as NetworkConfiguration[], [] as NetworkConfiguration[]],
      ),
    [networkConfigurations],
  );

  // By default, if a non test network is the globally selected network. We will only show non test networks as default selected.
  const currentlySelectedNetwork = useSelector(getMultichainNetwork);
  const currentlySelectedNetworkChainId =
    currentlySelectedNetwork.network.chainId;
  // If globally selected network is a test network, include that in the default selected networks for connection request
  const selectedTestNetwork = testNetworks.find(
    (network: { chainId: string }) =>
      network.chainId === currentlySelectedNetworkChainId,
  );

  const defaultSelectedNetworkList = selectedTestNetwork
    ? [...nonTestNetworks, selectedTestNetwork].map(({ chainId }) => chainId)
    : nonTestNetworks.map(({ chainId }) => chainId);

  const allNetworksList = [...nonTestNetworks, ...testNetworks].map(
    ({ chainId }) => chainId,
  );

  const supportedRequestedChainIds = requestedChainIds.filter((chainId) =>
    allNetworksList.includes(chainId),
  );

  const defaultSelectedChainIds =
    supportedRequestedChainIds.length > 0
      ? supportedRequestedChainIds
      : defaultSelectedNetworkList;

  const [selectedChainIds, setSelectedChainIds] = useState(
    defaultSelectedChainIds,
  );

  const accounts = useSelector(getUpdatedAndSortedAccounts);
  const evmAccounts = useMemo(() => {
    return accounts.filter((account: InternalAccount) =>
      isEvmAccountType(account.type),
    );
  }, [accounts]);

  const supportedRequestedAccounts = requestedAccounts.filter((account) =>
    evmAccounts.find(({ address }) => isEqualCaseInsensitive(address, account)),
  );

  const currentAccount = useSelector(getSelectedInternalAccount);
  const currentAccountAddress = isEvmAccountType(currentAccount.type)
    ? [currentAccount.address]
    : []; // We do not support non-EVM accounts connections
  const defaultAccountsAddresses =
    supportedRequestedAccounts.length > 0
      ? supportedRequestedAccounts
      : currentAccountAddress;
  const [selectedAccountAddresses, setSelectedAccountAddresses] = useState(
    defaultAccountsAddresses,
  );

  const onConfirm = () => {
    const _request = {
      ...request,
      permissions: {
        ...request.permissions,
        ...getCaip25PermissionsResponse(
          selectedAccountAddresses as Hex[],
          selectedChainIds,
        ),
      },
    };
    approveConnection(_request);
  };

  return (
    <Page
      data-testid="connect-page"
      className="main-container connect-page"
      backgroundColor={BackgroundColor.backgroundAlternative}
    >
      <Header paddingBottom={0}>
        <Text variant={TextVariant.headingLg}>{t('connectWithMetaMask')}</Text>
        <Text>{t('connectionDescription')}: </Text>
      </Header>
      <Content paddingLeft={4} paddingRight={4}>
        <SiteCell
          nonTestNetworks={nonTestNetworks}
          testNetworks={testNetworks}
          accounts={evmAccounts}
          onSelectAccountAddresses={setSelectedAccountAddresses}
          onSelectChainIds={setSelectedChainIds}
          selectedAccountAddresses={selectedAccountAddresses}
          selectedChainIds={selectedChainIds}
          isConnectFlow
        />
      </Content>
      <Footer>
        <Box
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
          gap={4}
          width={BlockSize.Full}
        >
          <PermissionsConnectFooter />
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
              {t('connect')}
            </Button>
          </Box>
        </Box>
      </Footer>
    </Page>
  );
};
