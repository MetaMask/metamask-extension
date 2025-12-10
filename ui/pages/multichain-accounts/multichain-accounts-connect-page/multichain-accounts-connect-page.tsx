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
  getCaipAccountIdsFromCaip25CaveatValue,
  KnownSessionProperties,
} from '@metamask/chain-agnostic-permission';
import {
  CaipAccountId,
  CaipChainId,
  KnownCaipNamespace,
  parseCaipChainId,
} from '@metamask/utils';

import { isEqual } from 'lodash';
import { AccountGroupObject } from '@metamask/account-tree-controller';

import { Tooltip } from 'react-tippy';
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
} from '../../permissions-connect/connect-page/utils';
import { MultichainSiteCell } from '../../../components/multichain-accounts/multichain-site-cell/multichain-site-cell';
import { MultichainEditAccountsPage } from '../../../components/multichain-accounts/permissions/multichain-edit-accounts-page/multichain-edit-accounts-page';
import { getCaip25AccountIdsFromAccountGroupAndScope } from '../../../../shared/lib/multichain/scope-utils';
import { selectBalanceForAllWallets } from '../../../selectors/assets';
import { useFormatters } from '../../../hooks/useFormatters';
import { AccountGroupWithInternalAccounts } from '../../../selectors/multichain-accounts/account-tree.types';
import { getMultichainNetwork } from '../../../selectors/multichain';
import { TrustSignalDisplayState } from '../../../hooks/useTrustSignals';
import { useOriginTrustSignals } from '../../../hooks/useOriginTrustSignals';

export type MultichainAccountsConnectPageRequest = {
  permissions?: PermissionsRequest;
  metadata?: {
    id: string;
    origin: string;
    isEip1193Request?: boolean;
  };
};

