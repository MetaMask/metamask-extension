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
import { uniq } from 'lodash';
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
  addPermittedAccounts,
  addPermittedChains,
  hidePermittedNetworkToast,
  removePermissionsFor,
  removePermittedAccount,
  removePermittedChain,
  requestAccountsAndChainPermissionsWithId,
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
import { CAIP_FORMATTED_EVM_TEST_CHAINS } from '../../../../../shared/constants/network';
import { SiteCell } from './site-cell/site-cell';

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

  const handleSelectChainIds = async (chainIds: string[]) => {
    if (chainIds.length === 0) {
      setShowDisconnectAllModal(true);
      return;
    }

    dispatch(addPermittedChains(activeTabOrigin, chainIds));

    connectedChainIds.forEach((chainId: string) => {
      if (!chainIds.includes(chainId)) {
        dispatch(removePermittedChain(activeTabOrigin, chainId));
      }
    });

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

    const parsedCaipAccountIds = caipAccountIds.map((caipAccountId) => {
      return parseCaipAccountId(caipAccountId);
    });

    const addresses = parsedCaipAccountIds.map(({ address }) => address);

    // TODO: we should refactor addPermittedAccounts to accept CaipAccountIds
    dispatch(addPermittedAccounts(activeTabOrigin, addresses));

    connectedAccountAddresses.forEach((connectedAddress: string) => {
      // TODO: seems like similar logic to selector logic in ui/index.js
      // See if we can DRY this
      const parsedConnectedAddress = parseCaipAccountId(
        connectedAddress as CaipAccountId,
      );

      const includesCaipAccountId = parsedCaipAccountIds.some(
        (parsedAddress) => {
          if (
            parsedConnectedAddress.chain.namespace !==
              parsedAddress.chain.namespace ||
            parsedConnectedAddress.address !== parsedAddress.address
          ) {
            return false;
          }

          return (
            parsedAddress.chain.reference === '0' ||
            parsedAddress.chain.reference ===
              parsedConnectedAddress.chain.reference
          );
        },
      );

      if (!includesCaipAccountId) {
        // TODO: we should refactor removePermittedAccount to accept CaipAccountIds
        dispatch(
          removePermittedAccount(
            activeTabOrigin,
            parsedConnectedAddress.address,
          ),
        );
      }
    });

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
              onSelectChainIds={handleSelectChainIds}
              selectedAccountAddresses={connectedAccountAddresses}
              selectedChainIds={connectedChainIds}
              hideAllToasts={hideAllToasts}
            />
          ) : (
            <NoConnectionContent />
          )}
          {showDisconnectAllModal ? (
            <DisconnectAllModal
              type={DisconnectType.Account}
              hostname={activeTabOrigin}
              onClose={() => setShowDisconnectAllModal(false)}
              onClick={() => {
                disconnectAllPermissions();
                setShowDisconnectAllModal(false);
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
