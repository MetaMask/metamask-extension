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
import { REVIEW_PERMISSIONS } from '../../../../helpers/constants/routes';
import { getConnectedSitesListWithNetworkInfo } from '../../../../selectors';
import { getGatorPermissionsMap } from '../../../../selectors/gator-permissions/gator-permissions';
import { ConnectionListItem } from '../permissions-page/connection-list-item';
import {
  CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP,
  NETWORK_TO_NAME_MAP,
} from '../../../../../shared/constants/network';
import { getURLHostName } from '../../../../helpers/utils/util';

// Helper function to extract unique site origins from gator permissions
const extractGatorSiteOrigins = (gatorPermissions) => {
  if (!gatorPermissions) {
    return new Set();
  }

  const gatorSiteOrigins = new Set();
  Object.values(gatorPermissions).forEach((permissionTypeMap) => {
    if (permissionTypeMap && typeof permissionTypeMap === 'object') {
      Object.values(permissionTypeMap).forEach((permissions) => {
        if (Array.isArray(permissions)) {
          permissions.forEach((permission) => {
            if (permission && permission.siteOrigin) {
              gatorSiteOrigins.add(permission.siteOrigin);
            }
          });
        }
      });
    }
  });
  return gatorSiteOrigins;
};

// Helper function to find the first chainId for a site
const findFirstChainIdForSite = (gatorPermissions, siteOrigin) => {
  // Use for...of loops for early termination capability
  for (const permissionTypeMap of Object.values(gatorPermissions)) {
    if (permissionTypeMap && typeof permissionTypeMap === 'object') {
      for (const [chainId, permissions] of Object.entries(permissionTypeMap)) {
        if (
          Array.isArray(permissions) &&
          permissions.some((p) => p && p.siteOrigin === siteOrigin)
        ) {
          return chainId; // Early return when found
        }
      }
    }
  }

  return null;
};

// Helper function to create a site entry from gator permissions
const createSiteEntryFromGatorPermissions = (siteOrigin, firstChainId) => ({
  origin: siteOrigin,
  name: getURLHostName(siteOrigin),
  addresses: [],
  addressToNameMap: {},
  subjectType: SubjectType.Website,
  networkName: firstChainId ? NETWORK_TO_NAME_MAP[firstChainId] || '' : '',
  networkIconUrl: firstChainId
    ? CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP[firstChainId] || ''
    : '',
});

export const SitesPage = () => {
  const t = useI18nContext();
  const history = useHistory();
  const headerRef = useRef();
  const [totalConnections, setTotalConnections] = useState(0);
  const sitesConnectionsList = useSelector(
    getConnectedSitesListWithNetworkInfo,
  );
  const gatorPermissions = useSelector(getGatorPermissionsMap);

  // Merge missing site origins from gator permissions into sitesConnectionsList
  const mergedSitesConnectionsList = React.useMemo(() => {
    // If we have neither data source, return empty object
    if (!gatorPermissions && !sitesConnectionsList) {
      return {};
    }

    try {
      // Start with existing sites list (or empty object if none)
      const result = { ...(sitesConnectionsList || {}) };

      // If we have gator permissions, merge them in
      if (gatorPermissions) {
        // Extract all unique site origins from gator permissions
        const gatorSiteOrigins = extractGatorSiteOrigins(gatorPermissions);

        // Add missing site origins with required properties
        gatorSiteOrigins.forEach((siteOrigin) => {
          if (!result[siteOrigin]) {
            const firstChainId = findFirstChainIdForSite(
              gatorPermissions,
              siteOrigin,
            );
            result[siteOrigin] = createSiteEntryFromGatorPermissions(
              siteOrigin,
              firstChainId,
            );
          }
        });
      }

      return result;
    } catch (error) {
      console.error('Error merging gator permissions:', error);
      return sitesConnectionsList || {};
    }
  }, [sitesConnectionsList, gatorPermissions]);

  useEffect(() => {
    if (!mergedSitesConnectionsList) {
      setTotalConnections(0);
      return;
    }

    setTotalConnections(Object.keys(mergedSitesConnectionsList).length);
  }, [mergedSitesConnectionsList]);

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
    <Page className="main-container" data-testid="sites-page">
      <Header
        backgroundColor={BackgroundColor.backgroundDefault}
        startAccessory={
          <ButtonIcon
            ariaLabel={t('back')}
            iconName={IconName.ArrowLeft}
            className="connections-header__start-accessory"
            color={Color.iconDefault}
            onClick={() => history.goBack()}
            size={ButtonIconSize.Sm}
          />
        }
      >
        <Text
          as="span"
          variant={TextVariant.headingMd}
          textAlign={TextAlign.Center}
        >
          {t('sites')}
        </Text>
      </Header>
      <Content padding={0}>
        <Box ref={headerRef}></Box>
        {totalConnections > 0 ? (
          renderConnectionsList(mergedSitesConnectionsList)
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
