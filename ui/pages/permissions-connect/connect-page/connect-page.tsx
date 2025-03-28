import React, { useContext, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { NetworkConfiguration } from '@metamask/network-controller';
import { isEqualCaseInsensitive } from '@metamask/controller-utils';
import {
  generateCaip25Caveat,
  getUniqueArrayItems,
} from '@metamask/chain-agnostic-permission';
import {
  CaipAccountId,
  CaipChainId,
  CaipNamespace,
  CaipReference,
  parseCaipAccountId,
  parseCaipChainId,
} from '@metamask/utils';

import { useI18nContext } from '../../../hooks/useI18nContext';
import { getUpdatedAndSortedAccounts } from '../../../selectors';
import { getAllNetworkConfigurationsByCaipChainId } from '../../../../shared/modules/selectors/networks';
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
import { hexToDecimal } from '../../../../shared/modules/conversion.utils';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { MergedInternalAccount } from '../../../selectors/selectors.types';
import {
  PermissionsRequest,
  getRequestedCaip25CaveatValue,
  getDefaultAccounts,
  getAllRequestedAccounts,
  getAllRequestedChainIds,
} from './utils';

// put this here because of some circular dependency issue
export const caipFormattedTestChains = TEST_CHAINS.map(
  (chainId) => `eip155:${hexToDecimal(chainId)}`,
);

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
  const requestedCaipAccountIds = getAllRequestedAccounts(
    requestedCaip25CaveatValue,
  );
  const requestedCaipChainIds = getAllRequestedChainIds(
    requestedCaip25CaveatValue,
  );

  const networkConfigurationsByCaipChainId = useSelector(
    getAllNetworkConfigurationsByCaipChainId,
  );

  const [nonTestNetworkConfigurations, testNetworkConfigurations] = useMemo(
    () =>
      Object.entries(networkConfigurationsByCaipChainId).reduce(
        ([nonTestNetworksList, testNetworksList], [chainId, network]) => {
          const caipChainId = chainId as CaipChainId;
          const isTestNetwork = caipFormattedTestChains.includes(caipChainId);
          (isTestNetwork ? testNetworksList : nonTestNetworksList).push({
            ...network,
            caipChainId,
          });
          return [nonTestNetworksList, testNetworksList];
        },
        [
          [] as (NetworkConfiguration & { caipChainId: CaipChainId })[],
          [] as (NetworkConfiguration & { caipChainId: CaipChainId })[],
        ],
      ),
    [networkConfigurationsByCaipChainId],
  );

  const allNetworksList = [
    ...nonTestNetworkConfigurations,
    ...testNetworkConfigurations,
  ].map(({ caipChainId }) => caipChainId);

  const supportedRequestedCaipChainIds = requestedCaipChainIds.filter(
    (caipChainId) => allNetworksList.includes(caipChainId as CaipChainId),
  );

  const [showEditAccountsModal, setShowEditAccountsModal] = useState(false);

  // By default, if a non test network is the globally selected network. We will only show non test networks as default selected.
  const currentlySelectedNetwork = useSelector(getMultichainNetwork);
  const currentlySelectedNetworkChainId =
    currentlySelectedNetwork.network.chainId;
  // If globally selected network is a test network, include that in the default selected networks for connection request
  const selectedTestNetwork = testNetworkConfigurations.find(
    (network: { caipChainId: CaipChainId }) =>
      network.caipChainId === currentlySelectedNetworkChainId,
  );

  const defaultSelectedNetworkList = selectedTestNetwork
    ? [...nonTestNetworkConfigurations, selectedTestNetwork].map(
        ({ caipChainId }) => caipChainId,
      )
    : nonTestNetworkConfigurations.map(({ caipChainId }) => caipChainId);

  const defaultSelectedChainIds =
    supportedRequestedCaipChainIds.length > 0
      ? supportedRequestedCaipChainIds
      : defaultSelectedNetworkList;

  const [selectedChainIds, setSelectedChainIds] = useState<CaipChainId[]>(
    defaultSelectedChainIds as CaipChainId[],
  );

  const allAccounts = useSelector(
    getUpdatedAndSortedAccounts,
  ) as MergedInternalAccount[];

  const allAccountsWithCaipAccountId = allAccounts.map((account) => {
    // I hope we can reliably use the first scope to determine the namespace
    const { namespace, reference } = parseCaipChainId(account.scopes[0]);
    return {
      internalAccount: account,
      caipAccountId:
        `${namespace}:${reference}:${account.address}` as CaipAccountId,
    };
  });

  const requestedNamespaces = getUniqueArrayItems([
    ...Object.keys(requestedCaip25CaveatValue.requiredScopes).map((scope) => {
      const scopeString = scope as `${CaipNamespace}:${CaipReference}`;
      return parseCaipChainId(scopeString).namespace;
    }),
    ...Object.keys(requestedCaip25CaveatValue.optionalScopes).map((scope) => {
      const scopeString = scope as `${CaipNamespace}:${CaipReference}`;
      return parseCaipChainId(scopeString).namespace;
    }),
  ]);

  // all accounts that match the requested namespaces
  const supportedAccountsForRequestedNamespaces =
    allAccountsWithCaipAccountId.filter((account) => {
      const {
        chain: { namespace },
      } = parseCaipAccountId(account.caipAccountId);
      return requestedNamespaces.includes(namespace);
    });

  // all requested accounts that are found in the wallet
  const supportedRequestedAccounts = Array.from(requestedCaipAccountIds).reduce(
    (acc, account) => {
      const supportedRequestedAccount =
        supportedAccountsForRequestedNamespaces.find(({ caipAccountId }) =>
          isEqualCaseInsensitive(caipAccountId, account),
        );
      if (supportedRequestedAccount) {
        acc.push(supportedRequestedAccount);
      }
      return acc;
    },
    [] as {
      internalAccount: MergedInternalAccount;
      caipAccountId: CaipAccountId;
    }[],
  );

  // TODO use currentAccount as well to determine default accounts
  // const currentAccount = useSelector(getSelectedInternalAccount);
  const defaultAccounts = getDefaultAccounts(
    requestedNamespaces,
    supportedRequestedAccounts,
    supportedAccountsForRequestedNamespaces,
  );

  const defaultCaip10AccountAddresses = defaultAccounts.map(
    ({ caipAccountId }) => caipAccountId,
  );

  const [selectedCaip10AccountAddresses, setSelectedCaip10AccountAddresses] =
    useState(defaultCaip10AccountAddresses);

  const selectedAccounts = allAccountsWithCaipAccountId.filter(
    ({ caipAccountId }) =>
      selectedCaip10AccountAddresses.includes(caipAccountId),
  );

  console.log({
    nonTestNetworkConfigurations,
    testNetworkConfigurations,
    selectedChainIds,
  });

  const onConfirm = () => {
    const _request = {
      ...request,
      permissions: {
        ...request.permissions,
        ...generateCaip25Caveat(
          requestedCaip25CaveatValue,
          selectedCaip10AccountAddresses,
          selectedChainIds,
        ),
      },
    };
    approveConnection(_request);
  };

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
                    account={account.internalAccount}
                    key={account.caipAccountId}
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
                  accounts={allAccountsWithCaipAccountId}
                  defaultSelectedAccountAddresses={
                    selectedCaip10AccountAddresses
                  }
                  onClose={() => setShowEditAccountsModal(false)}
                  onSubmit={setSelectedCaip10AccountAddresses}
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
                nonTestNetworks={nonTestNetworkConfigurations}
                testNetworks={testNetworkConfigurations}
                accounts={allAccountsWithCaipAccountId}
                onSelectAccountAddresses={setSelectedCaip10AccountAddresses}
                onSelectChainIds={setSelectedChainIds}
                selectedAccountAddresses={selectedCaip10AccountAddresses}
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
                selectedCaip10AccountAddresses.length === 0 ||
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
