import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { isEqual } from 'lodash';
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
import { AccountGroupObject } from '@metamask/account-tree-controller';
import {
  AvatarBase,
  AvatarBaseSize,
  AvatarFavicon,
  AvatarFaviconSize,
  AvatarGroup,
  AvatarGroupVariant,
  Box,
  BoxAlignItems,
  BoxBackgroundColor,
  BoxFlexDirection,
  Button,
  ButtonSize,
  ButtonVariant,
  Icon,
  IconColor,
  IconName,
  IconSize,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useBoolean } from '../../../hooks/useBoolean';
import { getPermissions } from '../../../selectors';
import { getPreferences } from '../../../../shared/lib/selectors/preferences';
import { getAllNetworkConfigurationsByCaipChainId } from '../../../../shared/lib/selectors/networks';
import {
  Content,
  Footer,
  Header,
  Page,
} from '../../../components/multichain/pages/page';
import { BackgroundColor } from '../../../helpers/constants/design-system';
import { CAIP_FORMATTED_TEST_CHAINS } from '../../../../shared/constants/network';
import {
  getAvatarFallbackLetter,
  isIpAddress,
  transformOriginToTitle,
} from '../../../helpers/utils/util';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { useAnalytics } from '../../../hooks/useAnalytics';
import { EvmAndMultichainNetworkConfigurationsWithCaipChainId } from '../../../selectors/selectors.types';
import { mergeCaip25CaveatValues } from '../../../../shared/lib/caip25-caveat-merger';
import { MultichainAccountCell } from '../../../components/multichain-accounts/multichain-account-cell';
import { useAccountGroupsForPermissions } from '../../../hooks/useAccountGroupsForPermissions';

import {
  PermissionsRequest,
  getCaip25CaveatValueFromPermissions,
} from '../../../helpers/utils/caip25-permissions';
import { getDefaultConnectChainIds } from '../../../helpers/utils/connect-default-chains';
import { MultichainEditAccountsPage } from '../../../components/multichain-accounts/permissions/multichain-edit-accounts-page/multichain-edit-accounts-page';
import { getCaip25AccountIdsFromAccountGroupAndScope } from '../../../../shared/lib/multichain/scope-utils';
import { selectBalanceForAllWallets } from '../../../selectors/assets';
import { useFormatters } from '../../../hooks/useFormatters';
import { AccountGroupWithInternalAccounts } from '../../../selectors/multichain-accounts/account-tree.types';
import { getMultichainNetwork } from '../../../selectors/multichain';
import { TrustSignalDisplayState } from '../../../hooks/useTrustSignals';
import { useOriginTrustSignals } from '../../../hooks/useOriginTrustSignals';
import { MultichainNetworks } from '../../../../shared/constants/multichain/networks';
import { ConnectionPermissionsList } from '../../../components/app/connection-permissions-list/connection-permissions-list';
import { getIconSeedAddressByAccountGroupId } from '../../../selectors/multichain-accounts/account-tree';
import { getAvatarType } from '../../../components/app/preferred-avatar/preferred-avatar';
import { TrustSignalPill } from '../../../components/app/trust-signal-pill/trust-signal-pill';
import { TrustSignalModal } from '../../../components/app/trust-signal-modal/trust-signal-modal';

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

type SingleAccountCellProps = {
  accountGroupId: AccountGroupObject['id'];
  accountName: string;
  balance: string;
  onEdit: () => void;
  privacyMode?: boolean;
};

type MultiAccountRowProps = {
  seedAddresses: string[];
  onEdit: () => void;
  accountsCount: number;
};

const SingleAccountCell = ({
  accountGroupId,
  accountName,
  balance,
  onEdit,
  privacyMode = false,
}: SingleAccountCellProps) => (
  <MultichainAccountCell
    accountId={accountGroupId}
    accountName={accountName}
    balance={balance}
    balancePosition="subtitle"
    disableHoverEffect
    onClick={onEdit}
    privacyMode={privacyMode}
    endAccessory={
      <Icon
        name={IconName.ArrowRight}
        size={IconSize.Sm}
        color={IconColor.IconAlternative}
      />
    }
  />
);

