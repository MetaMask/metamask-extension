import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom-v5-compat';
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
  GATOR_PERMISSIONS,
} from '../../../../helpers/constants/routes';
import { getConnectedSitesListWithNetworkInfo } from '../../../../selectors';
import { getMergedConnectionsListWithGatorPermissions } from '../../../../selectors/gator-permissions/gator-permissions';
import { isGatorPermissionsRevocationFeatureEnabled } from '../../../../../shared/modules/environment';
import { ConnectionListItem } from './connection-list-item';

const PermissionsPage = () => {
  const t = useI18nContext();
  const navigate = useNavigate();
  const headerRef = useRef();
  const [totalConnections, setTotalConnections] = useState(0);

  const mergedConnectionsList = useSelector((state) => {
    if (!isGatorPermissionsRevocationFeatureEnabled()) {
      return getConnectedSitesListWithNetworkInfo(state);
    }
    return getMergedConnectionsListWithGatorPermissions(state);
  });

  useEffect(() => {
    setTotalConnections(Object.keys(mergedConnectionsList).length);
  }, [mergedConnectionsList]);

  const handleConnectionClick = (connection) => {
    const hostName = connection.origin;
    const safeEncodedHost = encodeURIComponent(hostName);

    navigate(`${REVIEW_PERMISSIONS}/${safeEncodedHost}`);
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
            onClick={() =>
              navigate(
                isGatorPermissionsRevocationFeatureEnabled()
                  ? GATOR_PERMISSIONS
                  : DEFAULT_ROUTE,
              )
            }
            size={ButtonIconSize.Sm}
            data-testid="permissions-page-back"
          />
        }
      >
        <Text
          as="span"
          variant={TextVariant.headingMd}
          textAlign={TextAlign.Center}
          data-testid="permissions-page-title"
        >
          {isGatorPermissionsRevocationFeatureEnabled()
            ? t('sites')
            : t('permissions')}
        </Text>
      </Header>
      <Content padding={0}>
        <Box ref={headerRef}></Box>
        {totalConnections > 0 ? (
          renderConnectionsList(mergedConnectionsList)
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

export default PermissionsPage;
