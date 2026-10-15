import React, { useEffect } from 'react';
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
import { PermissionListItem, PermissionsEmptyState } from './components';

export const GatorPermissionsPage = () => {
  const t = useI18nContext();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const runCloseTransition = useGlobalMenuRouteTransition();

  const totalGatorPermissions = useSelector((state: AppState) =>
    getAggregatedGatorPermissionsCountAcrossAllChains(state, 'token-transfer'),
  );
  const totalSitesConnections = useSelector(getTotalUniqueSitesCount);
  const { loading } = useGatorPermissions();

  const from = searchParams.get('from') ?? DEFAULT_ROUTE;

  // If only sites permissions exist, redirect to sites page directly
  const shouldRedirect =
    !loading && totalSitesConnections > 0 && totalGatorPermissions === 0;

  useEffect(() => {
    if (shouldRedirect) {
      navigate(`${PERMISSIONS}?from=${encodeURIComponent(from)}`, {
        replace: true,
      });
    }
  }, [shouldRedirect, navigate, from]);

  const handleBack = () => {
    if (from === DEFAULT_ROUTE) {
      runCloseTransition(() => navigate(-1));
    } else {
      navigate(DEFAULT_ROUTE);
    }
  };

  if (shouldRedirect) {
    return null;
  }

  const hasPermissions =
    !loading && (totalGatorPermissions > 0 || totalSitesConnections > 0);

  const renderContent = () => {
    if (loading) {
      return (
        <Box
          data-testid="gator-permissions-loading"
          flexDirection={BoxFlexDirection.Column}
          justifyContent={BoxJustifyContent.Center}
          alignItems={BoxAlignItems.Center}
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

    if (hasPermissions) {
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
              <Text
                variant={TextVariant.BodyMd}
                fontWeight={FontWeight.Medium}
                color={TextColor.TextAlternative}
                className="pl-4"
              >
                {t('dapps')}
              </Text>
              <PermissionListItem
                total={totalSitesConnections}
                permissionGroupName={t('connections')}
                onClick={() => transitionForward(() => navigate(PERMISSIONS))}
              />
            </>
          )}
          {totalSitesConnections > 0 && totalGatorPermissions > 0 && (
            <Box className="w-full px-4">
              <hr className="m-0 w-full border-0 border-t border-muted" />
            </Box>
          )}
          {totalGatorPermissions > 0 && (
            <>
              <Text
                variant={TextVariant.BodyMd}
                fontWeight={FontWeight.Medium}
                color={TextColor.TextAlternative}
                className="pl-4"
              >
                {t('assets')}
              </Text>
              <PermissionListItem
                total={totalGatorPermissions}
                permissionGroupName={t('tokenTransfer')}
                onClick={() =>
                  transitionForward(() => navigate(TOKEN_TRANSFER_ROUTE))
                }
              />
            </>
          )}
        </Box>
      );
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
      data-testid="parent-selector-gator-permissions"
    >
      <Header
        className="bg-background-default"
        startAccessory={
          <ButtonIcon
            ariaLabel={t('back')}
            iconName={IconName.ArrowLeft}
            color={IconColor.IconDefault}
            onClick={handleBack}
            size={ButtonIconSize.Md}
          />
        }
        textProps={{ 'data-testid': 'gator-permissions-page-title' }}
      >
        {t('permissions')}
      </Header>
      <Content padding={0}>{renderContent()}</Content>
    </Page>
  );
};
