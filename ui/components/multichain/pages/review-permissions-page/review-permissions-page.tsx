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
import { getURLHost } from '../../../../helpers/utils/util';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import {
  getConnectedSitesList,
  getNonTestNetworks,
  getOrderedConnectedAccountsForConnectedDapp,
  getPermissionSubjects,
  getPermittedChainsForSelectedTab,
} from '../../../../selectors';
import { removePermissionsFor } from '../../../../store/actions';
import {
  AvatarFavicon,
  AvatarFaviconSize,
  Box,
  Button,
  ButtonIcon,
  ButtonIconSize,
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
import { SubjectsType } from '../connections/components/connections.types';
import { SiteCell } from '.';

export const ReviewPermissions = () => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const history = useHistory();
  const urlParams: { origin: string } = useParams();
  const securedOrigin = decodeURIComponent(urlParams.origin);
  const [showAccountToast, setShowAccountToast] = useState(false);
  const [showNetworkToast, setShowNetworkToast] = useState(false);
  const activeTabOrigin: string = securedOrigin;
  const subjectMetadata: { [key: string]: any } = useSelector(
    getConnectedSitesList,
  );
  const connectedSubjectsMetadata = subjectMetadata[activeTabOrigin];
  const connectedNetworks = useSelector((state) =>
    getPermittedChainsForSelectedTab(state, activeTabOrigin),
  );
  const networksList = useSelector(getNonTestNetworks);
  const connectedAccounts = useSelector((state) =>
    getOrderedConnectedAccountsForConnectedDapp(state, activeTabOrigin),
  );
  const subjects = useSelector(getPermissionSubjects);
  const grantedNetworks = networksList.filter(
    (net: { chainId: any }) => connectedNetworks.indexOf(net.chainId) !== -1,
  );
  const hostName = getURLHost(securedOrigin);
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
  return (
    <Page
      data-testid="connections-page"
      className="main-container connections-page"
    >
      {connectedAccounts.length > 0 ? (
        <>
          <Header
            backgroundColor={BackgroundColor.backgroundDefault}
            startAccessory={
              <ButtonIcon
                ariaLabel={t('back')}
                iconName={IconName.ArrowLeft}
                className="connections-header__start-accessory"
                size={ButtonIconSize.Sm}
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
            <SiteCell
              networks={grantedNetworks}
              accounts={connectedAccounts}
              onAccountsClick={() => setShowAccountToast(true)}
              onNetworksClick={() => setShowNetworkToast(true)}
            />
          </Content>
          <Footer>
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
                onClick={() => disconnectAllAccounts()}
              >
                {t('disconnectAllAccounts')}
              </Button>
            </Box>
          </Footer>{' '}
        </>
      ) : (
        <NoConnectionContent />
      )}
    </Page>
  );
};
