import React, { useRef } from 'react';
import { useHistory } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { isSnapId } from '@metamask/snaps-utils';
import { Content, Header, Page } from '../page';
import {
  ButtonIcon,
  ButtonIconSize,
  Icon,
  IconName,
  IconSize,
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
import {
  DEFAULT_ROUTE,
  PERMISSIONS,
  TOKEN_TRANSFER_ROUTE,
} from '../../../../helpers/constants/routes';
import { useGatorPermissions } from '../../../../hooks/gator-permissions/useGatorPermissions';
import { getConnectedSitesListWithNetworkInfo } from '../../../../selectors';
import {
  AppState,
  getAggregatedGatorPermissionsCountAcrossAllChains,
} from '../../../../selectors/gator-permissions/gator-permissions';
import { PermissionListItem } from './components/permission-list-item';

export const GatorPermissionsPage = () => {
  const t = useI18nContext();
  const history = useHistory();
  const headerRef = useRef<HTMLSpanElement>(null);
  const sitesConnectionsList = useSelector(
    getConnectedSitesListWithNetworkInfo,
  );
  const totalGatorPermissions = useSelector((state: AppState) =>
    getAggregatedGatorPermissionsCountAcrossAllChains(state, 'token-transfer'),
  );
  const totalSitesConnections = Object.keys(sitesConnectionsList).filter(
    (site) => !isSnapId(site),
  ).length;
  const totalPermissions = totalGatorPermissions + totalSitesConnections;

  // Hook uses cache-first strategy: returns cached data immediately if available,
  // then refreshes in background. Loading is only true on initial load with no cache.
  const { loading: gatorPermissionsLoading } = useGatorPermissions();

  const handlePermissionGroupNameClick = async (
    permissionGroupName: string,
  ) => {
    switch (permissionGroupName) {
      case 'sites':
        history.push(PERMISSIONS);
        break;
      case 'token-transfer':
        history.push(TOKEN_TRANSFER_ROUTE);
        break;
      default:
        console.error('Invalid permission group name:', permissionGroupName);
        break;
    }
  };

  const renderCategoryHeader = (title: string) => {
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

  const renderPermissionsList = () => {
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
        {totalSitesConnections > 0 && (
          <>
            {renderCategoryHeader(t('sites'))}
            <PermissionListItem
              total={totalSitesConnections}
              permissionGroupName={t('sites')}
              onClick={() => handlePermissionGroupNameClick('sites')}
            />
          </>
        )}

        {totalGatorPermissions > 0 && (
          <>
            {renderCategoryHeader(t('assets'))}
            <PermissionListItem
              total={totalGatorPermissions}
              permissionGroupName={t('tokenTransfer')}
              onClick={() => handlePermissionGroupNameClick('token-transfer')}
            />
          </>
        )}
      </Box>
    );
  };

  const renderPageContent = () => {
    if (gatorPermissionsLoading) {
      return (
        <Box
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
          justifyContent={JustifyContent.center}
          alignItems={AlignItems.center}
          height={BlockSize.Full}
          gap={2}
          padding={4}
        >
          <Icon
            name={IconName.Loading}
            color={IconColor.iconMuted}
            size={IconSize.Lg}
            style={{ animation: 'spin 1.2s linear infinite' }}
          />
        </Box>
      );
    }

    if (totalPermissions > 0) {
      return renderPermissionsList();
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
        {renderPageContent()}
      </Content>
    </Page>
  );
};
