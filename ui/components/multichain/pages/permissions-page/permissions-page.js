import React, { useEffect, useRef, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { isSnapId } from '@metamask/snaps-utils';
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
  getConnectedSitesListWithNetworkInfo,
  getGatorPermissions,
} from '../../../../selectors';
import { ConnectionListItem } from './connection-list-item';
import { GatorPermissionItem } from './gator-permission-item';

// TODO: Gator - Shows a list of all connected sites/dapps
export const PermissionsPage = () => {
  const t = useI18nContext();
  const history = useHistory();
  const headerRef = useRef();
  const [totalConnections, setTotalConnections] = useState(0);
  const sitesConnectionsList = useSelector(
    getConnectedSitesListWithNetworkInfo,
  );
  const gatorPermissionsList = useSelector(getGatorPermissions);

  useEffect(() => {
    const totalSites = Object.keys(sitesConnectionsList).length;
    const totalGatorPermissions = Object.keys(gatorPermissionsList).length;
    setTotalConnections(totalSites + totalGatorPermissions);
  }, [sitesConnectionsList, gatorPermissionsList]);

  const handleConnectionClick = (connection) => {
    const hostName = connection.origin;
    const safeEncodedHost = encodeURIComponent(hostName);

    history.push(`${REVIEW_PERMISSIONS}/${safeEncodedHost}`);
  };

  const handleGatorPermissionClick = (origin) => {
    const safeEncodedHost = encodeURIComponent(origin);
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

  const renderGatorPermissions = (gatorPermissions) =>
    Object.entries(gatorPermissions).map(([origin, permission]) => (
      <GatorPermissionItem
        data-testid="gator-7715-permission-item"
        key={`gator-7715-${origin}-${permission.id}`}
        permission={permission}
        origin={origin}
        onClick={() => handleGatorPermissionClick(origin)}
      />
    ));

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
      <Content padding={0}>
        <Box ref={headerRef}></Box>
        {totalConnections > 0 ? (
          <Box>
            {renderConnectionsList(sitesConnectionsList)}
            {renderGatorPermissions(gatorPermissionsList)}
          </Box>
        ) : (
          <Box
            data-testid="no-connections"
            display={Display.Flex}
            flexDirection={FlexDirection.Column}
            justifyContent={JustifyContent.center}
            height={BlockSize.Full}
            gap={2}
            padding={4}
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
