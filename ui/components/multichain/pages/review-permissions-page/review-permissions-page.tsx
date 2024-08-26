import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory, useParams } from 'react-router-dom';
import {
  AlignItems,
  BackgroundColor,
  Display,
  IconColor,
  JustifyContent,
  TextAlign,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import { getURLHost } from '../../../../helpers/utils/util';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import {
  getConnectedSitesList,
  getConnectedSitesListWithNetworkInfo,
  getNonTestNetworks,
  getOrderedConnectedAccountsForConnectedDapp,
  getOrderedNetworksList,
  getPermissionSubjects,
  getPermittedChainsByOrigin,
  getPermittedChainsForSelectedTab,
} from '../../../../selectors/index';
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
import { Content, Footer, Header, Page } from '../page';
import { SiteCell } from './index';

export const ReviewPermissions = () => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const history = useHistory();
  const urlParams: { origin: string } = useParams();
  const securedOrigin = decodeURIComponent(urlParams.origin);

  const activeTabOrigin: string = securedOrigin;
  const subjectMetadata = useSelector(getConnectedSitesList);
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

      console.log('all disconnected');
    }
  };
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
            {getURLHost(securedOrigin)}
          </Text>
        </Box>
      </Header>
      <Content padding={0}>
        <SiteCell networks={grantedNetworks} accounts={connectedAccounts} />
      </Content>
      <Footer>
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
      </Footer>
    </Page>
  );
};
