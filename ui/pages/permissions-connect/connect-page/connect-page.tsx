import React, { useCallback, useContext, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { generateCaip25Caveat } from '@metamask/chain-agnostic-permission';
import {
  CaipAccountId,
  CaipChainId,
  KnownCaipNamespace,
  parseCaipAccountId,
  parseCaipChainId,
} from '@metamask/utils';

import { useI18nContext } from '../../../hooks/useI18nContext';
import { getUpdatedAndSortedAccountsWithCaipAccountId } from '../../../selectors';
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
  TextAlign,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { CAIP_FORMATTED_EVM_TEST_CHAINS } from '../../../../shared/constants/network';
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
  EvmAndMultichainNetworkConfigurationsWithCaipChainId,
  MergedInternalAccountWithCaipAccountId,
} from '../../../selectors/selectors.types';
import {
  getAllNonWalletNamespacesFromCaip25CaveatValue,
  getAllScopesFromCaip25CaveatValue,
} from '../../../../shared/lib/multichain/chain-agnostic-permission-utils/caip-chainids';
import { getCaipAccountIdsFromCaip25CaveatValue } from '../../../../shared/lib/multichain/chain-agnostic-permission-utils/caip-accounts';
import { isEqualCaseInsensitive } from '../../../../shared/modules/string-utils';
import { CreateSolanaAccountModal } from '../../../components/multichain/create-solana-account-modal/create-solana-account-modal';
import {
  PermissionsRequest,
  getRequestedCaip25CaveatValue,
  getDefaultAccounts,
} from './utils';