const MultiAccountRow = ({
  seedAddresses,
  onEdit,
  accountsCount,
}: MultiAccountRowProps) => {
  const avatarVariant = useSelector(getAvatarType);
  const avatarMembers = seedAddresses.map((address) => ({
    address,
    variant: avatarVariant,
  }));
  const t = useI18nContext();

  return (
    <Box
      flexDirection={BoxFlexDirection.Row}
      alignItems={BoxAlignItems.Center}
      padding={4}
      gap={3}
      onClick={onEdit}
    >
      <AvatarGroup
        avatarPropsArr={avatarMembers}
        variant={AvatarGroupVariant.Account}
      />
      <Text
        variant={TextVariant.BodyMd}
        color={TextColor.TextDefault}
        data-testid={`accounts-count-${accountsCount}`}
      >
        {t('accountsCount', [accountsCount.toString()])}
      </Text>
      <Icon
        name={IconName.ArrowRight}
        size={IconSize.Sm}
        color={IconColor.IconAlternative}
        className="ml-auto"
      />
    </Box>
  );
};

export const MultichainAccountsConnectPage = ({
  request,
  permissionsRequestId,
  rejectPermissionsRequest,
  approveConnection,
  targetSubjectMetadata,
}: MultichainConnectPageProps) => {
  const t = useI18nContext();
  const { trackEvent, createEventBuilder } = useAnalytics();
  const [pageMode, setPageMode] = useState<MultichainAccountsConnectPageMode>(
    MultichainAccountsConnectPageMode.Summary,
  );
  const {
    value: showRiskModal,
    setTrue: openRiskModal,
    setFalse: closeRiskModal,
  } = useBoolean();
  const { isEip1193Request } = request.metadata ?? {};
  const { formatCurrencyWithMinThreshold } = useFormatters();
  const { privacyMode } = useSelector(getPreferences);
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

  const isSolanaWalletStandardRequest =
    requestedScopes.length === 1 &&
    requestedScopes[0] === MultichainNetworks.SOLANA &&
    Boolean(
      requestedCaip25CaveatValue.sessionProperties[
        KnownSessionProperties.SolanaAccountChangedNotifications
      ],
    );

  const isTronWalletAdapterRequest =
    requestedScopes.length === 1 &&
    requestedScopes[0] === MultichainNetworks.TRON &&
    Boolean(
      requestedCaip25CaveatValue.sessionProperties[
        KnownSessionProperties.TronAccountChangedNotifications
      ],
    );

  // Requests carrying the `eip1193-compatible` session property come from
  // EIP-1193 compatibility layers (e.g. `@metamask/connect-evm`) that route
  // legacy-style dapp connections through the Multichain API. They should get
  // the same all-networks pre-selection as legacy EIP-1193 requests.
  const isEip1193CompatibleRequest = Boolean(
    requestedCaip25CaveatValue.sessionProperties?.[
      KnownSessionProperties.Eip1193Compatible
    ],
  );

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
            CAIP_FORMATTED_TEST_CHAINS.includes(caipChainId);
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

  const globallySelectedNetwork = useSelector(getMultichainNetwork);

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

  const defaultConnectChainIds = useMemo(
    () =>
      getDefaultConnectChainIds({
        nonTestNetworkConfigurations,
        testNetworkConfigurations,
        globallySelectedNetworkChainId: globallySelectedNetwork.chainId,
        requestedCaipChainIds,
        alreadyConnectedCaipChainIds,
        requestedNamespaces,
        requestedNamespacesWithoutWallet,
        isEip1193Request,
        isEip1193CompatibleRequest,
        isSolanaWalletStandardRequest,
        isTronWalletAdapterRequest,
      }),
    [
      nonTestNetworkConfigurations,
      testNetworkConfigurations,
      requestedCaipChainIds,
      isEip1193Request,
      globallySelectedNetwork.chainId,
      requestedNamespaces,
      requestedNamespacesWithoutWallet,
      alreadyConnectedCaipChainIds,
      isEip1193CompatibleRequest,
      isSolanaWalletStandardRequest,
      isTronWalletAdapterRequest,
    ],
  );

  const {
    connectedAccountGroups,
    supportedAccountGroups,
    connectedAccountGroupWithRequested,
    caipAccountIdsOfConnectedAndRequestedAccountGroups,
    selectedAndRequestedAccountGroups,
  } = useAccountGroupsForPermissions(
    existingCaip25CaveatValue,
    requestedCaipAccountIds,
    defaultConnectChainIds,
    requestedNamespacesWithoutWallet,
  );

  const [userHasModifiedAccountSelection, setUserHasModifiedAccountSelection] =
    useState(false);

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
          defaultConnectChainIds,
        ),
      };
    }

    return {
      suggestedAccountGroups: selectedAndRequestedAccountGroups,
      suggestedCaipAccountIds: getCaip25AccountIdsFromAccountGroupAndScope(
        selectedAndRequestedAccountGroups,
        defaultConnectChainIds,
      ),
    };
  }, [
    connectedAccountGroups,
    supportedAccountGroups,
    requestedCaipAccountIds,
    selectedAndRequestedAccountGroups,
    connectedAccountGroupWithRequested,
    caipAccountIdsOfConnectedAndRequestedAccountGroups,
    defaultConnectChainIds,
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
        setUserHasModifiedAccountSelection(true);
      }

      const selectedGroupIds = new Set(accountGroupIds);
      const selectedAccountGroups = supportedAccountGroups.filter(
        (group: AccountGroupWithInternalAccounts) =>
          selectedGroupIds.has(group.id),
      );

      const caip25AccountIds = getCaip25AccountIdsFromAccountGroupAndScope(
        selectedAccountGroups,
        defaultConnectChainIds,
      );

      setSelectedAccountGroupIds(accountGroupIds);
      setSelectedCaipAccountIds(caip25AccountIds);
      setPageMode(MultichainAccountsConnectPageMode.Summary);
    },
    [defaultConnectChainIds, supportedAccountGroups],
  );

  useEffect(() => {
    const defaultAccountGroupIds = suggestedAccountGroups.map(
      (group) => group.id,
    );
    if (
      !userHasModifiedAccountSelection &&
      !isEqual(defaultAccountGroupIds, selectedAccountGroupIds)
    ) {
      handleAccountGroupIdsSelected(defaultAccountGroupIds, {
        isUserModified: false,
      });
    }
  }, [
    userHasModifiedAccountSelection,
    handleAccountGroupIdsSelected,
    selectedAccountGroupIds,
    suggestedAccountGroups,
  ]);

  const setModeToEditAccounts = useCallback(() => {
    trackEvent(
      createEventBuilder(MetaMetricsEventName.ViewPermissionedAccounts)
        .addCategory(MetaMetricsEventCategory.Navigation)
        .addProperties({
          location:
            'Connect view (accounts tab), Permissions toast, Permissions (dapp)',
        })
        .build(),
    );
    setPageMode(MultichainAccountsConnectPageMode.EditAccounts);
  }, [trackEvent, createEventBuilder]);

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
          defaultConnectChainIds,
        ),
      },
    };
    approveConnection(_request);
  }, [
    request,
    requestedCaip25CaveatValueWithExistingPermissions,
    selectedCaipAccountIds,
    defaultConnectChainIds,
    approveConnection,
  ]);

  const title = transformOriginToTitle(targetSubjectMetadata.origin);
  const { state: trustSignalState } = useOriginTrustSignals(
    targetSubjectMetadata.origin,
  );
  const isDangerousTrustSignal =
    trustSignalState === TrustSignalDisplayState.Malicious ||
    trustSignalState === TrustSignalDisplayState.Warning;

  const seedAddresses = useSelector((state) =>
    selectedAccountGroupIds.map((id) =>
      getIconSeedAddressByAccountGroupId(state, id),
    ),
  );

  const singleAccountData = useMemo(() => {
    if (selectedAccountGroupIds.length !== 1) {
      return null;
    }
    const accountGroupId = selectedAccountGroupIds[0];
    const accountGroup = supportedAccountGroups.find(
      (group) => group.id === accountGroupId,
    );
    const account = accountGroup
      ? wallets?.[accountGroup.walletId]?.groups?.[accountGroupId]
      : undefined;
    const balance = account?.totalBalanceInUserCurrency ?? 0;
    const currency = account?.userCurrency ?? '';

    return {
      accountGroupId,
      accountName: accountGroup?.metadata.name ?? 'Unknown Account',
      balance: formatCurrencyWithMinThreshold(balance, currency),
    };
  }, [
    selectedAccountGroupIds,
    supportedAccountGroups,
    wallets,
    formatCurrencyWithMinThreshold,
  ]);

  return pageMode === MultichainAccountsConnectPageMode.Summary ? (
    <>
      {showRiskModal && (
        <TrustSignalModal
          onContinue={() => {
            closeRiskModal();
            onConfirm();
          }}
          onCancel={closeRiskModal}
        />
      )}
      <Page
        data-testid="connect-page"
        className="main-container multichain-connect-page"
        backgroundColor={BackgroundColor.backgroundDefault}
      >
        <Header paddingTop={12} paddingBottom={6}>
          <Box className="flex justify-center mt-4 mb-6">
            {targetSubjectMetadata.iconUrl ? (
              <AvatarFavicon
                className="bg-muted"
                size={AvatarFaviconSize.Lg}
                src={targetSubjectMetadata.iconUrl}
                name={title}
              />
            ) : (
              <AvatarBase
                size={AvatarBaseSize.Lg}
                className="flex items-center justify-center text-alternative bg-muted border-0"
              >
                {isIpAddress(title) ? '?' : getAvatarFallbackLetter(title)}
              </AvatarBase>
            )}
          </Box>
          <Box flexDirection={BoxFlexDirection.Column} gap={2}>
            <Text
              variant={TextVariant.HeadingMd}
              className="break-words whitespace-normal"
            >
              {title}
            </Text>
            <Text
              color={TextColor.TextAlternative}
              variant={TextVariant.BodySm}
            >
              {t('connectionDescription')}
            </Text>
          </Box>
          <Box className="flex justify-center mt-4">
            <TrustSignalPill state={trustSignalState} />
          </Box>
        </Header>

        <Content
          paddingLeft={4}
          paddingRight={4}
          backgroundColor={BackgroundColor.transparent}
          gap={6}
        >
          <Box flexDirection={BoxFlexDirection.Column} gap={1}>
            <Text
              variant={TextVariant.BodySm}
              color={TextColor.TextAlternative}
            >
              {t('account')}
            </Text>
            <Box
              backgroundColor={BoxBackgroundColor.BackgroundMuted}
              className="rounded-lg cursor-pointer"
              data-testid="account-selection-section"
            >
              {singleAccountData && (
                <SingleAccountCell
                  accountGroupId={singleAccountData.accountGroupId}
                  accountName={singleAccountData.accountName}
                  balance={singleAccountData.balance}
                  onEdit={setModeToEditAccounts}
                  privacyMode={privacyMode}
                />
              )}
              {selectedAccountGroupIds.length > 1 && (
                <MultiAccountRow
                  seedAddresses={seedAddresses}
                  onEdit={setModeToEditAccounts}
                  accountsCount={selectedAccountGroupIds.length}
                />
              )}
            </Box>
          </Box>
          <ConnectionPermissionsList />
        </Content>

        <Footer>
          <Box
            className={`flex w-full gap-4 ${
              isDangerousTrustSignal ? 'flex-col' : 'flex-row'
            }`}
          >
            {isDangerousTrustSignal ? (
              <>
                <Button
                  size={ButtonSize.Lg}
                  data-testid="cancel-btn"
                  onClick={handleCancelConnection}
                >
                  {t('backToSafety')}
                </Button>
                <Button
                  variant={ButtonVariant.Secondary}
                  size={ButtonSize.Lg}
                  data-testid="confirm-btn"
                  onClick={openRiskModal}
                  isDanger
                >
                  {t('continueAtYourOwnRisk')}
                </Button>
              </>
            ) : (
              <>
                <Button
                  className="flex-1"
                  variant={ButtonVariant.Secondary}
                  size={ButtonSize.Lg}
                  data-testid="cancel-btn"
                  onClick={handleCancelConnection}
                >
                  {t('cancel')}
                </Button>
                <Button
                  className="flex-1"
                  data-testid="confirm-btn"
                  size={ButtonSize.Lg}
                  onClick={onConfirm}
                >
                  {t('connect')}
                </Button>
              </>
            )}
          </Box>
        </Footer>
      </Page>
    </>
  ) : (
    <MultichainEditAccountsPage
      title={t('selectAccounts')}
      confirmButtonText={t('save')}
      supportedAccountGroups={supportedAccountGroups}
      defaultSelectedAccountGroups={selectedAccountGroupIds}
      onSubmit={handleAccountGroupIdsSelected}
      onClose={() => setPageMode(MultichainAccountsConnectPageMode.Summary)}
    />
  );
};
