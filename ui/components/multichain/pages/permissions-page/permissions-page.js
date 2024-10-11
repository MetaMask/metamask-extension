import classnames from 'classnames';
import React, { useEffect, useRef, useState } from 'react';
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
  DEFAULT_ROUTE,
  REVIEW_PERMISSIONS,
} from '../../../../helpers/constants/routes';
import {
  getOnboardedInThisUISession,
  getShowPermissionsTour,
  getConnectedSitesListWithNetworkInfo,
} from '../../../../selectors';
import { ProductTour } from '../../product-tour-popover';
import { hidePermissionsTour } from '../../../../store/actions';
import { isSnapId } from '../../../../helpers/utils/snaps';
import { ConnectionListItem } from './connection-list-item';

export const PermissionsPage = () => {
  const t = useI18nContext();
  const history = useHistory();
  const headerRef = useRef();
  const [totalConnections, setTotalConnections] = useState(0);
  const sitesConnectionsList = useSelector(
    getConnectedSitesListWithNetworkInfo,
  );
  const showPermissionsTour = useSelector(getShowPermissionsTour);
  const onboardedInThisUISession = useSelector(getOnboardedInThisUISession);

  useEffect(() => {
    setTotalConnections(Object.keys(sitesConnectionsList).length);
  }, [sitesConnectionsList]);

  const handleConnectionClick = (connection) => {
    const hostName = connection.origin;
    const safeEncodedHost = encodeURIComponent(hostName);

    history.push(`${REVIEW_PERMISSIONS}/${safeEncodedHost}`);
  };

  const renderConnectionsList = (connectionList) =>
    Object.entries(connectionList).map(([itemKey, connection]) => {
      const isSnap = isSnapId(connection.origin);
      return isSnap ? null : (
        <ConnectionListItem
          data-testid="connection-list-item"
          key={itemKey}
          connection={connection}
          onClick={() => handleConnectionClick(connection)}
        />
      );
    });

  return (
    <Page className="main-container" data-testid="permissions-page">
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
      <Content padding={0}>
        <Box ref={headerRef}></Box>
        {totalConnections > 0 ? (
          renderConnectionsList(sitesConnectionsList)
        ) : (
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
        )}
      </Content>
    </Page>
  );
};
