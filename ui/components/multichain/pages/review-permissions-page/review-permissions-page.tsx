import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory, useParams } from 'react-router-dom';
import { NonEmptyArray } from '@metamask/utils';
import { isEvmAccountType } from '@metamask/keyring-api';
import {
  AlignItems,
  BackgroundColor,
  BlockSize,
  Display,
  FlexDirection,
  IconColor,
  JustifyContent,
  TextAlign,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import { getURLHost } from '../../../../helpers/utils/util';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import {
  getAccountsWithLabels,
  getConnectedSitesList,
  getNonTestNetworks,
  getOrderedConnectedAccountsForConnectedDapp,
  getPermissionSubjects,
  getPermittedAccountsByOrigin,
  getPermittedChainsForSelectedTab,
  getTestNetworks,
} from '../../../../selectors';
import {
  addMorePermittedAccounts,
  grantPermittedChains,
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
  ButtonIcon,
  ButtonIconSize,
  ButtonPrimary,
  ButtonPrimarySize,
  ButtonSize,
  ButtonVariant,
  Icon,
  IconName,
  IconSize,
  Text,
} from '../../../component-library';
import { ToastContainer, Toast } from '../..';
import { NoConnectionContent } from '../connections/components/no-connection';
import { Content, Footer, Header, Page } from '../page';
import {
  AccountType,
  SubjectsType,
} from '../connections/components/connections.types';
import { CONNECT_ROUTE } from '../../../../helpers/constants/routes';
import {
  DisconnectAllModal,
  DisconnectType,
} from '../../disconnect-all-modal/disconnect-all-modal';
import { SiteCell } from '.';

type UrlParams = {
  origin: string;
};

type PermittedAccountsByOrigin = {
  [key: string]: { address: string }[];
};

export const ReviewPermissions = () => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const history = useHistory();
  const urlParams = useParams<UrlParams>();
  const securedOrigin = decodeURIComponent(urlParams.origin);
  const [showAccountToast, setShowAccountToast] = useState(false);
  const [showNetworkToast, setShowNetworkToast] = useState(false);
  const [showDisconnectAllModal, setShowDisconnectAllModal] = useState(false);
  const activeTabOrigin: string = securedOrigin;

  // Define types for state
  const { openMetaMaskTabs }: { openMetaMaskTabs: Record<string, boolean> } =
    useSelector(
      (state: { appState: { openMetaMaskTabs: Record<string, boolean> } }) =>
        state.appState,
    );

  const { id }: { id: string } = useSelector(
    (state: { activeTab: { id: string } }) => state.activeTab,
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const subjectMetadata: { [key: string]: any } = useSelector(
    getConnectedSitesList,
  );
  const connectedSubjectsMetadata = subjectMetadata[activeTabOrigin];

  const connectedNetworks = useSelector((state) =>
    getPermittedChainsForSelectedTab(state, activeTabOrigin),
  ) as string[];

  const permittedAccountsByOrigin = useSelector(
    getPermittedAccountsByOrigin,
  ) as PermittedAccountsByOrigin;
  const networksList = useSelector(getNonTestNetworks);
  const testNetworks = useSelector(getTestNetworks);
  const combinedNetworks = [...networksList, ...testNetworks];

  const accountsWithLabels = useSelector(getAccountsWithLabels).filter(
    (account) => isEvmAccountType(account.type),
  );

  const connectedAccounts = useSelector((state) =>
    getOrderedConnectedAccountsForConnectedDapp(state, activeTabOrigin),
  ) as AccountType[];
  const connectedAccountAddresses = connectedAccounts.map((v) => v.address);

  const [selectedAccounts, setSelectedAccounts] = useState(
    connectedAccountAddresses,
  );
  const filterAccountsByAddress = accountsWithLabels.filter((account) =>
    selectedAccounts.includes(account.address),
  );

  const subjects = useSelector(getPermissionSubjects);

  const [selectedChainIds, setSelectedChainIds] = useState(connectedNetworks);
  const filteredNetworks = combinedNetworks.filter((network) =>
    selectedChainIds.includes(network.chainId),
  );

  const hostName = getURLHost(securedOrigin);
  const currentTabHasNoAccounts =
    !permittedAccountsByOrigin[activeTabOrigin]?.length;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let tabToConnect: { origin: any } = { origin: null }; // origin could be null or a string based on the connection status or screen view
  if (activeTabOrigin && currentTabHasNoAccounts && !openMetaMaskTabs[id]) {
    tabToConnect = {
      origin: activeTabOrigin,
    };
  }

  const requestAccountsAndChainPermissions = async () => {
    const requestId = await dispatch(
      requestAccountsAndChainPermissionsWithId(tabToConnect.origin),
    );
    history.push(`${CONNECT_ROUTE}/${requestId}`);
  };

  const disconnectAllAccounts = () => {
    const subject = (subjects as SubjectsType)[activeTabOrigin];

    if (subject) {
      const permissionMethodNames = Object.values(subject.permissions).map(
        ({ parentCapability }: { parentCapability: string }) =>
          parentCapability,
      ) as string[];
      if (permissionMethodNames.length > 0) {
        const permissionsRecord: Record<string, string[]> = {
          [activeTabOrigin]: permissionMethodNames,
        };

        dispatch(
          removePermissionsFor(
            permissionsRecord as Record<string, NonEmptyArray<string>>,
          ),
        );
      }
    }
  };

  const managePermittedAccounts = () => {
    const removedAccounts = connectedAccountAddresses.filter(
      (acc) => !selectedAccounts.includes(acc),
    );
    removedAccounts.forEach((account) => {
      dispatch(removePermittedAccount(activeTabOrigin, account));
    });

    const newAccounts = selectedAccounts.filter(
      (acc) => !connectedAccountAddresses.includes(acc),
    );
    if (newAccounts.length > 0) {
      dispatch(addMorePermittedAccounts(activeTabOrigin, newAccounts));
    }
  };

  const managePermittedChains = () => {
    grantPermittedChains(activeTabOrigin, selectedChainIds);

    const removedElements = connectedNetworks.filter(
      (chain) => !selectedChainIds.includes(chain),
    );

    // Dispatch removePermittedChains for each removed element
    removedElements.forEach((chain) => {
      removePermittedChain(activeTabOrigin, chain);
    });
  };

  const selectAccounts = (accounts) => {
    setSelectedAccounts(
      accounts.length > 0 ? accounts : [connectedAccountAddresses[0]],
    );
  };

  return (
    <Page
      data-testid="connections-page"
      className="main-container connections-page"
    >
      <>
        <Header
          backgroundColor={BackgroundColor.backgroundDefault}
          startAccessory={
            <ButtonIcon
              ariaLabel={t('back')}
              iconName={IconName.ArrowLeft}
              className="connections-header__start-accessory"
              size={ButtonIconSize.Sm}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              onClick={() => (history as any).goBack()}
            />
          }
        >
          <Box
            display={Display.Flex}
            alignItems={AlignItems.center}
            gap={2}
            justifyContent={JustifyContent.center}
            className="connections-header__title"
          >
            {connectedSubjectsMetadata?.iconUrl ? (
              <AvatarFavicon
                name={connectedSubjectsMetadata.name}
                size={AvatarFaviconSize.Sm}
                src={connectedSubjectsMetadata.iconUrl}
              />
            ) : (
              <Icon
                name={IconName.Global}
                size={IconSize.Sm}
                color={IconColor.iconDefault}
              />
            )}
            <Text
              as="span"
              variant={TextVariant.headingMd}
              textAlign={TextAlign.Center}
              ellipsis
            >
              {hostName}
            </Text>
          </Box>
        </Header>
        <Content padding={0}>
          {connectedAccounts.length > 0 ? (
            <SiteCell
              networks={filteredNetworks}
              accounts={filterAccountsByAddress}
              onAccountsClick={() => {
                managePermittedAccounts();
                setShowAccountToast(true);
              }}
              onNetworksClick={() => {
                managePermittedChains();
                setShowNetworkToast(true);
              }}
              // fix this
              selectedAccounts={selectedAccounts}
              selectedChainIds={selectedChainIds}
              setSelectedAccounts={selectAccounts}
              setSelectedChainIds={setSelectedChainIds}
              activeTabOrigin={activeTabOrigin}
              combinedNetworks={networksList}
              onDisconnectClick={() => setShowDisconnectAllModal(true)}
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
                disconnectAllAccounts();
                setShowDisconnectAllModal(false);
              }}
            />
          ) : null}
        </Content>
        <Footer>
          <>
            {connectedAccounts.length > 0 ? (
              <Box
                display={Display.Flex}
                flexDirection={FlexDirection.Column}
                width={BlockSize.Full}
                gap={2}
              >
                {showAccountToast ? (
                  <ToastContainer>
                    <Toast
                      text={t('accountPermissionToast', [hostName])}
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
                      text={t('networkPermissionToast', [hostName])}
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
                  onClick={disconnectAllAccounts}
                >
                  {t('disconnectAllAccounts')}
                </Button>
              </Box>
            ) : (
              <ButtonPrimary
                size={ButtonPrimarySize.Lg}
                block
                data-test-id="no-connections-button"
                onClick={requestAccountsAndChainPermissions}
              >
                {t('connectAccounts')}
              </ButtonPrimary>
            )}
          </>
        </Footer>
      </>
    </Page>
  );
};
