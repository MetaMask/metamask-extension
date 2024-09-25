import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory, useParams } from 'react-router-dom';
import { NonEmptyArray } from '@metamask/utils';
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
import { CONNECT_ROUTE } from '../../../../helpers/constants/routes';
import { getURLHost } from '../../../../helpers/utils/util';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import {
  getConnectedSitesList,
  getInternalAccounts,
  getOrderedConnectedAccountsForConnectedDapp,
  getPermissionSubjects,
  getPermittedAccountsByOrigin,
  getPermittedAccountsForSelectedTab,
  getSelectedAccount,
  getSubjectMetadata,
  getUnconnectedAccounts,
} from '../../../../selectors';
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
import { mergeAccounts } from '../../account-list-menu/account-list-menu';
import {
  AccountListItem,
  AccountListItemMenuTypes,
  Toast,
  ToastContainer,
} from '../..';
import { Content, Footer, Header, Page } from '../page';
import { ConnectAccountsModal } from '../../connect-accounts-modal/connect-accounts-modal';
import {
  requestAccountsPermissionWithId,
  removePermissionsFor,
} from '../../../../store/actions';
import {
  DisconnectAllModal,
  DisconnectType,
} from '../../disconnect-all-modal/disconnect-all-modal';
import {
  AccountType,
  ConnectedSites,
  SubjectsType,
} from './components/connections.types';
import { NoConnectionContent } from './components/no-connection';

