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
import { DEFAULT_ROUTE, SITES } from '../../../../helpers/constants/routes';
import { getConnectedSitesListWithNetworkInfo } from '../../../../selectors';
import { getGatorPermissions } from '../../../../selectors/gator-permissions/gator-permissions';
import { PermissionListItem } from './permission-list-item';

export const PermissionsPage = () => {
  const t = useI18nContext();
  const history = useHistory();
  const headerRef = useRef();
  const [totalConnections, setTotalConnections] = useState(0);
  const [totalSpendingCapPermissions, setTotalSpendingCapPermissions] =
    useState(0);
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
  const gatorPermissionsList = useSelector(getGatorPermissions);

  // Use the hook to fetch gator permissions on component mount
  const { loading: gatorPermissionsLoading, error: gatorPermissionsError } =
    useGatorPermissions();

  useEffect(() => {
    const totalSites = Object.keys(sitesConnectionsList).length;
    const totalSpendingCap =
      gatorPermissionsList['native-token-stream'].length || 0;
    const totalTokenStreams =
      gatorPermissionsList['erc20-token-stream'].length || 0;
    const totalTokenSubscriptions =
      gatorPermissionsList['native-token-periodic'].length || 0;

    setTotalConnections(totalSites);
    setTotalSpendingCapPermissions(totalSpendingCap);
    setTotalTokenStreamsPermissions(totalTokenStreams);
    setTotalTokenSubscriptionsPermissions(totalTokenSubscriptions);
    setTotalPermissions(
      totalConnections +
        totalSpendingCap +
        totalTokenStreams +
        totalTokenSubscriptions,
    );
  }, [
    sitesConnectionsList,
    gatorPermissionsList,
    totalConnections,
    totalSpendingCapPermissions,
    totalTokenStreamsPermissions,
    totalTokenSubscriptionsPermissions,
  ]);

  const handleAssetClick = async (assetType) => {
    switch (assetType) {
      case 'sites':
        history.push(SITES);
        break;
      case 'spending-cap':
        history.push(SITES);
        break;
      case 'token-streams':
        history.push(SITES);
        break;
      case 'token-subscriptions':
        history.push(SITES);
        break;
      default:
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
            name="Sites"
            onClick={() => handleAssetClick('sites')}
          />
        )}

        {/* Assets */}
        <PermissionListItem
          total={totalSpendingCapPermissions}
          name="Spending Cap"
          onClick={() => handleAssetClick('spending-cap')}
        />
        <PermissionListItem
          total={totalTokenStreamsPermissions}
          name="Token Streams"
          onClick={() => handleAssetClick('token-streams')}
        />
        <PermissionListItem
          total={totalTokenSubscriptionsPermissions}
          name="Token Subscriptions"
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
