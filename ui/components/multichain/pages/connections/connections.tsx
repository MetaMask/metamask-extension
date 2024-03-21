import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
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
import {
  CONNECT_ROUTE,
  DEFAULT_ROUTE,
} from '../../../../helpers/constants/routes';
import { getURLHost } from '../../../../helpers/utils/util';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import {
  getConnectedSitesList,
  getInternalAccounts,
  getOrderedConnectedAccountsForActiveTab,
  getOriginOfCurrentTab,
  getPermissionSubjects,
  getPermittedAccountsByOrigin,
  getSelectedAccount,
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
import { Tab } from '../../../ui/tabs';
import Tabs from '../../../ui/tabs/tabs.component';
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

  const CONNECTED_ACCOUNTS_TAB_KEY = 'connected-accounts';
  const activeTabOrigin: string = useSelector(getOriginOfCurrentTab);
  const subjectMetadata: { [key: string]: any } = useSelector(
    getConnectedSitesList,
  );
  const { openMetaMaskTabs } = useSelector((state: any) => state.appState);
  const { id } = useSelector((state: any) => state.activeTab);

  const connectedAccounts = useSelector(
    getOrderedConnectedAccountsForActiveTab,
  );
  const selectedAccount = useSelector(getSelectedAccount);
  const internalAccounts = useSelector(getInternalAccounts);
  const mergedAccounts = mergeAccounts(connectedAccounts, internalAccounts);

  const permittedAccountsByOrigin = useSelector(
    getPermittedAccountsByOrigin,
  ) as { [key: string]: any[] };
  const subjects = useSelector(getPermissionSubjects);
  const currentTabHasNoAccounts =
    !permittedAccountsByOrigin[activeTabOrigin]?.length;
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
    (_account: any, index: any) => {
      return (
        index ===
        mergedAccounts.reduce(
          (
            acc: string | number,
            cur: { metadata: { lastSelected: number } },
            i: any,
          ) =>
            cur.metadata.lastSelected >
            mergedAccounts[acc].metadata.lastSelected
              ? i
              : acc,
          0,
        )
      );
    },
  );

  return (
    <Page data-testid="connections-page" className="connections-page">
      <Header
        backgroundColor={BackgroundColor.backgroundDefault}
        startAccessory={
          <ButtonIcon
            ariaLabel={t('back')}
            iconName={IconName.ArrowLeft}
            className="connections-header__start-accessory"
            color={IconColor.iconDefault}
            onClick={() => history.push(DEFAULT_ROUTE)}
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
            {getURLHost(activeTabOrigin)}
          </Text>
        </Box>
      </Header>
      <Content padding={0}>
        {connectedSubjectsMetadata && mergeAccounts.length > 0 ? (
          <Tabs defaultActiveTabKey="connections">
            {
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore
              <Tab
                tabKey={CONNECTED_ACCOUNTS_TAB_KEY}
                name={t('connectedaccountsTabKey')}
                padding={4}
              >
                {mergedAccounts.map((account: AccountType, index: any) => {
                  const connectedSites: ConnectedSites = {};
                  const connectedSite = connectedSites[account.address]?.find(
                    ({ origin }) => origin === activeTabOrigin,
                  );
                  const isSelectedAccount =
                    selectedAccount.address === account.address;
                  // Match the index of latestSelected Account with the index of all the accounts and set the active status
                  let mergedAccountsProps;
                  if (index === latestSelected) {
                    mergedAccountsProps = { ...account, isAccountActive: true };
                  } else {
                    mergedAccountsProps = { ...account };
                  }
                  return (
                    <AccountListItem
                      identity={mergedAccountsProps}
                      key={account.address}
                      accountsCount={mergedAccounts.length}
                      selected={isSelectedAccount}
                      connectedAvatar={connectedSite?.iconUrl}
                      connectedAvatarName={connectedSite?.name}
                      menuType={AccountListItemMenuTypes.Connection}
                      currentTabOrigin={activeTabOrigin}
                      isActive={
                        mergedAccountsProps.isAccountActive ? t('active') : null
                      }
                      onActionClick={setShowAccountDisconnectedToast}
                    />
                  );
                })}
              </Tab>
            }
          </Tabs>
        ) : (
          <NoConnectionContent />
        )}
        {showConnectAccountsModal ? (
          <ConnectAccountsModal
            onClose={() => setShowConnectAccountsModal(false)}
            onAccountsUpdate={() => setShowConnectedAccountsUpdatedToast(true)}
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
          {connectedSubjectsMetadata && mergeAccounts.length > 0 ? (
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
          {showConnectedAccountsUpdatedToast ? (
            <ToastContainer>
              <Toast
                text={t('connectedAccountsToast')}
                onClose={() => setShowConnectedAccountsUpdatedToast(false)}
                startAdornment={
                  <AvatarFavicon
                    name={connectedSubjectsMetadata.name}
                    size={AvatarFaviconSize.Sm}
                    src={connectedSubjectsMetadata.iconUrl}
                  />
                }
                actionText={''}
                onActionClick={() => null}
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
                startAdornment={''}
                actionText={''}
                onActionClick={() => null}
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
                    name={connectedSubjectsMetadata.name}
                    size={AvatarFaviconSize.Sm}
                    src={connectedSubjectsMetadata.iconUrl}
                  />
                }
                actionText={''}
                onActionClick={() => null}
              />
            </ToastContainer>
          ) : null}
        </Box>
      </Footer>
    </Page>
  );
};
