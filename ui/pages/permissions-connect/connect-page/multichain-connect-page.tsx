import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useSelector } from 'react-redux';
import {
  generateCaip25Caveat,
  getAllScopesFromCaip25CaveatValue,
} from '@metamask/chain-agnostic-permission';
import {
  CaipAccountId,
  CaipChainId,
  KnownCaipNamespace,
  parseCaipChainId,
} from '@metamask/utils';

import { isEqual } from 'lodash';
import { AccountGroupObject } from '@metamask/account-tree-controller';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { getPermissions } from '../../../selectors';
import { getAllNetworkConfigurationsByCaipChainId } from '../../../../shared/modules/selectors/networks';
import {
  AvatarBase,
  AvatarBaseSize,
  AvatarFavicon,
  AvatarFaviconSize,
  Box,
  Button,
  ButtonLink,
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
import { CAIP_FORMATTED_EVM_TEST_CHAINS } from '../../../../shared/constants/network';
import { getMultichainNetwork } from '../../../selectors/multichain';
import { Tab, Tabs } from '../../../components/ui/tabs';
import {
  getAvatarFallbackLetter,
  isIpAddress,
  transformOriginToTitle,
} from '../../../helpers/utils/util';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { EvmAndMultichainNetworkConfigurationsWithCaipChainId } from '../../../selectors/selectors.types';
import { mergeCaip25CaveatValues } from '../../../../shared/lib/caip25-caveat-merger';
import {
  getMultichainAccountGroups,
  getNonMultichainAccountGroups,
} from '../../../selectors/multichain-accounts/account-tree';
import { MultichainAccountCell } from '../../../components/multichain-accounts/multichain-account-cell';
import { useAccountGroupConnectionStatus } from '../../../hooks/useAccountGroupConnectionStatus';
import { SiteCell } from '../../../components/multichain/pages/review-permissions-page/site-cell/site-cell';
import { MultichainEditAccountsModal } from '../../../components/multichain/edit-accounts-modal/multichain-edit-accounts-modal';
import { MultichainSiteCell } from '../../../components/multichain/pages/review-permissions-page/site-cell/multichain-site-cell';
import {
  PermissionsRequest,
  getCaip25CaveatValueFromPermissions,
} from './utils';

export type ConnectPageRequest = {
  permissions?: PermissionsRequest;
  metadata?: {
    id: string;
    origin: string;
    isEip1193Request?: boolean;
    promptToCreateSolanaAccount?: boolean;
  };
};

export type MultichainConnectPageProps = {
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

export const MultichainConnectPage: React.FC<MultichainConnectPageProps> = ({
  request,
  permissionsRequestId,
  rejectPermissionsRequest,
  approveConnection,
  targetSubjectMetadata,
}) => {
  const t = useI18nContext();
  const trackEvent = useContext(MetaMetricsContext);

  const multichainAccounts = useSelector(getMultichainAccountGroups);
  const nonMultichainAccounts = useSelector(getNonMultichainAccountGroups);

  console.log('multichainAccounts', multichainAccounts);
  console.log('nonMultichainAccounts', nonMultichainAccounts);

  const existingPermissions = useSelector((state) =>
    getPermissions(state, request.metadata?.origin),
  );

  const existingCaip25CaveatValue = useMemo(
    () =>
      existingPermissions
        ? getCaip25CaveatValueFromPermissions(existingPermissions)
        : null,
    [existingPermissions],
  );

  console.log('existingCaip25CaveatValue', existingCaip25CaveatValue);

  const requestedCaip25CaveatValue = getCaip25CaveatValueFromPermissions(
    request.permissions,
  );

  console.log('requestedCaip25CaveatValue', requestedCaip25CaveatValue);

  const requestedCaip25CaveatValueWithExistingPermissions =
    existingCaip25CaveatValue
      ? mergeCaip25CaveatValues(
          requestedCaip25CaveatValue,
          existingCaip25CaveatValue,
        )
      : requestedCaip25CaveatValue;

  const requestedCaipChainIds = getAllScopesFromCaip25CaveatValue(
    requestedCaip25CaveatValueWithExistingPermissions,
  );

  console.log('requestedCaipChainIds', requestedCaipChainIds);

  const {
    connectedAccountGroups,
    supportedAccountGroups,
    existingConnectedCaipAccountIds,
  } = useAccountGroupConnectionStatus(
    requestedCaip25CaveatValueWithExistingPermissions,
    requestedCaipChainIds,
  );

  console.log('connectedAccountGroups', connectedAccountGroups);
  console.log('supportedAccountGroups', supportedAccountGroups);

  // const { isEip1193Request } = request.metadata ?? {};

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

  const [userHasModifiedSelection, setUserHasModifiedSelection] =
    useState(false);
  const [showEditAccountsModal, setShowEditAccountsModal] = useState(false);

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

  const defaultSelectedChainIds = defaultSelectedNetworkList;
  const [selectedChainIds, setSelectedChainIds] = useState<CaipChainId[]>(
    defaultSelectedChainIds as CaipChainId[],
  );

  const handleChainIdsSelected = useCallback(
    (newSelectedChainIds: CaipChainId[], { isUserModified = true } = {}) => {
      if (isUserModified) {
        setUserHasModifiedSelection(true);
      }
      setSelectedChainIds(newSelectedChainIds);
    },
    [setUserHasModifiedSelection, setSelectedChainIds],
  );

  const defaultAccountGroupIds = Array.from(connectedAccountGroups).map(
    (group) => group.id,
  );

  const [selectedAccountGroupIds, setSelectedAccountGroupIds] = useState(
    defaultAccountGroupIds,
  );

  const [selectedCaipAccountAddresses, setSelectedCaipAccountAddresses] =
    useState<CaipAccountId[]>(existingConnectedCaipAccountIds);

  console.log('selectedCaipAccountAddresses', selectedCaipAccountAddresses);

  const handleAccountGroupIdsSelected = useCallback(
    (
      accountGroupIds: AccountGroupObject['id'][],
      { isUserModified = true } = {},
    ) => {
      console.log('handleAccountGroupIdsSelected', accountGroupIds);
      if (isUserModified) {
        setUserHasModifiedSelection(true);
      }
      const updatedSelectedChains = [...selectedChainIds];

      // Pre-parse all chain namespaces and cache common strings
      const chainNamespaces = new Map<CaipChainId, string>();
      const eip155Scope = `${KnownCaipNamespace.Eip155}:0`;

      updatedSelectedChains.forEach((chainId) => {
        try {
          const { namespace } = parseCaipChainId(chainId);
          chainNamespaces.set(chainId, namespace);
        } catch (err) {
          // Skip invalid chain IDs
        }
      });

      // Create lookup sets for selected account group IDs
      const selectedGroupIds = new Set(accountGroupIds);
      console.log('new group ids', selectedGroupIds);

      // Filter to only selected account groups
      const selectedAccountGroups = supportedAccountGroups.filter((group) =>
        selectedGroupIds.has(group.id),
      );

      // Build account addresses more efficiently
      const updatedSelectedCaipAccountAddresses = new Set<CaipAccountId>();

      // Process each selected account group
      selectedAccountGroups.forEach((accountGroup) => {
        accountGroup.accounts.forEach((account) => {
          // Convert scopes to Set for O(1) lookup
          const accountScopesSet = new Set(account.scopes);

          // Check each selected chain
          updatedSelectedChains.forEach((chainId) => {
            const namespace = chainNamespaces.get(chainId);
            if (!namespace) {
              return;
            }

            let shouldAdd = false;

            if (namespace === KnownCaipNamespace.Eip155) {
              shouldAdd = accountScopesSet.has(eip155Scope);
            } else if (namespace === chainId) {
              shouldAdd = accountScopesSet.has(chainId);
            }

            if (shouldAdd) {
              updatedSelectedCaipAccountAddresses.add(
                `${chainId}:${account.address}`,
              );
            }
          });
        });
      });

      handleChainIdsSelected(updatedSelectedChains, { isUserModified });
      setSelectedAccountGroupIds(accountGroupIds);
      setSelectedCaipAccountAddresses(
        Array.from(updatedSelectedCaipAccountAddresses),
      );
    },
    [
      selectedChainIds,
      selectedCaipAccountAddresses,
      handleChainIdsSelected,
      supportedAccountGroups,
      setUserHasModifiedSelection,
      setSelectedAccountGroupIds,
      setSelectedCaipAccountAddresses,
    ],
  );

  // Ensures the selected account state is kept in sync with the default selected account value
  // until the user makes modifications to the selected account/network values.
  useEffect(() => {
    if (
      !userHasModifiedSelection &&
      !isEqual(defaultAccountGroupIds, selectedAccountGroupIds)
    ) {
      handleAccountGroupIdsSelected(defaultAccountGroupIds, {
        isUserModified: false,
      });
    }
  }, [
    userHasModifiedSelection,
    handleAccountGroupIdsSelected,
    selectedAccountGroupIds,
    JSON.stringify(defaultAccountGroupIds),
  ]);

  // const selectedAccounts = allAccounts.filter(({ caipAccountId }) => {
  //   return selectedAccountGroupIds.some((selectedAccountGroupId) => {
  //     return selectedAccountGroupId === caipAccountId;
  //   });
  // });

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
          requestedCaip25CaveatValueWithExistingPermissions,
          selectedCaipAccountAddresses,
          selectedChainIds,
        ),
      },
    };
    approveConnection(_request);
  }, [
    request,
    requestedCaip25CaveatValueWithExistingPermissions,
    selectedAccountGroupIds,
    selectedChainIds,
    approveConnection,
  ]);

  const title = transformOriginToTitle(targetSubjectMetadata.origin);

  return (
    <Page
      data-testid="connect-page"
      className="main-container connect-page"
      backgroundColor={BackgroundColor.backgroundDefault}
    >
      <Header paddingTop={8} paddingBottom={0}>
        <Box
          display={Display.Flex}
          justifyContent={JustifyContent.center}
          marginBottom={8}
        >
          {targetSubjectMetadata.iconUrl ? (
            <>
              <Box
                style={{
                  filter: 'blur(16px) brightness(1.1)',
                  position: 'absolute',
                }}
              >
                <AvatarFavicon
                  backgroundColor={BackgroundColor.backgroundMuted}
                  size={AvatarFaviconSize.Xl}
                  src={targetSubjectMetadata.iconUrl}
                  name={title}
                />
              </Box>
              <AvatarFavicon
                backgroundColor={BackgroundColor.backgroundMuted}
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
              backgroundColor={BackgroundColor.backgroundMuted}
            >
              {isIpAddress(title) ? '?' : getAvatarFallbackLetter(title)}
            </AvatarBase>
          )}
        </Box>
        <Text variant={TextVariant.headingLg} marginBottom={1}>
          {title}
        </Text>
        <Box display={Display.Flex} justifyContent={JustifyContent.center}>
          <Text color={TextColor.textAlternative}>
            {t('connectionDescription')}
          </Text>
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
                {selectedAccountGroupIds.map((accountGroupId) => (
                  <MultichainAccountCell
                    accountId={accountGroupId}
                    balance={'0'}
                    key={accountGroupId}
                    endAccessory={<div>test</div>}
                    selected={false}
                  />
                ))}
              </Box>
              {selectedAccountGroupIds.length === 0 && (
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
              {selectedAccountGroupIds.length > 0 && (
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
              {showEditAccountsModal && (
                <MultichainEditAccountsModal
                  accountsGroups={supportedAccountGroups}
                  defaultSelectedAccountGroups={selectedAccountGroupIds}
                  onClose={handleCloseEditAccountsModal}
                  onSubmit={handleAccountGroupIdsSelected}
                />
              )}
            </Box>
          </Tab>
          <Tab
            name={t('permissions')}
            tabKey="permissions"
            width={BlockSize.Full}
            data-testid="permissions-tab"
            disabled={selectedAccountGroupIds.length === 0}
          >
            <Box marginTop={4}>
              <MultichainSiteCell
                nonTestNetworks={nonTestNetworkConfigurations}
                testNetworks={testNetworkConfigurations}
                accountsGroups={supportedAccountGroups}
                onSelectAccountGroupIds={handleAccountGroupIdsSelected}
                onSelectChainIds={handleChainIdsSelected}
                selectedAccountGroupIds={selectedAccountGroupIds}
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
                selectedAccountGroupIds.length === 0 ||
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
