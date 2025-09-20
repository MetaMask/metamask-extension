import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory, useParams } from 'react-router-dom';
import {
  CaipAccountId,
  CaipChainId,
  NonEmptyArray,
  parseCaipAccountId,
  KnownCaipNamespace,
} from '@metamask/utils';
import type {
  GatorPermissionsMap,
  StoredGatorPermissionSanitized,
  SignerParam,
  PermissionTypes,
} from '@metamask/gator-permissions-controller';
import { uniq } from 'lodash';
import { CAIP_FORMATTED_EVM_TEST_CHAINS } from '../../../../../shared/constants/network';
import { endTrace, trace, TraceName } from '../../../../../shared/lib/trace';
import {
  AlignItems,
  BlockSize,
  Display,
  FlexDirection,
} from '../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { getAllNetworkConfigurationsByCaipChainId } from '../../../../../shared/modules/selectors/networks';
import {
  getAllPermittedAccountsForSelectedTab,
  getAllPermittedChainsForSelectedTab,
  getConnectedSitesList,
  getPermissionSubjects,
  getShowPermittedNetworkToastOpen,
  getUpdatedAndSortedAccountsWithCaipAccountId,
} from '../../../../selectors';
import {
  hidePermittedNetworkToast,
  removePermissionsFor,
  requestAccountsAndChainPermissionsWithId,
  setPermittedAccounts,
  setPermittedChains,
} from '../../../../store/actions';
import {
  AvatarFavicon,
  AvatarFaviconSize,
  Box,
  Button,
  ButtonPrimary,
  ButtonPrimarySize,
  ButtonSize,
  ButtonVariant,
  IconName,
} from '../../../component-library';
import { ToastContainer, Toast } from '../..';
import { NoConnectionContent } from '../connections/components/no-connection';
import { Content, Footer, Page } from '../page';
import { SubjectsType } from '../connections/components/connections.types';
import { CONNECT_ROUTE } from '../../../../helpers/constants/routes';
import {
  DisconnectAllModal,
  DisconnectType,
} from '../../disconnect-all-modal/disconnect-all-modal';
import { PermissionsHeader } from '../../permissions-header/permissions-header';
import {
  EvmAndMultichainNetworkConfigurationsWithCaipChainId,
  MergedInternalAccountWithCaipAccountId,
} from '../../../../selectors/selectors.types';
import { getGatorPermissionsMap } from '../../../../selectors/gator-permissions/gator-permissions';
import { SiteCell } from './site-cell/site-cell';
import { PermissionsCell } from './permissions-cell/permissions-cell';

/**
 * Filters and groups gator permissions by type and site origin, returning counts and chain lists.
 *
 * This function takes the full gator permissions map and filters it to return
 * only permissions that match the specified site origin.
 * It groups the results into two main categories:
 * - streams: Combined count of native-token-stream and erc20-token-stream permissions
 * - subscriptions: Combined count of native-token-periodic and erc20-token-periodic permissions
 * Each category includes a list of all chains on which these permissions occur.
 *
 * @param gatorPermissions - The gator permissions map to filter
 * @param siteOrigin - The site origin to filter by (e.g., 'https://example.com')
 * @returns Object with counts and chain lists for streams and subscriptions
 */
const getFilteredGatorPermissionsByType = (
  gatorPermissions: GatorPermissionsMap,
  siteOrigin: string,
) => {
  const result = {
    streams: {
      count: 0,
      chains: new Set<string>(),
    },
    subscriptions: {
      count: 0,
      chains: new Set<string>(),
    },
  };

  // Process stream permissions (native-token-stream + erc20-token-stream)
  const streamTypes: (keyof GatorPermissionsMap)[] = [
    'native-token-stream',
    'erc20-token-stream',
  ];
  streamTypes.forEach((permissionType) => {
    const permissionsForType = gatorPermissions[permissionType];
    if (permissionsForType) {
      Object.entries(permissionsForType).forEach(([chainId, permissions]) => {
        // Filter permissions by site origin
        const filteredPermissions = permissions.filter(
          (
            permission: StoredGatorPermissionSanitized<
              SignerParam,
              PermissionTypes
            >,
          ) => permission.siteOrigin.toLowerCase() === siteOrigin.toLowerCase(),
        );

        if (filteredPermissions.length > 0) {
          result.streams.count += filteredPermissions.length;
          result.streams.chains.add(chainId);
        }
      });
    }
  });

  // Process subscription permissions (native-token-periodic + erc20-token-periodic)
  const subscriptionTypes: (keyof GatorPermissionsMap)[] = [
    'native-token-periodic',
    'erc20-token-periodic',
  ];
  subscriptionTypes.forEach((permissionType) => {
    const permissionsForType = gatorPermissions[permissionType];
    if (permissionsForType) {
      Object.entries(permissionsForType).forEach(([chainId, permissions]) => {
        // Filter permissions by site origin
        const filteredPermissions = permissions.filter(
          (
            permission: StoredGatorPermissionSanitized<
              SignerParam,
              PermissionTypes
            >,
          ) => permission.siteOrigin.toLowerCase() === siteOrigin.toLowerCase(),
        );

        if (filteredPermissions.length > 0) {
          result.subscriptions.count += filteredPermissions.length;
          result.subscriptions.chains.add(chainId);
        }
      });
    }
  });

  // Convert Sets to arrays for the final result
  return {
    streams: {
      count: result.streams.count,
      chains: Array.from(result.streams.chains),
    },
    subscriptions: {
      count: result.subscriptions.count,
      chains: Array.from(result.subscriptions.chains),
    },
  };
};

