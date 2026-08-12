import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Box,
  BoxFlexDirection,
  BoxJustifyContent,
  BoxAlignItems,
  ButtonIcon,
  ButtonIconSize,
  FontWeight,
  Icon,
  IconColor,
  IconName,
  IconSize,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { Content, Header, Page } from '../page';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import {
  DEFAULT_ROUTE,
  PREVIOUS_ROUTE,
  PERMISSIONS,
  TOKEN_TRANSFER_ROUTE,
} from '../../../../helpers/constants/routes';
import { useGatorPermissions } from '../../../../hooks/gator-permissions/useGatorPermissions';
import {
  AppState,
  getAggregatedGatorPermissionsCountAcrossAllChains,
  getTotalUniqueSitesCount,
} from '../../../../selectors/gator-permissions/gator-permissions';
import { useGlobalMenuRouteTransition } from '../../../../pages/routes/global-menu-route-transition';
import { transitionForward } from '../../../ui/transition';
import {
  PermissionListItem,
  PermissionsEmptyState,
} from './components';

export const GatorPermissionsPage = () => {
  const t = useI18nContext();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const runCloseTransition = useGlobalMenuRouteTransition();

  const fromPath = searchParams.get('from') ?? undefined;

  const handleBack = () => {
    if (fromPath === DEFAULT_ROUTE) {
      runCloseTransition(() => navigate(PREVIOUS_ROUTE));
    } else {
      navigate(DEFAULT_ROUTE);
    }
  };

  const totalGatorPermissions = useSelector((state: AppState) =>
    getAggregatedGatorPermissionsCountAcrossAllChains(state, 'token-transfer'),
  );
  const totalSitesConnections = useSelector(getTotalUniqueSitesCount);
  const totalPermissions = totalGatorPermissions + totalSitesConnections;

  // Hook uses cache-first strategy: returns cached data immediately if available,
  // then refreshes in background. Loading is only true on initial load with no cache.
  const { loading: gatorPermissionsLoading } = useGatorPermissions();

  const handlePermissionGroupNameClick = async (
    permissionGroupName: string,
  ) => {
    switch (permissionGroupName) {
      case 'sites':
        transitionForward(() => navigate(PERMISSIONS));
        break;
      case 'token-transfer':
        transitionForward(() => navigate(TOKEN_TRANSFER_ROUTE));
        break;
      default:
        console.error('Invalid permission group name:', permissionGroupName);
        break;
    }
  };

  const renderCategoryHeader = (title: string) => {
    return (
      <Box
        flexDirection={BoxFlexDirection.Row}
        alignItems={BoxAlignItems.Center}
        paddingHorizontal={4}
        className="w-full bg-background-default"
      >
        <Text
          variant={TextVariant.BodyMd}
          fontWeight={FontWeight.Medium}
          color={TextColor.TextAlternative}
        >
          {title}
        </Text>
      </Box>
    );
  };

  const renderPermissionsList = () => {
    return (
      <Box
        data-testid="permission-list"
        flexDirection={BoxFlexDirection.Column}
        alignItems={BoxAlignItems.Baseline}
        paddingVertical={4}
        gap={4}
        className="w-full bg-background-default"
      >
        {totalSitesConnections > 0 && (
          <>
            {renderCategoryHeader(t('dapps'))}
            <PermissionListItem
              total={totalSitesConnections}
              permissionGroupName={t('connections')}
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
          flexDirection={BoxFlexDirection.Column}
          justifyContent={BoxJustifyContent.Center}
          alignItems={BoxAlignItems.Center}
          gap={2}
          padding={4}
          className="h-full"
        >
          <Icon
            name={IconName.Loading}
            color={IconColor.IconMuted}
            size={IconSize.Lg}
            className="animate-spin"
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
        flexDirection={BoxFlexDirection.Column}
        justifyContent={BoxJustifyContent.Center}
        padding={4}
        className="h-full"
      >
        <PermissionsEmptyState />
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
        className="bg-background-default"
        startAccessory={
          <ButtonIcon
            ariaLabel={t('back')}
            iconName={IconName.ArrowLeft}
            className="connections-header__start-accessory"
            color={IconColor.IconDefault}
            onClick={handleBack}
            size={ButtonIconSize.Md}
          />
        }
      >
        <Text
          variant={TextVariant.BodyMd}
          fontWeight={FontWeight.Medium}
          data-testid="gator-permissions-page-title"
        >
          {t('permissions')}
        </Text>
      </Header>
      <Content padding={0}>{renderPageContent()}</Content>
    </Page>
  );
};