export type MultichainConnectPageProps = {
  request: MultichainAccountsConnectPageRequest;
  permissionsRequestId: string;
  rejectPermissionsRequest: (id: string) => void;
  approveConnection: (request: MultichainAccountsConnectPageRequest) => void;
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
  const { isEip1193Request } = request.metadata ?? {};
  const { formatCurrencyWithMinThreshold } = useFormatters();
  const allBalances = useSelector(selectBalanceForAllWallets);
  const wallets = allBalances?.wallets;

  const existingPermissions = useSelector((state) =>
    getPermissions(state, request.metadata?.origin),
  );

  const existingCaip25CaveatValue = useMemo(
    () =>
      existingPermissions
        ? getCaip25CaveatValueFromPermissions(existingPermissions)
        : {
            requiredScopes: {},
            optionalScopes: {},
            sessionProperties: {},
            isMultichainOrigin: true,
          },
    [existingPermissions],
  );

  const requestedCaip25CaveatValue = useMemo(
    () => getCaip25CaveatValueFromPermissions(request.permissions),
    [request.permissions],
  );

  const requestedScopes = getAllScopesFromCaip25CaveatValue(
    requestedCaip25CaveatValue,
  );

  const SOLANA_MAINNET_CAIP_CHAIN_ID =
    'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp';

  const isSolanaWalletStandardRequest =
    requestedScopes.length === 1 &&
    requestedScopes[0] === SOLANA_MAINNET_CAIP_CHAIN_ID &&
    requestedCaip25CaveatValue.sessionProperties[
      KnownSessionProperties.SolanaAccountChangedNotifications
    ];

  const requestedCaip25CaveatValueWithExistingPermissions = useMemo(
    () =>
      existingCaip25CaveatValue
        ? mergeCaip25CaveatValues(
            requestedCaip25CaveatValue,
            existingCaip25CaveatValue,
          )
        : requestedCaip25CaveatValue,
    [existingCaip25CaveatValue, requestedCaip25CaveatValue],
  );

  const requestedCaipAccountIds = getCaipAccountIdsFromCaip25CaveatValue(
    requestedCaip25CaveatValue,
  );

  const requestedNamespaces = useMemo(
    () =>
      getAllNamespacesFromCaip25CaveatValue(
        requestedCaip25CaveatValueWithExistingPermissions,
      ),
    [requestedCaip25CaveatValueWithExistingPermissions],
  );

  const requestedNamespacesWithoutWallet = useMemo(
    () =>
      requestedNamespaces.filter(
        (namespace) => namespace !== KnownCaipNamespace.Wallet,
      ),
    [requestedNamespaces],
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

  const currentlySelectedNetwork = useSelector(getMultichainNetwork);

  const alreadyConnectedCaipChainIds = useMemo(
    () => getAllScopesFromCaip25CaveatValue(existingCaip25CaveatValue),
    [existingCaip25CaveatValue],
  );

  const requestedCaipChainIds = useMemo(
    () =>
      getAllScopesFromCaip25CaveatValue(requestedCaip25CaveatValue).filter(
        (chainId) => {
          const { namespace } = parseCaipChainId(chainId);
          return namespace !== KnownCaipNamespace.Wallet;
        },
      ),
    [requestedCaip25CaveatValue],
  );

  const requestedAndAlreadyConnectedCaipChainIdsOrDefault = useMemo(() => {
    const allNetworksList = [
      ...nonTestNetworkConfigurations,
      ...testNetworkConfigurations,
    ].map(({ caipChainId }) => caipChainId);

    // If globally selected network is a test network, include that in the default selected networks for connection request
    const currentlySelectedNetworkChainId = currentlySelectedNetwork.chainId;
    const selectedNetworkIsTestNetwork = testNetworkConfigurations.find(
      (network: { caipChainId: CaipChainId }) =>
        network.caipChainId === currentlySelectedNetworkChainId,
    );

    const defaultSelectedNetworkList = selectedNetworkIsTestNetwork
      ? [...nonTestNetworkConfigurations, selectedNetworkIsTestNetwork].map(
          ({ caipChainId }) => caipChainId,
        )
      : nonTestNetworkConfigurations.map(({ caipChainId }) => caipChainId);

    // If the request is an EIP-1193 request (with no specific chains requested) or a Solana wallet standard request , return the default selected network list
    if (
      (requestedCaipChainIds.length === 0 && isEip1193Request) ||
      isSolanaWalletStandardRequest
    ) {
      return defaultSelectedNetworkList;
    }

    const walletRequest =
      requestedCaipChainIds.filter(
        (caipChainId) =>
          parseCaipChainId(caipChainId).namespace === KnownCaipNamespace.Wallet,
      ).length > 0;

    let additionalChains: CaipChainId[] = [];
    if (walletRequest && isEip1193Request) {
      additionalChains = nonTestNetworkConfigurations
        .map(({ caipChainId }) => caipChainId)
        .filter((caipChainId) =>
          requestedNamespacesWithoutWallet.includes(
            parseCaipChainId(caipChainId).namespace,
          ),
        );
    }

    const supportedRequestedCaipChainIds = Array.from(
      new Set([
        ...requestedCaipChainIds.filter((requestedCaipChainId) =>
          allNetworksList.includes(requestedCaipChainId as CaipChainId),
        ),
        ...additionalChains,
      ]),
    );

    // if we have specifically requested chains, return the supported requested chains plus the already connected chains
    if (supportedRequestedCaipChainIds.length > 0) {
      return Array.from(
        new Set([
          ...supportedRequestedCaipChainIds,
          ...alreadyConnectedCaipChainIds,
        ]),
      );
    }

    if (requestedNamespaces.length > 0) {
      return Array.from(
        new Set(
          defaultSelectedNetworkList.filter((caipChainId) => {
            const { namespace } = parseCaipChainId(caipChainId);
            return requestedNamespaces.includes(namespace);
          }),
        ),
      );
    }

    return defaultSelectedNetworkList;
  }, [
    nonTestNetworkConfigurations,
    testNetworkConfigurations,
    requestedCaipChainIds,
    isEip1193Request,
    currentlySelectedNetwork.chainId,
    requestedNamespaces,
    requestedNamespacesWithoutWallet,
    alreadyConnectedCaipChainIds,
  ]);

  const {
    connectedAccountGroups,
    supportedAccountGroups,
    connectedAccountGroupWithRequested,
    caipAccountIdsOfConnectedAndRequestedAccountGroups,
    selectedAndRequestedAccountGroups,
  } = useAccountGroupsForPermissions(
    existingCaip25CaveatValue,
    requestedCaipAccountIds,
    requestedAndAlreadyConnectedCaipChainIdsOrDefault,
    requestedNamespacesWithoutWallet,
  );

  const [userHasModifiedSelection, setUserHasModifiedSelection] =
    useState(false);

  const [selectedChainIds, setSelectedChainIds] = useState<CaipChainId[]>(
    requestedAndAlreadyConnectedCaipChainIdsOrDefault,
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

  const { suggestedAccountGroups, suggestedCaipAccountIds } = useMemo(() => {
    if (connectedAccountGroups.length > 0) {
      return {
        suggestedAccountGroups: connectedAccountGroupWithRequested,
        suggestedCaipAccountIds:
          caipAccountIdsOfConnectedAndRequestedAccountGroups,
      };
    }

    if (supportedAccountGroups.length === 0) {
      return {
        suggestedAccountGroups: [],
        suggestedCaipAccountIds: [],
      };
    }

    if (requestedCaipAccountIds.length === 0) {
      const [defaultSelectedAccountGroup] = supportedAccountGroups;

      return {
        suggestedAccountGroups: [defaultSelectedAccountGroup],
        suggestedCaipAccountIds: getCaip25AccountIdsFromAccountGroupAndScope(
          [defaultSelectedAccountGroup],
          requestedAndAlreadyConnectedCaipChainIdsOrDefault,
        ),
      };
    }

    return {
      suggestedAccountGroups: selectedAndRequestedAccountGroups,
      suggestedCaipAccountIds: getCaip25AccountIdsFromAccountGroupAndScope(
        selectedAndRequestedAccountGroups,
        requestedAndAlreadyConnectedCaipChainIdsOrDefault,
      ),
    };
  }, [
    connectedAccountGroups,
    supportedAccountGroups,
    requestedCaipAccountIds,
    selectedAndRequestedAccountGroups,
    connectedAccountGroupWithRequested,
    caipAccountIdsOfConnectedAndRequestedAccountGroups,
    requestedAndAlreadyConnectedCaipChainIdsOrDefault,
  ]);

  const [selectedAccountGroupIds, setSelectedAccountGroupIds] = useState(
    suggestedAccountGroups.map((group) => group.id),
  );

  const [selectedCaipAccountIds, setSelectedCaipAccountIds] = useState<
    CaipAccountId[]
  >(suggestedCaipAccountIds);

  const handleAccountGroupIdsSelected = useCallback(
    (
      accountGroupIds: AccountGroupObject['id'][],
      { isUserModified = true } = {},
    ) => {
      if (isUserModified) {
        setUserHasModifiedSelection(true);
      }
      const updatedSelectedChains = [...selectedChainIds];

      // Create lookup sets for selected account group IDs
      const selectedGroupIds = new Set(accountGroupIds);

      // Filter to only selected account groups
      const selectedAccountGroups = supportedAccountGroups.filter(
        (group: AccountGroupWithInternalAccounts) =>
          selectedGroupIds.has(group.id),
      );

      const caip25AccountIds = getCaip25AccountIdsFromAccountGroupAndScope(
        selectedAccountGroups,
        updatedSelectedChains,
      );

      handleChainIdsSelected(updatedSelectedChains, { isUserModified });
      setSelectedAccountGroupIds(accountGroupIds);
      setSelectedCaipAccountIds(caip25AccountIds);
      setPageMode(MultichainAccountsConnectPageMode.Summary);
    },
    [selectedChainIds, supportedAccountGroups, handleChainIdsSelected],
  );

  // Ensures the selected account state is kept in sync with the default selected account value
  // until the user makes modifications to the selected account/network values.
  useEffect(() => {
    const defaultAccountGroupIds = suggestedAccountGroups.map(
      (group) => group.id,
    );
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
    suggestedAccountGroups,
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
          selectedCaipAccountIds,
          selectedChainIds,
        ),
      },
    };
    approveConnection(_request);
  }, [
    request,
    requestedCaip25CaveatValueWithExistingPermissions,
    selectedCaipAccountIds,
    selectedChainIds,
    approveConnection,
  ]);

  const title = transformOriginToTitle(targetSubjectMetadata.origin);
  const originTrustSignals = useOriginTrustSignals(
    targetSubjectMetadata.origin,
  );

  const renderAccountCell = useCallback(
    (accountGroupId: AccountGroupObject['id']) => {
      const accountGroup = supportedAccountGroups.find(
        (group) => group.id === accountGroupId,
      );

      const account = accountGroup
        ? wallets?.[accountGroup.walletId]?.groups?.[accountGroupId]
        : undefined;
      const balance = account?.totalBalanceInUserCurrency ?? 0;
      const currency = account?.userCurrency ?? '';

      return (
        <MultichainAccountCell
          accountId={accountGroupId}
          accountName={accountGroup?.metadata.name || 'Unknown Account'}
          balance={formatCurrencyWithMinThreshold(balance, currency)}
          key={accountGroupId}
          walletName={accountGroup?.walletName}
        />
      );
    },
    [supportedAccountGroups, wallets, formatCurrencyWithMinThreshold],
  );

  return pageMode === MultichainAccountsConnectPageMode.Summary ? (
    <Page
      data-testid="connect-page"
      className="main-container multichain-connect-page"
      backgroundColor={BackgroundColor.backgroundDefault}
    >
      <Header paddingTop={8} paddingBottom={4}>
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
        <Box
          display={Display.Flex}
          alignItems={AlignItems.center}
          justifyContent={JustifyContent.center}
          gap={2}
          marginBottom={1}
        >
          <Text
            variant={TextVariant.headingLg}
            style={{
              wordBreak: 'break-word',
              whiteSpace: 'normal',
            }}
          >
            {title}
          </Text>
          {originTrustSignals.state === TrustSignalDisplayState.Verified && (
            <Tooltip
              title={t('alertReasonOriginTrustSignalVerified')}
              position="bottom"
              style={{ display: 'flex' }}
            >
              <Icon
                name={IconName.VerifiedFilled}
                color={IconColor.infoDefault}
                size={IconSize.Sm}
              />
            </Tooltip>
          )}
        </Box>
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
        <Tabs onTabClick={() => null} defaultActiveTabKey="accounts">
          <Tab
            className="multichain-connect-page__tab flex-1"
            name={t('accounts')}
            tabKey="accounts"
            data-testid="accounts-tab"
          >
            <Box marginTop={4}>
              <Box
                backgroundColor={BackgroundColor.backgroundDefault}
                borderRadius={BorderRadius.XL}
              >
                {selectedAccountGroupIds.map(renderAccountCell)}
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
                    padding={2}
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
            className="multichain-connect-page__tab flex-1"
            tabKey="permissions"
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
      supportedAccountGroups={supportedAccountGroups}
      defaultSelectedAccountGroups={selectedAccountGroupIds}
      onSubmit={handleAccountGroupIdsSelected}
      onClose={() => setPageMode(MultichainAccountsConnectPageMode.Summary)}
    />
  );
};
