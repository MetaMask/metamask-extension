import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory, useParams } from 'react-router-dom';
import {
  CaipAccountId,
  CaipChainId,
  NonEmptyArray,
  parseCaipAccountId,
  KnownCaipNamespace,
  Hex,
} from '@metamask/utils';
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
import { useRevokeGatorPermissions } from '../../../../hooks/gator-permissions/useRevokeGatorPermissions';
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
import { DisconnectPermissionsModal } from '../../disconnect-permissions-modal';
import { PermissionsHeader } from '../../permissions-header/permissions-header';
import {
  EvmAndMultichainNetworkConfigurationsWithCaipChainId,
  MergedInternalAccountWithCaipAccountId,
} from '../../../../selectors/selectors.types';
import {
  GatorPermissionState,
  getFilteredGatorPermissionsByType,
} from '../../../../selectors/gator-permissions/gator-permissions';
import { SiteCell } from './site-cell/site-cell';
import { PermissionsCell } from './permissions-cell/permissions-cell';

// Custom hook to handle revoking gator permissions across multiple chain IDs so we don't violate calling hooks in a function.
const useMultiChainGatorRevoke = (chainIds: string[]) => {
  const revokeFunctions: Record<string, unknown> = {};

  chainIds.forEach((chainId) => {
    const { revokeGatorPermissionBatch } = useRevokeGatorPermissions({
      chainId: chainId as Hex,
    });
    revokeFunctions[chainId] = revokeGatorPermissionBatch;
  });

  return revokeFunctions;
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
  const [showDisconnectPermissionsModal, setShowDisconnectPermissionsModal] =
    useState(false);
  const activeTabOrigin: string = securedOrigin;

  const showPermittedNetworkToastOpen = useSelector(
    getShowPermittedNetworkToastOpen,
  );

  useEffect(() => {
    if (showPermittedNetworkToastOpen) {
      setShowNetworkToast(showPermittedNetworkToastOpen);
      dispatch(hidePermittedNetworkToast());
    }
  }, [showPermittedNetworkToastOpen, dispatch]);

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

  // Get filtered gator permissions grouped by type
  const filteredGatorPermissions = useSelector((state: GatorPermissionState) =>
    getFilteredGatorPermissionsByType(state, activeTabOrigin),
  );

  // Get all gator permissions for the site (for the modal)
  const allSiteGatorPermissions = useMemo(() => {
    return filteredGatorPermissions.permissions;
  }, [filteredGatorPermissions]);

  // Get all unique chain IDs from gator permissions
  const uniqueGatorChainIds = useMemo(() => {
    const chainIds = new Set<string>();
    allSiteGatorPermissions.forEach(({ chainId }) => {
      chainIds.add(chainId);
    });
    return Array.from(chainIds);
  }, [allSiteGatorPermissions]);

  // Get revoke functions for each unique chain ID
  const revokeFunctionsByChainId =
    useMultiChainGatorRevoke(uniqueGatorChainIds);

  const removeAllPermissionsIncludingGator = async () => {
    // First, remove all regular permissions
    disconnectAllPermissions();

    // Then, revoke all gator permissions grouped by chain ID
    if (allSiteGatorPermissions.length > 0) {
      // Group gator permissions by chain ID
      const gatorPermissionsByChainId = allSiteGatorPermissions.reduce(
        (acc, { permission, chainId }) => {
          if (!acc[chainId]) {
            acc[chainId] = [];
          }
          acc[chainId].push(permission);
          return acc;
        },
        {} as Record<string, unknown[]>,
      );

      // Revoke gator permissions for each chain ID
      for (const [chainId, permissions] of Object.entries(
        gatorPermissionsByChainId,
      )) {
        try {
          const revokeFunction = revokeFunctionsByChainId[chainId];
          if (
            revokeFunction &&
            revokeFunction instanceof Function &&
            permissions.length > 0
          ) {
            await revokeFunction(permissions);
          }
        } catch (error) {
          console.error(
            `Failed to revoke gator permissions for chain ${chainId}:`,
            error,
          );
        }
      }
    }
  };

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
          {filteredGatorPermissions.count > 0 ? (
            <PermissionsCell
              nonTestNetworks={nonTestNetworks}
              testNetworks={testNetworks}
              totalCount={filteredGatorPermissions.count}
              chainIds={filteredGatorPermissions.chains}
              paddingTop={connectedAccountAddresses.length === 0 ? 4 : 0}
            />
          ) : null}
          {connectedAccountAddresses.length === 0 &&
          filteredGatorPermissions.count === 0 ? (
            <NoConnectionContent />
          ) : null}
          {showDisconnectAllModal ? (
            <DisconnectAllModal
              type={DisconnectType.Account}
              hostname={activeTabOrigin}
              onClose={() => setShowDisconnectAllModal(false)}
              onClick={() => {
                trace({ name: TraceName.DisconnectAllModal });
                // Check if there are active gator permissions
                if (filteredGatorPermissions.count > 0) {
                  // Close disconnect modal and show other permissions modal
                  setShowDisconnectAllModal(false);
                  setShowDisconnectPermissionsModal(true);
                } else {
                  // No other permissions, proceed with normal disconnect
                  disconnectAllPermissions();
                  setShowDisconnectAllModal(false);
                }
                endTrace({ name: TraceName.DisconnectAllModal });
              }}
            />
          ) : null}
          {showDisconnectPermissionsModal ? (
            <DisconnectPermissionsModal
              isOpen={showDisconnectPermissionsModal}
              onClose={() => setShowDisconnectPermissionsModal(false)}
              onSkip={() => {
                // Skip removing other permissions, proceed with normal disconnect
                setShowDisconnectPermissionsModal(false);
                disconnectAllPermissions();
              }}
              onRemoveAll={() => {
                // Remove all permissions including gator permissions
                removeAllPermissionsIncludingGator();
                setShowDisconnectPermissionsModal(false);
              }}
              permissions={allSiteGatorPermissions}
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
