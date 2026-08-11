import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import {
  Box,
  BoxAlignItems,
  BoxBackgroundColor,
  BoxFlexDirection,
  BoxJustifyContent,
  Text as TextDS,
  TextColor as TextColorDS,
  TextVariant as TextVariantDS,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { getPermissions } from '../../../selectors';
import { getAllNetworkConfigurationsByCaipChainId } from '../../../../shared/lib/selectors/networks';
import {
  AvatarBase,
  AvatarBaseSize,
  AvatarFavicon,
  AvatarFaviconSize,
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
  Display,
  IconColor,
  JustifyContent,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
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
          disableHoverEffect={true}
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
          className="flex"
          justifyContent={BoxJustifyContent.Center}
          marginBottom={8}
        >
          {targetSubjectMetadata.iconUrl ? (
            <AvatarFavicon
              backgroundColor={BackgroundColor.backgroundMuted}
              size={AvatarFaviconSize.Lg}
              src={targetSubjectMetadata.iconUrl}
              name={title}
            />
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
          className="flex"
          alignItems={BoxAlignItems.Center}
          justifyContent={BoxJustifyContent.Center}
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
          {trustSignalState === TrustSignalDisplayState.Verified && (
            <Tooltip
              title={t('alertReasonOriginTrustSignalVerified')}
              position="bottom"
              style={{ display: 'flex', paddingTop: '2px' }}
            >
              <Icon
                name={IconName.VerifiedFilled}
                color={IconColor.successDefault}
                size={IconSize.Sm}
              />
            </Tooltip>
          )}
          {trustSignalState === TrustSignalDisplayState.Malicious && (
            <Tooltip
              title={t('trustSignalBlockTitle')}
              position="bottom"
              style={{ display: 'flex', paddingTop: '2px' }}
            >
              <Icon
                name={IconName.Danger}
                color={IconColor.errorDefault}
                size={IconSize.Sm}
              />
            </Tooltip>
          )}
        </Box>
        <Box className="flex" justifyContent={BoxJustifyContent.Center}>
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
        <Box marginTop={2}>
          <TextDS
            variant={TextVariantDS.BodySm}
            color={TextColorDS.TextAlternative}
            className="ml-4"
          >
            {t('accounts')}
          </TextDS>
          <Box
            backgroundColor={BoxBackgroundColor.BackgroundDefault}
            className="rounded-xl"
          >
            {selectedAccountGroupIds.map(renderAccountCell)}
          </Box>
          {selectedAccountGroupIds.length === 0 && (
            <Box
              className="flex multichain-connect-page__accounts-empty rounded-xl"
              justifyContent={BoxJustifyContent.Start}
              alignItems={BoxAlignItems.Center}
            >
              <ButtonLink onClick={setModeToEditAccounts} data-testid="edit">
                {t('selectAccountToConnect')}
              </ButtonLink>
            </Box>
          )}
          {selectedAccountGroupIds.length > 0 && (
            <Box
              className="flex"
              marginTop={4}
              justifyContent={BoxJustifyContent.Start}
              padding={4}
            >
              <Box
                className="flex multichain-connect-page__edit-icon rounded-md"
                marginRight={4}
                alignItems={BoxAlignItems.Center}
                justifyContent={BoxJustifyContent.Center}
                backgroundColor={BoxBackgroundColor.InfoMuted}
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
      </Content>
      <Footer>
        <Box
          flexDirection={BoxFlexDirection.Column}
          gap={4}
          className="flex w-full"
        >
          <Box gap={4} className="flex w-full">
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
              danger={trustSignalState === TrustSignalDisplayState.Malicious}
              startIconName={
                trustSignalState === TrustSignalDisplayState.Malicious
                  ? IconName.Danger
                  : undefined
              }
              disabled={selectedAccountGroupIds.length === 0}
            >
              {t('connect')}
            </Button>
          </Box>
        </Box>
      </Footer>
    </Page>
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
