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
  getAllNamespacesFromCaip25CaveatValue,
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
  Icon,
  IconName,
  IconSize,
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
  IconColor,
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
import { MultichainAccountCell } from '../../../components/multichain-accounts/multichain-account-cell';
import { useAccountGroupsForPermissions } from '../../../hooks/useAccountGroupsForPermissions';

import {
  PermissionsRequest,
  getCaip25CaveatValueFromPermissions,
} from '../connect-page/utils';
import { MultichainSiteCell } from '../../../components/multichain-accounts/multichain-site-cell/multichain-site-cell';
import { MultichainEditAccountsPage } from '../../../components/multichain-accounts/permissions/multichain-edit-accounts-page/multichain-edit-accounts-page';
import { getCaip25AccountFromAccountGroupAndScope } from '../../../../shared/lib/multichain/scope-utils';

export type MultichainAccountsConnectPageRequest = {
  permissions?: PermissionsRequest;
  metadata?: {
    id: string;
    origin: string;
    isEip1193Request?: boolean;
    promptToCreateSolanaAccount?: boolean;
  };
};

export type MultichainConnectPageProps = {
  request: MultichainAccountsConnectPageRequest;
  permissionsRequestId: string;
  rejectPermissionsRequest: (id: string) => void;
  approveConnection: (request: MultichainAccountsConnectPageRequest) => void;
  activeTabOrigin: string;
  targetSubjectMetadata: {
    extensionId: string | null;
    iconUrl: string | null;
    name: string;
    origin: string;
    subjectType: string;
  };
};

export enum MultichainAccountsConnectPageMode {
  Summary = 'summary',
  EditAccounts = 'edit-accounts',
}

export const MultichainAccountsConnectPage: React.FC<
  MultichainConnectPageProps
