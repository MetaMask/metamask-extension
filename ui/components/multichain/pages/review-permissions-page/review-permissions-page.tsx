import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory, useParams } from 'react-router-dom';
import { NonEmptyArray } from '@metamask/utils';
import { InternalAccount, isEvmAccountType } from '@metamask/keyring-api';
import { NetworkConfiguration } from '@metamask/network-controller';
import {
  AlignItems,
  BlockSize,
  Display,
  FlexDirection,
} from '../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { getNetworkConfigurationsByChainId } from '../../../../../shared/modules/selectors/networks';
import {
  getConnectedSitesList,
  getInternalAccounts,
  getPermissionSubjects,
  getPermittedAccountsForSelectedTab,
  getPermittedChainsForSelectedTab,
  getShowPermittedNetworkToastOpen,
  getUpdatedAndSortedAccounts,
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
import { mergeAccounts } from '../../account-list-menu/account-list-menu';
import { MergedInternalAccount } from '../../../../selectors/selectors.types';
import { TEST_CHAINS } from '../../../../../shared/constants/network';
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

  const networkConfigurations = useSelector(getNetworkConfigurationsByChainId);
  const [nonTestNetworks, testNetworks] = useMemo(
    () =>
      Object.entries(networkConfigurations).reduce(
        ([nonTestNetworksList, testNetworksList], [chainId, network]) => {
          const isTest = (TEST_CHAINS as string[]).includes(chainId);
          (isTest ? testNetworksList : nonTestNetworksList).push(network);
          return [nonTestNetworksList, testNetworksList];
        },
        [[] as NetworkConfiguration[], [] as NetworkConfiguration[]],
      ),
    [networkConfigurations],
  );
  const connectedChainIds = useSelector((state) =>
    getPermittedChainsForSelectedTab(state, activeTabOrigin),
  ) as string[];

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

  const accounts = useSelector(getUpdatedAndSortedAccounts);
  const internalAccounts = useSelector(getInternalAccounts);
  const mergedAccounts: MergedInternalAccount[] = useMemo(() => {
    return mergeAccounts(accounts, internalAccounts).filter(
      (account: InternalAccount) => isEvmAccountType(account.type),
    );
  }, [accounts, internalAccounts]);

  const connectedAccountAddresses = useSelector((state) =>
    getPermittedAccountsForSelectedTab(state, activeTabOrigin),
  ) as string[];

  const handleSelectAccountAddresses = (addresses: string[]) => {
    if (addresses.length === 0) {
      setShowDisconnectAllModal(true);
      return;
    }

    dispatch(addPermittedAccounts(activeTabOrigin, addresses));

    connectedAccountAddresses.forEach((address: string) => {
      if (!addresses.includes(address)) {
        dispatch(removePermittedAccount(activeTabOrigin, address));
      }
    });

    setShowAccountToast(true);
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
              accounts={mergedAccounts}
              onSelectAccountAddresses={handleSelectAccountAddresses}
              onSelectChainIds={handleSelectChainIds}
              selectedAccountAddresses={connectedAccountAddresses}
              selectedChainIds={connectedChainIds}
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