export const ReviewPermissions = () => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const history = useHistory();
  const urlParams = useParams<{ origin: string }>();
  // @ts-expect-error TODO: Fix this type error by handling undefined parameters
  const securedOrigin = decodeURIComponent(urlParams.origin);
  const [showAccountToast, setShowAccountToast] = useState(false);
  const [showNetworkToast, setShowNetworkToast] = useState(false);
  const [showDisconnectAllModal, setShowDisconnectAllModal] = useState(false);
  const activeTabOrigin: string = securedOrigin;

  const showPermittedNetworkToastOpen = useSelector(
    getShowPermittedNetworkToastOpen,
  );

  useEffect(() => {
    if (showPermittedNetworkToastOpen) {
      setShowNetworkToast(showPermittedNetworkToastOpen);
      dispatch(hidePermittedNetworkToast());
    }
  }, [showPermittedNetworkToastOpen]);

  const requestAccountsAndChainPermissions = async () => {
    const requestId = await dispatch(
      requestAccountsAndChainPermissionsWithId(activeTabOrigin),
    );
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31893
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    history.push(`${CONNECT_ROUTE}/${requestId}`);
  };

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const subjectMetadata: { [key: string]: any } = useSelector(
    getConnectedSitesList,
  );
  const connectedSubjectsMetadata = subjectMetadata[activeTabOrigin];
  const subjects = useSelector(getPermissionSubjects);

  const disconnectAllPermissions = () => {
    const subject = (subjects as SubjectsType)[activeTabOrigin];

    if (subject) {
      const permissionMethodNames = Object.values(subject.permissions).map(
        ({ parentCapability }: { parentCapability: string }) =>
          parentCapability,
      ) as string[];
      if (permissionMethodNames.length > 0) {
        const permissionsRecord = {
          [activeTabOrigin]: permissionMethodNames as NonEmptyArray<string>,
        };

        dispatch(removePermissionsFor(permissionsRecord));
      }
    }
    dispatch(hidePermittedNetworkToast());
  };

  const networkConfigurationsByCaipChainId = useSelector(
    getAllNetworkConfigurationsByCaipChainId,
  );

  const [nonTestNetworks, testNetworks] = useMemo(
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

  const connectedChainIds = useSelector((state) =>
    getAllPermittedChainsForSelectedTab(state, activeTabOrigin),
  ) as CaipChainId[];

  const gatorPermissions = useSelector(getGatorPermissionsMap);

  // Get filtered gator permissions grouped by type
  const filteredGatorPermissions = useMemo(() => {
    return getFilteredGatorPermissionsByType(gatorPermissions, activeTabOrigin);
  }, [gatorPermissions, activeTabOrigin]);

  const handleSelectChainIds = async (chainIds: string[]) => {
    if (chainIds.length === 0) {
      setShowDisconnectAllModal(true);
      return;
    }

    dispatch(setPermittedChains(activeTabOrigin, chainIds));

    setShowNetworkToast(true);
  };

  const allAccounts = useSelector(
    getUpdatedAndSortedAccountsWithCaipAccountId,
  ) as MergedInternalAccountWithCaipAccountId[];

  const nonRemappedConnectedAccountAddresses = useSelector((state) =>
    getAllPermittedAccountsForSelectedTab(state, activeTabOrigin),
  ) as CaipAccountId[];

  // This remaps EVM caip account addresses to match the 'eip155:0'
  // value that is currently set in InternalAccount.scopes[0] for
  // EOA EVM accounts. This logic will need to be updated to
  // support non EOA accounts.
  const connectedAccountAddresses = uniq(
    nonRemappedConnectedAccountAddresses.map((caipAccountId) => {
      const {
        address,
        chain: { namespace },
      } = parseCaipAccountId(caipAccountId);
      if (namespace === KnownCaipNamespace.Eip155) {
        // this is very hacky, but it works for now
        return `eip155:0:${address}` as CaipAccountId;
      }
      return caipAccountId;
    }),
  );

  const handleSelectAccountAddresses = (caipAccountIds: CaipAccountId[]) => {
    if (caipAccountIds.length === 0) {
      setShowDisconnectAllModal(true);
      return;
    }

    dispatch(setPermittedAccounts(activeTabOrigin, caipAccountIds));

    setShowAccountToast(true);
  };

  const hideAllToasts = () => {
    setShowAccountToast(false);
    setShowNetworkToast(false);
  };

  return (
    <Page
      data-testid="connections-page"
      className="main-container connections-page"
    >
      <>
        <PermissionsHeader
          securedOrigin={securedOrigin}
          connectedSubjectsMetadata={connectedSubjectsMetadata}
        />
        <Content padding={0}>
          {connectedAccountAddresses.length > 0 ? (
            <SiteCell
              nonTestNetworks={nonTestNetworks}
              testNetworks={testNetworks}
              accounts={allAccounts}
              onSelectAccountAddresses={handleSelectAccountAddresses}
              // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31879
              // eslint-disable-next-line @typescript-eslint/no-misused-promises
              onSelectChainIds={handleSelectChainIds}
              selectedAccountAddresses={connectedAccountAddresses}
              selectedChainIds={connectedChainIds}
              hideAllToasts={hideAllToasts}
            />
          ) : null}
          {filteredGatorPermissions.streams.count > 0 ||
          filteredGatorPermissions.subscriptions.count > 0 ? (
            <PermissionsCell
              nonTestNetworks={nonTestNetworks}
              testNetworks={testNetworks}
              streamsCount={filteredGatorPermissions.streams.count}
              subscriptionsCount={filteredGatorPermissions.subscriptions.count}
              streamsChainIds={filteredGatorPermissions.streams.chains}
              subscriptionsChainIds={
                filteredGatorPermissions.subscriptions.chains
              }
            />
          ) : null}
          {connectedAccountAddresses.length === 0 &&
          filteredGatorPermissions.streams.count === 0 &&
          filteredGatorPermissions.subscriptions.count === 0 ? (
            <NoConnectionContent />
          ) : null}
          {showDisconnectAllModal ? (
            <DisconnectAllModal
              type={DisconnectType.Account}
              hostname={activeTabOrigin}
              onClose={() => setShowDisconnectAllModal(false)}
              onClick={() => {
                trace({ name: TraceName.DisconnectAllModal });
                disconnectAllPermissions();
                setShowDisconnectAllModal(false);
                endTrace({ name: TraceName.DisconnectAllModal });
              }}
            />
          ) : null}
        </Content>
        <Footer>
          <>
            {connectedAccountAddresses.length > 0 ? (
              <Box
                display={Display.Flex}
                flexDirection={FlexDirection.Column}
                width={BlockSize.Full}
                gap={2}
                alignItems={AlignItems.center}
              >
                {showAccountToast ? (
                  <ToastContainer>
                    <Toast
                      text={t('accountPermissionToast')}
                      onClose={() => setShowAccountToast(false)}
                      startAdornment={
                        <AvatarFavicon
                          name={connectedSubjectsMetadata?.name}
                          size={AvatarFaviconSize.Sm}
                          src={connectedSubjectsMetadata?.iconUrl}
                        />
                      }
                    />
                  </ToastContainer>
                ) : null}
                {showNetworkToast ? (
                  <ToastContainer>
                    <Toast
                      text={t('networkPermissionToast')}
                      onClose={() => setShowNetworkToast(false)}
                      startAdornment={
                        <AvatarFavicon
                          name={connectedSubjectsMetadata?.name}
                          size={AvatarFaviconSize.Sm}
                          src={connectedSubjectsMetadata?.iconUrl}
                        />
                      }
                    />
                  </ToastContainer>
                ) : null}
                <Button
                  size={ButtonSize.Lg}
                  block
                  variant={ButtonVariant.Secondary}
                  startIconName={IconName.Logout}
                  danger
                  onClick={() => setShowDisconnectAllModal(true)}
                  data-test-id="disconnect-all"
                >
                  {t('disconnect')}
                </Button>
              </Box>
            ) : (
              <>
                {connectedAccountAddresses.length > 0 ? (
                  <ButtonPrimary
                    size={ButtonPrimarySize.Lg}
                    block
                    data-test-id="no-connections-button"
                    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31879
                    // eslint-disable-next-line @typescript-eslint/no-misused-promises
                    onClick={requestAccountsAndChainPermissions}
                  >
                    {t('connectAccounts')}
                  </ButtonPrimary>
                ) : null}
              </>
            )}
          </>
        </Footer>
      </>
    </Page>
  );
};