export type ConnectPageRequest = {
  id: string;
  origin: string;
  permissions?: PermissionsRequest;
  metadata?: {
    promptToCreateSolanaAccount?: boolean;
  };
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

  const requestedCaipAccountIds = getCaipAccountIdsFromCaip25CaveatValue(
    requestedCaip25CaveatValue,
  );
  const requestedCaipChainIds = getAllScopesFromCaip25CaveatValue(
    requestedCaip25CaveatValue,
  );

  const promptToCreateSolanaAccount =
    request.metadata?.promptToCreateSolanaAccount;

  const networkConfigurationsByCaipChainId = useSelector(
    getAllNetworkConfigurationsByCaipChainId,
  );

  const [nonTestNetworkConfigurations, testNetworkConfigurations] = useMemo(
    () =>
      Object.entries(networkConfigurationsByCaipChainId).reduce(
        ([nonTestNetworksList, testNetworksList], [chainId, network]) => {
          const caipChainId = chainId as CaipChainId;
          const isTestNetwork =
            CAIP_FORMATTED_EVM_TEST_CHAINS.includes(caipChainId);
          (isTestNetwork ? testNetworksList : nonTestNetworksList).push({
            ...network,
            caipChainId,
          });
          return [nonTestNetworksList, testNetworksList];
        },
        [
          [] as EvmAndMultichainNetworkConfigurationsWithCaipChainId[],
          [] as EvmAndMultichainNetworkConfigurationsWithCaipChainId[],
        ],
      ),
    [networkConfigurationsByCaipChainId],
  );

  const allNetworksList = useMemo(
    () =>
      [...nonTestNetworkConfigurations, ...testNetworkConfigurations].map(
        ({ caipChainId }) => caipChainId,
      ),
    [nonTestNetworkConfigurations, testNetworkConfigurations],
  );

  const supportedRequestedCaipChainIds = requestedCaipChainIds.filter(
    (caipChainId) => allNetworksList.includes(caipChainId as CaipChainId),
  );

  const [showEditAccountsModal, setShowEditAccountsModal] = useState(false);
  const [showCreateSolanaAccountModal, setShowCreateSolanaAccountModal] =
    useState(false);

  // By default, if a non test network is the globally selected network. We will only show non test networks as default selected.
  const currentlySelectedNetwork = useSelector(getMultichainNetwork);
  const currentlySelectedNetworkChainId = currentlySelectedNetwork.chainId;
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
    getUpdatedAndSortedAccountsWithCaipAccountId,
  ) as MergedInternalAccountWithCaipAccountId[];

  const requestedNamespaces = getAllNonWalletNamespacesFromCaip25CaveatValue(
    requestedCaip25CaveatValue,
  );

  // all accounts that match the requested namespaces
  const supportedAccountsForRequestedNamespaces = allAccounts.filter(
    (account) => {
      const {
        chain: { namespace },
      } = parseCaipAccountId(account.caipAccountId);
      return requestedNamespaces.includes(namespace);
    },
  );

  // all requested accounts that are found in the wallet
  const supportedRequestedAccounts = requestedCaipAccountIds.reduce(
    (acc, account) => {
      const supportedRequestedAccount =
        supportedAccountsForRequestedNamespaces.find(({ caipAccountId }) => {
          const {
            chain: { namespace },
          } = parseCaipAccountId(caipAccountId);
          // EIP155 (EVM) addresses are not case sensitive
          if (namespace === KnownCaipNamespace.Eip155) {
            return isEqualCaseInsensitive(caipAccountId, account);
          }
          return caipAccountId === account;
        });
      if (supportedRequestedAccount) {
        acc.push(supportedRequestedAccount);
      }
      return acc;
    },
    [] as MergedInternalAccountWithCaipAccountId[],
  );

  const defaultAccounts = getDefaultAccounts(
    requestedNamespaces,
    supportedRequestedAccounts,
    supportedAccountsForRequestedNamespaces,
  );

  const defaultCaipAccountAddresses = defaultAccounts.map(
    ({ caipAccountId }) => caipAccountId,
  );

  const [selectedCaipAccountAddresses, _setSelectedCaipAccountAddresses] =
    useState(defaultCaipAccountAddresses);

  const setSelectedCaipAccountAddresses = useCallback(
    (caipAccountAddresses: CaipAccountId[]) => {
      let updatedSelectedChains = [...selectedChainIds];

      caipAccountAddresses.forEach((caipAccountAddress) => {
        const {
          chain: { namespace: accountNamespace },
        } = parseCaipAccountId(caipAccountAddress);

        const existsSelectedChainForNamespace = updatedSelectedChains.some(
          (caipChainId) => {
            try {
              const { namespace: chainNamespace } =
                parseCaipChainId(caipChainId);
              return accountNamespace === chainNamespace;
            } catch (err) {
              return false;
            }
          },
        );

        if (!existsSelectedChainForNamespace) {
          const chainIdsForNamespace = allNetworksList.filter((caipChainId) => {
            try {
              const { namespace: chainNamespace } =
                parseCaipChainId(caipChainId);
              return accountNamespace === chainNamespace;
            } catch (err) {
              return false;
            }
          });

          updatedSelectedChains = [
            ...updatedSelectedChains,
            ...chainIdsForNamespace,
          ];
        }
      });

      setSelectedChainIds(updatedSelectedChains);
      _setSelectedCaipAccountAddresses(caipAccountAddresses);
    },
    [
      _setSelectedCaipAccountAddresses,
      selectedChainIds,
      setSelectedChainIds,
      allNetworksList,
    ],
  );

  const selectedAccounts = allAccounts.filter(({ caipAccountId }) => {
    return selectedCaipAccountAddresses.some((selectedCaipAccountId) => {
      return selectedCaipAccountId === caipAccountId;
    });
  });

  const solanaAccountExistsInWallet = useMemo(() => {
    return allAccounts.some(({ caipAccountId }) => {
      const { chain } = parseCaipAccountId(caipAccountId);
      return chain.namespace === KnownCaipNamespace.Solana;
    });
  }, [allAccounts]);

  const handleOpenAccountsModal = useCallback(() => {
    setShowEditAccountsModal(true);
    trackEvent({
      category: MetaMetricsEventCategory.Navigation,
      event: MetaMetricsEventName.ViewPermissionedAccounts,
      properties: {
        location:
          'Connect view (accounts tab), Permissions toast, Permissions (dapp)',
      },
    });
  }, [trackEvent]);

  const handleOpenCreateSolanaAccountModal = useCallback(() => {
    setShowCreateSolanaAccountModal(true);
  }, []);

  const handleCloseCreateSolanaAccountModal = useCallback(() => {
    setShowCreateSolanaAccountModal(false);
  }, []);

  const handleCloseEditAccountsModal = useCallback(() => {
    setShowEditAccountsModal(false);
  }, []);

  const handleCancelConnection = useCallback(() => {
    rejectPermissionsRequest(permissionsRequestId);
  }, [permissionsRequestId, rejectPermissionsRequest]);

  const onConfirm = useCallback(() => {
    const _request = {
      ...request,
      permissions: {
        ...request.permissions,
        ...generateCaip25Caveat(
          requestedCaip25CaveatValue,
          selectedCaipAccountAddresses,
          selectedChainIds,
        ),
      },
    };
    approveConnection(_request);
  }, [
    request,
    requestedCaip25CaveatValue,
    selectedCaipAccountAddresses,
    selectedChainIds,
    approveConnection,
  ]);

  const title = transformOriginToTitle(targetSubjectMetadata.origin);

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
                    key={account.caipAccountId}
                    selected={false}
                  />
                ))}
                {selectedAccounts.length === 0 &&
                  !promptToCreateSolanaAccount && (
                    <Box
                      className="connect-page__accounts-empty"
                      display={Display.Flex}
                      justifyContent={JustifyContent.center}
                      alignItems={AlignItems.center}
                      borderRadius={BorderRadius.XL}
                    >
                      <ButtonLink
                        onClick={handleOpenAccountsModal}
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
                    onClick={handleOpenAccountsModal}
                    data-testid="edit"
                  >
                    {t('editAccounts')}
                  </ButtonLink>
                </Box>
              )}
              {promptToCreateSolanaAccount && !solanaAccountExistsInWallet && (
                <Box
                  display={Display.Flex}
                  flexDirection={FlexDirection.Column}
                  justifyContent={JustifyContent.center}
                  alignItems={AlignItems.center}
                  marginTop={4}
                  gap={2}
                >
                  <Text
                    variant={TextVariant.bodyMd}
                    color={TextColor.textAlternative}
                    textAlign={TextAlign.Center}
                  >
                    {selectedAccounts.length === 0
                      ? t('solanaAccountRequired')
                      : t('solanaAccountRequested')}
                  </Text>
                  <Button
                    variant={ButtonVariant.Secondary}
                    width={BlockSize.Full}
                    size={ButtonSize.Lg}
                    onClick={handleOpenCreateSolanaAccountModal}
                    data-testid="create-solana-account"
                  >
                    {t('createSolanaAccount')}
                  </Button>
                </Box>
              )}
              {showCreateSolanaAccountModal && (
                <CreateSolanaAccountModal
                  onClose={handleCloseCreateSolanaAccountModal}
                />
              )}
              {showEditAccountsModal && (
                <EditAccountsModal
                  accounts={allAccounts}
                  defaultSelectedAccountAddresses={selectedCaipAccountAddresses}
                  onClose={handleCloseEditAccountsModal}
                  onSubmit={setSelectedCaipAccountAddresses}
                />
              )}
            </Box>
          </Tab>
          <Tab
            name={t('permissions')}
            tabKey="permissions"
            width={BlockSize.Full}
            data-testid="permissions-tab"
            disabled={
              promptToCreateSolanaAccount &&
              !solanaAccountExistsInWallet &&
              selectedAccounts.length === 0
            }
          >
            <Box marginTop={4}>
              <SiteCell
                nonTestNetworks={nonTestNetworkConfigurations}
                testNetworks={testNetworkConfigurations}
                accounts={allAccounts}
                onSelectAccountAddresses={setSelectedCaipAccountAddresses}
                onSelectChainIds={setSelectedChainIds}
                selectedAccountAddresses={selectedCaipAccountAddresses}
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
              onClick={handleCancelConnection}
            >
              {t('cancel')}
            </Button>
            <Button
              block
              data-testid="confirm-btn"
              size={ButtonSize.Lg}
              onClick={onConfirm}
              disabled={
                selectedCaipAccountAddresses.length === 0 ||
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
