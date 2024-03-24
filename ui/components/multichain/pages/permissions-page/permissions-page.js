import classnames from 'classnames';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Content, Header, Page } from '../page';
import {
  Box,
  ButtonIcon,
  ButtonIconSize,
  IconName,
  Text,
} from '../../../component-library';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import {
  BackgroundColor,
  BlockSize,
  Color,
  Display,
  FlexDirection,
  JustifyContent,
  TextAlign,
  TextColor,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import {
  CONNECTIONS,
  DEFAULT_ROUTE,
} from '../../../../helpers/constants/routes';
import {
  getOnboardedInThisUISession,
  getShowPermissionsTour,
  getConnectedSitesListWithNetworkInfo,
  getConnectedSnapsList,
} from '../../../../selectors';
import { Tab, Tabs } from '../../../ui/tabs';
import { ProductTour } from '../../product-tour-popover';
import { getURLHost } from '../../../../helpers/utils/util';
import { hidePermissionsTour } from '../../../../store/actions';
import { ConnectionListItem } from './connection-list-item';

const TABS_THRESHOLD = 5;

export const PermissionsPage = () => {
  const t = useI18nContext();
  const history = useHistory();
  const headerRef = useRef();
  const [totalConnections, setTotalConnections] = useState(0);
  const sitesConnectionsList = useSelector(
    getConnectedSitesListWithNetworkInfo,
  );
  const snapsConnectionsList = useSelector(getConnectedSnapsList);
  const showPermissionsTour = useSelector(getShowPermissionsTour);
  const onboardedInThisUISession = useSelector(getOnboardedInThisUISession);

  useEffect(() => {
    setTotalConnections(
      Object.keys(sitesConnectionsList).length +
        Object.keys(snapsConnectionsList).length,
    );
  }, [sitesConnectionsList, snapsConnectionsList]);

  const shouldShowTabsView = useMemo(() => {
    return (
      totalConnections > TABS_THRESHOLD &&
      Object.keys(sitesConnectionsList).length > 0 &&
      Object.keys(snapsConnectionsList).length > 0
    );
  }, [totalConnections, sitesConnectionsList, snapsConnectionsList]);

  const handleConnectionClick = (connection) => {
    const hostName = getURLHost(connection.origin);
    const safeEncodedHost = encodeURIComponent(hostName);
    history.push(`${CONNECTIONS}/${safeEncodedHost}`);
  };

  const renderConnectionsList = (connectionList) =>
    Object.entries(connectionList).map(([itemKey, connection]) => {
      return (
        <ConnectionListItem
          data-testid="connection-list-item"
          key={itemKey}
          connection={connection}
          onClick={() => handleConnectionClick(connection)}
        />
      );
    });

  return (
    <Page data-testid="permissions-page">
      <Header
        backgroundColor={BackgroundColor.backgroundDefault}
        startAccessory={
          <ButtonIcon
            ariaLabel={t('back')}
            iconName={IconName.ArrowLeft}
            className="connections-header__start-accessory"
            color={Color.iconDefault}
            onClick={() => history.push(DEFAULT_ROUTE)}
            size={ButtonIconSize.Sm}
          />
        }
      >
        <Text
          as="span"
          variant={TextVariant.headingMd}
          textAlign={TextAlign.Center}
        >
          {t('permissions')}
        </Text>
      </Header>
      {showPermissionsTour && !onboardedInThisUISession ? (
        <ProductTour
          closeMenu={hidePermissionsTour}
          className={classnames(
            'multichain-product-tour-menu__permissions-page-tour',
          )}
          data-testid="permissions-page-product-tour"
          anchorElement={headerRef.current}
          title={t('permissionsPageTourTitle')}
          description={t('permissionsPageTourDescription')}
          onClick={hidePermissionsTour}
          positionObj="44%"
        />
      ) : null}
      <Content>
        <Box ref={headerRef}></Box>
        {shouldShowTabsView ? (
          <Tabs tabsClassName="permissions-page__tabs">
            <Tab
              data-testid="permissions-page-sites-tab"
              name={t('sites')}
              tabKey="sites"
            >
              {renderConnectionsList(sitesConnectionsList)}
            </Tab>
            <Tab
              data-testid="permissions-page-snaps-tab"
              name={t('snaps')}
              tabKey="snaps"
            >
              {renderConnectionsList(snapsConnectionsList)}
            </Tab>
          </Tabs>
        ) : (
          <>
            {Object.keys(sitesConnectionsList).length > 0 && (
              <>
                <Text
                  data-testid="sites-connections"
                  backgroundColor={BackgroundColor.backgroundDefault}
                  variant={TextVariant.bodyLgMedium}
                  textAlign={TextAlign.Center}
                  padding={4}
                >
                  {t('siteConnections')}
                </Text>
                {renderConnectionsList(sitesConnectionsList)}
              </>
            )}
            {Object.keys(snapsConnectionsList).length > 0 && (
              <>
                <Text
                  data-testid="snaps-connections"
                  variant={TextVariant.bodyLgMedium}
                  backgroundColor={BackgroundColor.backgroundDefault}
                  textAlign={TextAlign.Center}
                  padding={4}
                >
                  {t('snapConnections')}
                </Text>
                {renderConnectionsList(snapsConnectionsList)}
              </>
            )}
          </>
        )}
        {totalConnections === 0 ? (
          <Box
            data-testid="no-connections"
            display={Display.Flex}
            flexDirection={FlexDirection.Column}
            justifyContent={JustifyContent.center}
            height={BlockSize.Full}
            gap={2}
          >
            <Text
              variant={TextVariant.bodyMdMedium}
              backgroundColor={BackgroundColor.backgroundDefault}
              textAlign={TextAlign.Center}
            >
              {t('permissionsPageEmptyContent')}
            </Text>
            <Text
              variant={TextVariant.bodyMd}
              color={TextColor.textAlternative}
              backgroundColor={BackgroundColor.backgroundDefault}
              textAlign={TextAlign.Center}
            >
              {t('permissionsPageEmptySubContent')}
            </Text>
          </Box>
        ) : null}
      </Content>
    </Page>
  );
};
