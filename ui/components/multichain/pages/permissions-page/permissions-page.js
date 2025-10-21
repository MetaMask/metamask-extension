import React, { useEffect, useRef, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { isSnapId } from '@metamask/snaps-utils';
import { SubjectType } from '@metamask/permission-controller';
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
import {
  getConnectedSitesListWithNetworkInfo,
  getTargetSubjectMetadata,
} from '../../../../selectors';
import { getGatorPermissionsMap } from '../../../../selectors/gator-permissions/gator-permissions';
import { isGatorPermissionsRevocationFeatureEnabled } from '../../../../../shared/modules/environment';
import { getURLHostName } from '../../../../helpers/utils/util';
import { ConnectionListItem } from './connection-list-item';

export const PermissionsPage = () => {
  const t = useI18nContext();
  const history = useHistory();
  const headerRef = useRef();
  const [totalConnections, setTotalConnections] = useState(0);
  const sitesConnectionsList = useSelector(
    getConnectedSitesListWithNetworkInfo,
  );
  const gatorPermissionsMap = useSelector(getGatorPermissionsMap);

  // Get permission counts per site origin from gator permissions
  const getPermissionCountsPerSite = (permissionsMap) => {
    const sitePermissionCounts = new Map();

    Object.values(permissionsMap).forEach((permissionTypeMap) => {
      Object.values(permissionTypeMap).forEach((permissions) => {
        permissions.forEach((permission) => {
          if (permission.siteOrigin) {
            const currentCount = sitePermissionCounts.get(permission.siteOrigin) || 0;
            sitePermissionCounts.set(permission.siteOrigin, currentCount + 1);
          }
        });
      });
    });

    return sitePermissionCounts;
  };

  // Get merged connections list using useSelector to access getTargetSubjectMetadata
  const mergedConnectionsList = useSelector((state) => {
    if (!isGatorPermissionsRevocationFeatureEnabled()) {
      return sitesConnectionsList;
    }

    const gatorPermissionCounts = getPermissionCountsPerSite(gatorPermissionsMap);
    const mergedConnections = { ...sitesConnectionsList };

    gatorPermissionCounts.forEach((permissionCount, siteOrigin) => {
      if (mergedConnections[siteOrigin]) {
        // Site exists in both connections and gator permissions - add count
        mergedConnections[siteOrigin] = {
          ...mergedConnections[siteOrigin],
          advancedPermissionsCount: permissionCount,
        };
      } else {
        // Site only has gator permissions - create minimal entry
        const subjectMetadata = getTargetSubjectMetadata(state, siteOrigin);
        mergedConnections[siteOrigin] = {
          addresses: [],
          origin: siteOrigin,
          name: subjectMetadata?.name || getURLHostName(siteOrigin),
          iconUrl: subjectMetadata?.iconUrl || null,
          subjectType: SubjectType.Website,
          networkIconUrl: '',
          networkName: '',
          extensionId: null,
          advancedPermissionsCount: permissionCount,
        };
      }
    });

    return mergedConnections;
  });

  useEffect(() => {
    setTotalConnections(Object.keys(mergedConnectionsList).length);
  }, [mergedConnectionsList]);

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
            onClick={() =>
              history.push(
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
