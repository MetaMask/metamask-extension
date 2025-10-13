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
import { getNetworkNameByChainId } from '../../../../../shared/modules/feature-flags';
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

  // Get all unique site origins from gator permissions with their first chainId and all unique addresses
  const getUniqueSiteOriginsFromGatorPermissions = (permissionsMap) => {
    const siteOriginsMap = new Map();

    Object.values(permissionsMap).forEach((permissionTypeMap) => {
      Object.values(permissionTypeMap).forEach((permissions) => {
        permissions.forEach((permission) => {
          if (permission.siteOrigin) {
            if (!siteOriginsMap.has(permission.siteOrigin)) {
              // Store the first permission data for this site origin
              siteOriginsMap.set(permission.siteOrigin, {
                addresses: new Set(),
                chainId: permission.permissionResponse.chainId,
              });
            }

            // Add address to the set if it exists
            const permissionData = siteOriginsMap.get(permission.siteOrigin);
            if (permission.permissionResponse.address) {
              permissionData.addresses.add(
                permission.permissionResponse.address.toLowerCase(),
              );
            }
          }
        });
      });
    });

    // Convert Set to Array for each site origin
    siteOriginsMap.forEach((permissionData) => {
      permissionData.addresses = Array.from(permissionData.addresses);
    });

    return siteOriginsMap;
  };

  // Get merged connections list using useSelector to access getTargetSubjectMetadata
  const mergedConnectionsList = useSelector((state) => {
    if (!isGatorPermissionsRevocationFeatureEnabled()) {
      return sitesConnectionsList;
    }

    const gatorSiteOriginsMap =
      getUniqueSiteOriginsFromGatorPermissions(gatorPermissionsMap);
    const mergedConnections = { ...sitesConnectionsList };

    // Add sites that only have gator permissions but no site connections
    gatorSiteOriginsMap.forEach((permissionData, siteOrigin) => {
      if (!mergedConnections[siteOrigin]) {
        const { addresses, chainId } = permissionData;
        const networkName = getNetworkNameByChainId(chainId);

        // Get subject metadata for name and iconUrl
        const subjectMetadata = getTargetSubjectMetadata(state, siteOrigin);
        const siteName = subjectMetadata?.name || getURLHostName(siteOrigin);
        const siteIconUrl = subjectMetadata?.iconUrl || null;

        // Create a minimal connection object for sites that only have gator permissions
        mergedConnections[siteOrigin] = {
          addresses: addresses || [],
          origin: siteOrigin,
          name: siteName,
          iconUrl: siteIconUrl,
          subjectType: SubjectType.Website,
          networkIconUrl: '',
          networkName: networkName || '',
          extensionId: null,
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