export const Connections = () => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const history = useHistory();
  const [showConnectAccountsModal, setShowConnectAccountsModal] =
    useState(false);
  const [showDisconnectAllModal, setShowDisconnectAllModal] = useState(false);
  const [showAccountDisconnectedToast, setShowAccountDisconnectedToast] =
    useState(''); // This is not boolean because we need the account name from the menu when a single account is disconnected
  const [
    showConnectedAccountsUpdatedToast,
    setShowConnectedAccountsUpdatedToast,
  ] = useState(false);
  const [
    showDisconnectedAllAccountsUpdatedToast,
    setShowDisconnectedAllAccountsUpdatedToast,
  ] = useState(false);

  const urlParams: { origin: string } = useParams();
  const securedOrigin = decodeURIComponent(urlParams.origin);

  const activeTabOrigin: string = securedOrigin;
  // TODO: Replace `any` with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const subjectMetadata: { [key: string]: any } = useSelector(
    getConnectedSitesList,
  );
  const siteMetadata = useSelector(getSubjectMetadata);
  const connectedSiteMetadata = siteMetadata[activeTabOrigin];
  // TODO: Replace `any` with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { openMetaMaskTabs } = useSelector((state: any) => state.appState);
  // TODO: Replace `any` with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { id } = useSelector((state: any) => state.activeTab);
  const unconnectedAccounts = useSelector((state) =>
    getUnconnectedAccounts(state, activeTabOrigin),
  );
  const connectedAccounts = useSelector((state) =>
    getOrderedConnectedAccountsForConnectedDapp(state, activeTabOrigin),
  );
  const selectedAccount = useSelector(getSelectedAccount);
  const internalAccounts = useSelector(getInternalAccounts);
  const mergedAccounts = mergeAccounts(
    connectedAccounts,
    internalAccounts,
  ) as AccountType[];

  const permittedAccountsByOrigin = useSelector(
    getPermittedAccountsByOrigin,
    // TODO: Replace `any` with type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ) as { [key: string]: any[] };
  const subjects = useSelector(getPermissionSubjects);
  const currentTabHasNoAccounts =
    !permittedAccountsByOrigin[activeTabOrigin]?.length;
  // TODO: Replace `any` with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let tabToConnect: { origin: any } = { origin: null };
  if (activeTabOrigin && currentTabHasNoAccounts && !openMetaMaskTabs[id]) {
    tabToConnect = {
      origin: activeTabOrigin,
    };
  }
  const requestAccountsPermission = async () => {
    const requestId = await dispatch(
      requestAccountsPermissionWithId(tabToConnect.origin),
    );
    history.push(`${CONNECT_ROUTE}/${requestId}`);
  };
  const connectedSubjectsMetadata = subjectMetadata[activeTabOrigin];

  const permittedAccounts = useSelector((state) =>
    getPermittedAccountsForSelectedTab(state, activeTabOrigin),
  );

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

      setShowDisconnectAllModal(false);
      setShowDisconnectedAllAccountsUpdatedToast(true);
    }
  };

  // In the mergeAccounts, we need the lastSelected value to determine which connectedAccount was last selected.
  const latestSelected = mergedAccounts.findIndex(
    // TODO: Replace `any` with type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (_account: any, index: any) => {
      return (
        index ===
        mergedAccounts.reduce(
          (
            indexOfAccountWIthHighestLastSelected: number,
            currentAccountToCompare: AccountType,
            // TODO: Replace `any` with type
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            i: any,
          ) => {
            const currentLastSelected =
              currentAccountToCompare.metadata.lastSelected ?? 0;
            const accountAtIndexLastSelected = mergedAccounts[
              indexOfAccountWIthHighestLastSelected
            ].metadata.lastSelected
              ? i
              : indexOfAccountWIthHighestLastSelected;

            return currentLastSelected > accountAtIndexLastSelected
              ? i
              : indexOfAccountWIthHighestLastSelected;
          },
          0,
        )
      );
    },
  );

  return (
    <Page
      data-testid="connections-page"
      className="main-container connections-page"
    >
      <Header
        backgroundColor={BackgroundColor.backgroundDefault}
        startAccessory={
          <ButtonIcon
            ariaLabel={t('back')}
            iconName={IconName.ArrowLeft}
            className="connections-header__start-accessory"
            color={IconColor.iconDefault}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onClick={() => (history as any).goBack()}
            size={ButtonIconSize.Sm}
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
            {getURLHost(securedOrigin)}
          </Text>
        </Box>
      </Header>
      <Content padding={0}>
        {permittedAccounts.length > 0 && mergeAccounts.length > 0 ? (
          <Box>
            {/* TODO: Replace `any` with type */}
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {mergedAccounts.map((account: AccountType, index: any) => {
              const connectedSites: ConnectedSites = {};
              const connectedSite = connectedSites[account.address]?.find(
                ({ origin }) => origin === activeTabOrigin,
              );
              const isSelectedAccount =
                selectedAccount.address === account.address;
              // Match the index of latestSelected Account with the index of all the accounts and set the active status
              const mergedAccountsProps = {
                ...account,
                isAccountActive: index === latestSelected,
              };
              return (
                <AccountListItem
                  account={mergedAccountsProps}
                  key={account.address}
                  accountsCount={mergedAccounts.length}
                  selected={isSelectedAccount}
                  connectedAvatar={connectedSite?.iconUrl}
                  menuType={AccountListItemMenuTypes.Connection}
                  currentTabOrigin={activeTabOrigin}
                  isActive={
                    mergedAccountsProps.isAccountActive ? t('active') : null
                  }
                  onActionClick={setShowAccountDisconnectedToast}
                />
              );
            })}
          </Box>
        ) : (
          <NoConnectionContent />
        )}
        {showConnectAccountsModal ? (
          <ConnectAccountsModal
            onClose={() => setShowConnectAccountsModal(false)}
            onAccountsUpdate={() => setShowConnectedAccountsUpdatedToast(true)}
            activeTabOrigin={activeTabOrigin}
          />
        ) : null}
        {showDisconnectAllModal ? (
          <DisconnectAllModal
            type={DisconnectType.Account}
            hostname={activeTabOrigin}
            onClose={() => setShowDisconnectAllModal(false)}
            onClick={() => disconnectAllAccounts()}
          />
        ) : null}
      </Content>
      <Footer>
        <Box
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
          width={BlockSize.Full}
          gap={4}
        >
          {showConnectedAccountsUpdatedToast ? (
            <ToastContainer>
              <Toast
                text={t('connectedAccountsToast')}
                onClose={() => setShowConnectedAccountsUpdatedToast(false)}
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
          {showDisconnectedAllAccountsUpdatedToast ? (
            <ToastContainer>
              <Toast
                text={t('disconnectedAllAccountsToast', [
                  getURLHost(activeTabOrigin),
                ])}
                onClose={() =>
                  setShowDisconnectedAllAccountsUpdatedToast(false)
                }
                startAdornment={
                  <AvatarFavicon
                    name={connectedSiteMetadata?.name}
                    size={AvatarFaviconSize.Sm}
                    src={connectedSiteMetadata?.iconUrl}
                  />
                }
              />
            </ToastContainer>
          ) : null}
          {showAccountDisconnectedToast.length > 0 ? (
            <ToastContainer>
              <Toast
                text={t('disconnectedSingleAccountToast', [
                  showAccountDisconnectedToast,
                  getURLHost(activeTabOrigin),
                ])}
                onClose={() => setShowAccountDisconnectedToast('')}
                startAdornment={
                  <AvatarFavicon
                    name={connectedSiteMetadata?.name}
                    size={AvatarFaviconSize.Sm}
                    src={connectedSiteMetadata?.iconUrl}
                  />
                }
              />
            </ToastContainer>
          ) : null}
          {permittedAccounts.length > 0 && mergeAccounts.length > 0 ? (
            <Box
              display={Display.Flex}
              gap={2}
              flexDirection={FlexDirection.Column}
              width={BlockSize.Full}
              data-test-id="connections-button"
            >
              <Button
                size={ButtonSize.Lg}
                block
                variant={ButtonVariant.Secondary}
                disabled={unconnectedAccounts.length === 0}
                startIconName={IconName.Add}
                onClick={() => setShowConnectAccountsModal(true)}
              >
                {t('connectMoreAccounts')}
              </Button>
              <Button
                size={ButtonSize.Lg}
                block
                variant={ButtonVariant.Secondary}
                startIconName={IconName.Logout}
                danger
                onClick={() => setShowDisconnectAllModal(true)}
              >
                {t('disconnectAllAccounts')}
              </Button>
            </Box>
          ) : (
            <ButtonPrimary
              size={ButtonPrimarySize.Lg}
              block
              data-test-id="no-connections-button"
              onClick={() => dispatch(requestAccountsPermission())}
            >
              {t('connectAccounts')}
            </ButtonPrimary>
          )}
        </Box>
      </Footer>
    </Page>
  );
};
