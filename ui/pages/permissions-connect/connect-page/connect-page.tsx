import React, { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { InternalAccount, isEvmAccountType } from '@metamask/keyring-api';
import { NetworkConfiguration } from '@metamask/network-controller';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  getInternalAccounts,
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
import { MergedInternalAccount } from '../../../selectors/selectors.types';
import { mergeAccounts } from '../../../components/multichain/account-list-menu/account-list-menu';
import { TEST_CHAINS } from '../../../../shared/constants/network';
import PermissionsConnectFooter from '../../../components/app/permissions-connect-footer';
import {
  CaveatTypes,
  EndowmentTypes,
  RestrictedMethods,
} from '../../../../shared/constants/permissions';
import { getMultichainNetwork } from '../../../selectors/multichain';

export type ConnectPageRequest = {
  id: string;
  origin: string;
  permissions?: Record<
    string,
    { caveats?: { type: string; value: string[] }[] }
  >;
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

  const ethAccountsPermission =
    request?.permissions?.[RestrictedMethods.eth_accounts];
  const requestedAccounts =
    ethAccountsPermission?.caveats?.find(
      (caveat) => caveat.type === CaveatTypes.restrictReturnedAccounts,
    )?.value || [];

  const permittedChainsPermission =
    request?.permissions?.[EndowmentTypes.permittedChains];
  const requestedChainIds =
    permittedChainsPermission?.caveats?.find(
      (caveat) => caveat.type === CaveatTypes.restrictNetworkSwitching,
    )?.value || [];

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
  // If globally selected network is a test network, include that in the default selcted networks for connection request
  const selectedTestNetwork = testNetworks.find(
    (network: { chainId: string }) =>
      network.chainId === currentlySelectedNetworkChainId,
  );

  const selectedNetworksList = selectedTestNetwork
    ? [...nonTestNetworks, selectedTestNetwork]
    : nonTestNetworks;
  const defaultSelectedChainIds =
    requestedChainIds.length > 0
      ? requestedChainIds
      : selectedNetworksList.map(({ chainId }) => chainId);
  const [selectedChainIds, setSelectedChainIds] = useState(
    defaultSelectedChainIds,
  );

  const accounts = useSelector(getUpdatedAndSortedAccounts);
  const internalAccounts = useSelector(getInternalAccounts);
  const mergedAccounts: MergedInternalAccount[] = useMemo(() => {
    return mergeAccounts(accounts, internalAccounts).filter(
      (account: InternalAccount) => isEvmAccountType(account.type),
    );
  }, [accounts, internalAccounts]);

  const currentAccount = useSelector(getSelectedInternalAccount);
  const currentAccountAddress = isEvmAccountType(currentAccount.type)
    ? [currentAccount.address]
    : []; // We do not support non-EVM accounts connections
  const defaultAccountsAddresses =
    requestedAccounts.length > 0 ? requestedAccounts : currentAccountAddress;
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
          accounts={mergedAccounts}
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