> = ({
  request,
  permissionsRequestId,
  rejectPermissionsRequest,
  approveConnection,
  targetSubjectMetadata,
}) => {
  const t = useI18nContext();
  const trackEvent = useContext(MetaMetricsContext);
  const [pageMode, setPageMode] = useState<MultichainAccountsConnectPageMode>(
    MultichainAccountsConnectPageMode.Summary,
  );

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

  const requestedCaip25CaveatValue = getCaip25CaveatValueFromPermissions(
    request.permissions,
  );

  const requestedCaip25CaveatValueWithExistingPermissions =
    existingCaip25CaveatValue
      ? mergeCaip25CaveatValues(
          requestedCaip25CaveatValue,
          existingCaip25CaveatValue,
        )
      : requestedCaip25CaveatValue;

  const requestedCaipChainIds = getAllScopesFromCaip25CaveatValue(
    requestedCaip25CaveatValueWithExistingPermissions,
  ).filter((chainId) => {
    const { namespace } = parseCaipChainId(chainId);
    return namespace !== KnownCaipNamespace.Wallet;
  });

  const requestedNamespaces = getAllNamespacesFromCaip25CaveatValue(
    requestedCaip25CaveatValueWithExistingPermissions,
  );

  const requestedNamespacesWithoutWallet = requestedNamespaces.filter(
    (namespace) => namespace !== KnownCaipNamespace.Wallet,
  );

  const {
    connectedAccountGroups,
    supportedAccountGroups,
    existingConnectedCaipAccountIds,
  } = useAccountGroupsForPermissions(
    requestedCaip25CaveatValueWithExistingPermissions,
    requestedCaipChainIds,
    requestedNamespacesWithoutWallet,
  );

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

  const [userHasModifiedSelection, setUserHasModifiedSelection] =
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

  const connectedAccountGroupIds = Array.from(connectedAccountGroups).map(
    (group) => group.id,
  );

  const defaultAccountGroupIds = useMemo(() => {
    if (connectedAccountGroupIds.length) {
      return connectedAccountGroupIds;
    }

    if (supportedAccountGroups.length > 0) {
      return [supportedAccountGroups[0].id];
    }

    return [];
  }, [connectedAccountGroupIds, supportedAccountGroups]);

  const [selectedAccountGroupIds, setSelectedAccountGroupIds] = useState(
    defaultAccountGroupIds,
  );

  const [selectedCaipAccountAddresses, setSelectedCaipAccountAddresses] =
    useState<CaipAccountId[]>(existingConnectedCaipAccountIds);

  const handleAccountGroupIdsSelected = useCallback(
    (
      accountGroupIds: AccountGroupObject['id'][],
      { isUserModified = true } = {},
    ) => {
      if (isUserModified) {
        setUserHasModifiedSelection(true);
      }
      const updatedSelectedChains = [...selectedChainIds];

      const updatedSelectedCaipAccountAddresses =
        getCaip25AccountFromAccountGroupAndScope(
          supportedAccountGroups,
          selectedChainIds,
        );

      handleChainIdsSelected(updatedSelectedChains, { isUserModified });
      setSelectedAccountGroupIds(accountGroupIds);
      setSelectedCaipAccountAddresses(
        Array.from(updatedSelectedCaipAccountAddresses),
      );
    },
    [
      selectedChainIds,
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
    defaultAccountGroupIds,
  ]);

  const setModeToEditAccounts = useCallback(() => {
    trackEvent({
      category: MetaMetricsEventCategory.Navigation,
      event: MetaMetricsEventName.ViewPermissionedAccounts,
      properties: {
        location:
          'Connect view (accounts tab), Permissions toast, Permissions (dapp)',
      },
    });
    setPageMode(MultichainAccountsConnectPageMode.EditAccounts);
  }, [trackEvent]);

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
    selectedCaipAccountAddresses,
    selectedChainIds,
    approveConnection,
  ]);

  const title = transformOriginToTitle(targetSubjectMetadata.origin);

  return pageMode === MultichainAccountsConnectPageMode.Summary ? (
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
            <Box
              marginTop={4}
              style={{
                overflow: 'auto',
                maxHeight: '268px',
                scrollbarColor: 'var(--color-icon-muted) transparent',
              }}
            >
              <Box
                backgroundColor={BackgroundColor.backgroundDefault}
                borderRadius={BorderRadius.XL}
              >
                {selectedAccountGroupIds.map((accountGroupId) => {
                  const accountGroup = supportedAccountGroups.find(
                    (group) => group.id === accountGroupId,
                  );
                  return (
                    <MultichainAccountCell
                      accountId={accountGroupId}
                      accountName={
                        accountGroup?.metadata.name || 'Unknown Account'
                      }
                      balance={'$1337.00'}
                      key={accountGroupId}
                      selected
                      walletName={accountGroup?.walletName}
                    />
                  );
                })}
              </Box>
              {selectedAccountGroupIds.length === 0 && (
                <Box
                  className="connect-page__accounts-empty"
                  display={Display.Flex}
                  justifyContent={JustifyContent.flexStart}
                  alignItems={AlignItems.center}
                  borderRadius={BorderRadius.XL}
                >
                  <ButtonLink
                    onClick={setModeToEditAccounts}
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
                  justifyContent={JustifyContent.flexStart}
                  padding={4}
                >
                  <Box
                    className="connect-page__edit-icon"
                    marginRight={4}
                    display={Display.Flex}
                    alignItems={AlignItems.center}
                    justifyContent={JustifyContent.center}
                    backgroundColor={BackgroundColor.infoMuted}
                    borderRadius={BorderRadius.MD}
                    padding={4}
                  >
                    <Icon
                      name={IconName.Edit}
                      size={IconSize.Md}
                      color={IconColor.infoDefault}
                    />
                  </Box>
                  <ButtonLink
                    color={TextColor.infoDefault}
                    onClick={setModeToEditAccounts}
                    data-testid="edit"
                  >
                    {t('editAccounts')}
                  </ButtonLink>
                </Box>
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
                supportedAccountGroups={supportedAccountGroups}
                showEditAccounts={setModeToEditAccounts}
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
  ) : (
    <MultichainEditAccountsPage
      displayChooseAccountPage={false}
      supportedAccountGroups={supportedAccountGroups}
      defaultSelectedAccountGroups={selectedAccountGroupIds}
      onSubmit={handleAccountGroupIdsSelected}
      onClose={() => setPageMode(MultichainAccountsConnectPageMode.Summary)}
    />
  );
};
