import React, { useContext, useMemo, useState } from 'react';
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
  AvatarBase,
  AvatarBaseSize,
  AvatarFavicon,
  AvatarFaviconSize,
  Box,
  Button,
  ButtonLink,
  ButtonLinkSize,
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
  AlignItems,
  BackgroundColor,
  BlockSize,
  BorderRadius,
  Display,
  FlexDirection,
  JustifyContent,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { TEST_CHAINS } from '../../../../shared/constants/network';
import { getMultichainNetwork } from '../../../selectors/multichain';
import { Tab, Tabs } from '../../../components/ui/tabs';
import {
  AccountListItem,
  EditAccountsModal,
} from '../../../components/multichain';
import {
  getAvatarFallbackLetter,
  isIpAddress,
  transformOriginToTitle,
} from '../../../helpers/utils/util';
import ZENDESK_URLS from '../../../helpers/constants/zendesk-url';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  getCaip25PermissionsResponse,
  PermissionsRequest,
  getRequestedCaip25CaveatValue,
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
  targetSubjectMetadata: {
    extensionId: string | null;
    iconUrl: string | null;
    name: string;
    origin: string;
    subjectType: string;
  };
};

export const ConnectPage: React.FC<ConnectPageProps> = ({
  request,
  permissionsRequestId,
  rejectPermissionsRequest,
  approveConnection,
  targetSubjectMetadata,
}) => {
  const t = useI18nContext();
  const trackEvent = useContext(MetaMetricsContext);

  const requestedCaip25CaveatValue = getRequestedCaip25CaveatValue(
    request.permissions,
  );
  const requestedAccounts = getEthAccounts(requestedCaip25CaveatValue);
  const requestedChainIds = getPermittedEthChainIds(requestedCaip25CaveatValue);

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

  const [showEditAccountsModal, setShowEditAccountsModal] = useState(false);

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
          requestedCaip25CaveatValue,
          selectedAccountAddresses as Hex[],
          selectedChainIds,
        ),
      },
    };
    approveConnection(_request);
  };

  const selectedAccounts = accounts.filter(({ address }) =>
    selectedAccountAddresses.some((selectedAccountAddress) =>
      isEqualCaseInsensitive(selectedAccountAddress, address),
    ),
  );

  const title = transformOriginToTitle(targetSubjectMetadata.origin);

  const handleOpenAccountsModal = () => {
    setShowEditAccountsModal(true);
    trackEvent({
      category: MetaMetricsEventCategory.Navigation,
      event: MetaMetricsEventName.ViewPermissionedAccounts,
      properties: {
        location:
          'Connect view (accounts tab), Permissions toast, Permissions (dapp)',
      },
    });
  };

  return (
    <Page
      data-testid="connect-page"
      className="main-container connect-page"
      backgroundColor={BackgroundColor.backgroundAlternative}
    >
      <Header paddingBottom={0}>
        <Box
          display={Display.Flex}
          justifyContent={JustifyContent.center}
          marginBottom={2}
        >
          {targetSubjectMetadata.iconUrl ? (
            <>
              <Box
                style={{
                  filter: 'blur(20px) brightness(1.2)',
                  position: 'absolute',
                }}
              >
                <AvatarFavicon
                  backgroundColor={BackgroundColor.backgroundAlternative}
                  size={AvatarFaviconSize.Xl}
                  src={targetSubjectMetadata.iconUrl}
                  name={title}
                />
              </Box>
              <AvatarFavicon
                backgroundColor={BackgroundColor.backgroundAlternative}
                size={AvatarFaviconSize.Lg}
                src={targetSubjectMetadata.iconUrl}
                name={title}
                style={{ zIndex: 1, background: 'transparent' }}
              />
            </>
          ) : (
            <AvatarBase
              size={AvatarBaseSize.Lg}
              display={Display.Flex}
              alignItems={AlignItems.center}
              justifyContent={JustifyContent.center}
              color={TextColor.textAlternative}
              style={{ borderWidth: '0px' }}
              backgroundColor={BackgroundColor.backgroundAlternativeSoft}
            >
              {isIpAddress(title) ? '?' : getAvatarFallbackLetter(title)}
            </AvatarBase>
          )}
        </Box>
        <Text variant={TextVariant.headingLg} marginTop={2} marginBottom={2}>
          {title}
        </Text>
        <Box display={Display.Flex} justifyContent={JustifyContent.center}>
          <Text>{t('connectionDescription')}</Text>
          <ButtonLink
            paddingLeft={1}
            key="permission-connect-footer-learn-more-link"
            size={ButtonLinkSize.Inherit}
            target="_blank"
            onClick={() => {
              global.platform.openTab({
                url: ZENDESK_URLS.USER_GUIDE_DAPPS,
              });
            }}
          >
            {t('learnMoreUpperCase')}
          </ButtonLink>
        </Box>
      </Header>
      <Content
        paddingLeft={4}
        paddingRight={4}
        backgroundColor={BackgroundColor.transparent}
      >
        <Tabs
          onTabClick={() => null}
          backgroundColor={BackgroundColor.transparent}
          justifyContent={JustifyContent.center}
          defaultActiveTabKey="accounts"
          tabListProps={{
            backgroundColor: BackgroundColor.transparent,
          }}
        >
          <Tab
            name={t('accounts')}
            tabKey="accounts"
            width={BlockSize.Full}
            data-testid="accounts-tab"
          >
            <Box marginTop={4}>
              <Box
                backgroundColor={BackgroundColor.backgroundDefault}
                borderRadius={BorderRadius.XL}
                style={{
                  overflow: 'auto',
                  maxHeight: '268px',
                  scrollbarColor: 'var(--color-icon-muted) transparent',
                }}
              >
                {selectedAccounts.map((account) => (
                  <AccountListItem
                    account={account}
                    key={account.address}
                    selected={false}
                  />
                ))}
                {selectedAccounts.length === 0 && (
                  <Box
                    className="connect-page__accounts-empty"
                    display={Display.Flex}
                    justifyContent={JustifyContent.center}
                    alignItems={AlignItems.center}
                    borderRadius={BorderRadius.XL}
                  >
                    <ButtonLink
                      onClick={() => handleOpenAccountsModal()}
                      data-testid="edit"
                    >
                      {t('selectAccountToConnect')}
                    </ButtonLink>
                  </Box>
                )}
              </Box>
              {selectedAccounts.length > 0 && (
                <Box
                  marginTop={4}
                  display={Display.Flex}
                  justifyContent={JustifyContent.center}
                >
                  <ButtonLink
                    onClick={() => handleOpenAccountsModal()}
                    data-testid="edit"
                  >
                    {t('editAccounts')}
                  </ButtonLink>
                </Box>
              )}
              {showEditAccountsModal && (
                <EditAccountsModal
                  accounts={evmAccounts}
                  defaultSelectedAccountAddresses={selectedAccountAddresses}
                  onClose={() => setShowEditAccountsModal(false)}
                  onSubmit={setSelectedAccountAddresses}
                />
              )}
            </Box>
          </Tab>
          <Tab
            name={t('permissions')}
            tabKey="permissions"
            width={BlockSize.Full}
            data-testid="permissions-tab"
          >
            <Box marginTop={4}>
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
            </Box>
          </Tab>
        </Tabs>
      </Content>
      <Footer>
        <Box
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
          gap={4}
          width={BlockSize.Full}
        >
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
