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
import { useGatorPermissions } from '../../../../hooks/gator-permissions/useGatorPermissions';
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
  AlignItems,
} from '../../../../helpers/constants/design-system';
import {
  DEFAULT_ROUTE,
  SITES,
  TOKEN_TRANSFER_ROUTE,
} from '../../../../helpers/constants/routes';
import { getConnectedSitesListWithNetworkInfo } from '../../../../selectors';
import { getGatorPermissionsMap } from '../../../../selectors/gator-permissions/gator-permissions';
import { countSitesWithPermissionsButNoConnection } from '../../../../../shared/lib/gator-permissions-utils';
import { PermissionListItem } from './permission-list-item';

export const PermissionsPageV2 = () => {
  const t = useI18nContext();
  const history = useHistory();
  const headerRef = useRef();
  const [totalConnections, setTotalConnections] = useState(0);
  const [totalTokenTransferPermissions, setTotalTokenTransferPermissions] =
    useState(0);
  const [totalPermissions, setTotalPermissions] = useState(0);

  const sitesConnectionsList = useSelector(
    getConnectedSitesListWithNetworkInfo,
  );
  const gatorPermissionsMap = useSelector(getGatorPermissionsMap);

  // Use the hook to fetch gator permissions on component mount
  const { loading: gatorPermissionsLoading, error: gatorPermissionsError } =
    useGatorPermissions();

  useEffect(() => {
    // Count sites that have connections (excluding snaps)
    const connectedSitesCount = Object.keys(sitesConnectionsList || {}).filter(
      (site) => !isSnapId(site),
    ).length;

    // Count sites that have gator permissions but no connection
    const sitesWithPermissionsButNoConnection =
      countSitesWithPermissionsButNoConnection(
        sitesConnectionsList,
        gatorPermissionsMap,
      );

    // Total sites = connected sites + sites with permissions but no connection
    const totalSites =
      connectedSitesCount + sitesWithPermissionsButNoConnection;
    const nativeTokenStream =
      Object.values(gatorPermissionsMap['native-token-stream']).flat().length ||
      0;
    const erc20TokenStream =
      Object.values(gatorPermissionsMap['erc20-token-stream']).flat().length ||
      0;
    const nativeTokenSubscriptions =
      Object.values(gatorPermissionsMap['native-token-periodic']).flat()
        .length || 0;
    const erc20TokenSubscriptions =
      Object.values(gatorPermissionsMap['erc20-token-periodic']).flat()
        .length || 0;
    const totalTokenStreams = nativeTokenStream + erc20TokenStream;
    const totalTokenSubscriptions =
      nativeTokenSubscriptions + erc20TokenSubscriptions;
    const totalTokenTransfer = totalTokenStreams + totalTokenSubscriptions;

    setTotalConnections(totalSites);
    setTotalTokenTransferPermissions(totalTokenTransfer);
    setTotalPermissions(totalSites + totalTokenTransfer);
  }, [sitesConnectionsList, gatorPermissionsMap]);

  const handleAssetClick = async (assetType) => {
    switch (assetType) {
      case 'sites':
        history.push(SITES);
        break;
      case 'token-transfer':
        history.push(TOKEN_TRANSFER_ROUTE);
        break;
      default:
        console.error('Invalid asset type:', assetType);
        break;
    }
  };

  const renderCategoryHeader = (title) => {
    return (
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Row}
        alignItems={AlignItems.center}
        width={BlockSize.Full}
        backgroundColor={BackgroundColor.backgroundDefault}
        padding={[2, 4]}
        marginTop={4}
      >
        <Text
          variant={TextVariant.bodyMdMedium}
          color={TextColor.textAlternative}
          textAlign={TextAlign.Left}
        >
          {title.toUpperCase()}
        </Text>
      </Box>
    );
  };

  const renderPermissionList = () => {
    return (
      <Box
        data-testid="permission-list"
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        alignItems={AlignItems.baseline}
        width={BlockSize.Full}
        backgroundColor={BackgroundColor.backgroundDefault}
        padding={4}
        gap={0}
      >
        {/* SITES Category */}
        {totalConnections > 0 && (
          <>
            {renderCategoryHeader(t('sites'))}
            <Box
              display={Display.Flex}
              flexDirection={FlexDirection.Column}
              width={BlockSize.Full}
              backgroundColor={BackgroundColor.backgroundDefault}
              gap={0}
            >
              <PermissionListItem
                total={totalConnections}
                name={t('sites')}
                onClick={() => handleAssetClick('sites')}
              />
            </Box>
          </>
        )}

        {/* ASSETS Category */}
        {totalTokenTransferPermissions > 0 && (
          <>
            {renderCategoryHeader(t('assets'))}
            <Box
              display={Display.Flex}
              flexDirection={FlexDirection.Column}
              width={BlockSize.Full}
              backgroundColor={BackgroundColor.backgroundDefault}
              gap={0}
            >
              <PermissionListItem
                total={totalTokenTransferPermissions}
                name={t('tokenTransfer')}
                onClick={() => handleAssetClick('token-transfer')}
              />
            </Box>
          </>
        )}
      </Box>
    );
  };

  // Show error state if gator permissions failed to load
  if (gatorPermissionsError) {
    console.error('Failed to load gator permissions:', gatorPermissionsError);
  }

  const renderContent = () => {
    if (gatorPermissionsLoading) {
      return (
        <Box
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
            {t('loading')}
          </Text>
        </Box>
      );
    }

    if (totalPermissions > 0) {
      return renderPermissionList();
    }

    return (
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
    );
  };

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
        {renderContent()}
      </Content>
    </Page>
  );
};
