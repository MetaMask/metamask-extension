import React, { useEffect, useRef, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { isSnapId } from '@metamask/snaps-utils';
import { Content, Header, Page } from '../page';
import {
  ButtonIcon,
  ButtonIconSize,
  IconName,
  Text,
  Box,
} from '../../../component-library';
import {
  IconColor,
  BackgroundColor,
  TextAlign,
  TextVariant,
  BlockSize,
  Display,
  FlexDirection,
  JustifyContent,
  TextColor,
  AlignItems,
} from '../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { DEFAULT_ROUTE, SITES } from '../../../../helpers/constants/routes';
import { useGatorPermissions } from '../../../../hooks/gator-permissions/useGatorPermissions';
import { getConnectedSitesListWithNetworkInfo } from '../../../../selectors';
import { getGatorPermissionsMap } from '../../../../selectors/gator-permissions/gator-permissions';
import { PermissionListItem } from './components/permission-list-item';

export const GatorPermissionsPage = () => {
  const t = useI18nContext();
  const history = useHistory();
  const headerRef = useRef<HTMLSpanElement>(null);
  const [totalConnections, setTotalConnections] = useState(0);
  const [totalTokenStreamsPermissions, setTotalTokenStreamsPermissions] =
    useState(0);
  const [
    totalTokenSubscriptionsPermissions,
    setTotalTokenSubscriptionsPermissions,
  ] = useState(0);
  const [totalPermissions, setTotalPermissions] = useState(0);

  const sitesConnectionsList = useSelector(
    getConnectedSitesListWithNetworkInfo,
  );
  const gatorPermissionsMap = useSelector(getGatorPermissionsMap);

  // Use the hook to fetch gator permissions on component mount
  const { loading: gatorPermissionsLoading, error: gatorPermissionsError } =
    useGatorPermissions();

  useEffect(() => {
    const totalSites = Object.keys(sitesConnectionsList).filter(
      (site) => !isSnapId(site),
    ).length;
    const nativeTokenStream =
      Object.values(gatorPermissionsMap['native-token-stream']).flat().length ||
      0;
    const erc20TokenStream =
      Object.values(gatorPermissionsMap['erc20-token-stream']).flat().length ||
      0;
    const totalTokenSubscriptions =
      Object.values(gatorPermissionsMap['native-token-periodic']).flat()
        .length || 0;
    const totalTokenStreams = nativeTokenStream + erc20TokenStream;

    setTotalConnections(totalSites);
    setTotalTokenStreamsPermissions(totalTokenStreams);
    setTotalTokenSubscriptionsPermissions(totalTokenSubscriptions);
    setTotalPermissions(
      totalConnections + totalTokenStreams + totalTokenSubscriptions,
    );
  }, [
    sitesConnectionsList,
    gatorPermissionsMap,
    totalConnections,
    totalTokenStreamsPermissions,
    totalTokenSubscriptionsPermissions,
  ]);

  const handleAssetClick = async (assetType: string) => {
    switch (assetType) {
      case 'sites':
        history.push(SITES);
        break;
      default:
        console.error('Invalid asset type:', assetType);
        break;
    }
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
        gap={4}
      >
        {/* Sites */}
        {totalConnections > 0 && (
          <PermissionListItem
            total={totalConnections}
            name={t('sites')}
            onClick={() => handleAssetClick('sites')}
          />
        )}

        {/* Assets */}
        <PermissionListItem
          total={totalTokenStreamsPermissions}
          name={t('tokenStreams')}
          onClick={() => handleAssetClick('token-streams')}
        />
        <PermissionListItem
          total={totalTokenSubscriptionsPermissions}
          name={t('tokenSubscriptions')}
          onClick={() => handleAssetClick('token-subscriptions')}
        />
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
    <Page
      className="main-container"
      data-testid="gator-permissions-page"
      key="gator-permissions-page"
    >
      <Header
        backgroundColor={BackgroundColor.backgroundDefault}
        startAccessory={
          <ButtonIcon
            ariaLabel={t('back')}
            iconName={IconName.ArrowLeft}
            className="connections-header__start-accessory"
            color={IconColor.iconDefault}
            onClick={() => history.push(DEFAULT_ROUTE)}
            size={ButtonIconSize.Sm}
          />
        }
      >
        <Text
          as="span"
          variant={TextVariant.headingMd}
          textAlign={TextAlign.Center}
          data-testid="gator-permissions-page-title"
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
