/* eslint-disable import-x/extensions */
import React, { Fragment, Suspense, useMemo, useState } from 'react';
import {
  Routes as RouterRoutes,
  Route,
  useNavigate,
  useLocation,
} from 'react-router-dom';
import {
  Box,
  BoxAlignItems,
  BoxBackgroundColor,
  BoxFlexDirection,
  Icon,
  IconName,
  IconSize,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import classnames from 'clsx';
import { useI18nContext } from '../../hooks/useI18nContext';
import {
  DEFAULT_ROUTE,
  SETTINGS_V2_ROUTE,
} from '../../helpers/constants/routes';
// TODO: Remove restricted import
// eslint-disable-next-line import-x/no-restricted-paths
import { getEnvironmentType } from '../../../app/scripts/lib/util';
import {
  ENVIRONMENT_TYPE_POPUP,
  ENVIRONMENT_TYPE_SIDEPANEL,
} from '../../../shared/constants/app';
import { toRelativeRoutePath } from '../routes/utils';
import TabBar from './tab-bar';
import {
  SETTINGS_V2_TABS,
  SETTINGS_V2_RENDERABLE_ROUTES,
  getSettingsV2RouteMeta,
} from './settings-registry';
import { SettingsV2Header } from './shared';

const FirstTabComponent = SETTINGS_V2_TABS[0]?.component;
const FIRST_TAB_PATH = SETTINGS_V2_TABS[0]?.path;
const HEADER_HEIGHT_PX = 64;

/**
 * Layout for Settings V2: header, tab bar, and content area.
 *
 * @param props - Component props
 * @param props.children - Route content to render in the main area
 */
const SettingsV2Layout = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const t = useI18nContext();
  const { pathname } = location;
  const meta = getSettingsV2RouteMeta(pathname);
  const environmentType = getEnvironmentType();
  const [searchValue, setSearchValue] = useState('');

  const isPopupOrSidepanel =
    environmentType === ENVIRONMENT_TYPE_POPUP ||
    environmentType === ENVIRONMENT_TYPE_SIDEPANEL;
  const isSidepanel = environmentType === ENVIRONMENT_TYPE_SIDEPANEL;

  const isOnSettingsRoot = pathname === SETTINGS_V2_ROUTE;
  const backRoute = isOnSettingsRoot
    ? DEFAULT_ROUTE
    : (meta?.parentPath ?? SETTINGS_V2_ROUTE);

  const currentPageLabelKey = meta?.labelKey;

  // Header: "Settings" on fullscreen; tab or sub-page name on popup/sidepanel
  const headerTitle =
    isPopupOrSidepanel && !isOnSettingsRoot && currentPageLabelKey
      ? t(currentPageLabelKey)
      : t('settings');

  // Breadcrumbs: shown on sub-pages (2+ levels deep from settings root)
  const breadcrumbs = useMemo((): string[] => {
    if (!meta?.parentPath || meta.parentPath === SETTINGS_V2_ROUTE) {
      return [];
    }
    const crumbs: string[] = [];
    let currentPath: string | undefined = pathname;

    // Walk up the parent chain to build breadcrumbs
    while (currentPath && currentPath !== SETTINGS_V2_ROUTE) {
      const routeMeta = getSettingsV2RouteMeta(currentPath);
      if (!routeMeta) {
        break;
      }
      crumbs.unshift(routeMeta.labelKey);
      currentPath = routeMeta.parentPath;
    }

    return crumbs;
  }, [pathname, meta?.parentPath]);

  const showBreadcrumbs = breadcrumbs.length > 1 && !isPopupOrSidepanel;

  const itemTabs = useMemo(
    () =>
      SETTINGS_V2_TABS.map((item) => ({
        key: item.path,
        content: t(item.labelKey),
        iconName: item.iconName,
      })),
    [t],
  );

  return (
    <Box
      flexDirection={BoxFlexDirection.Column}
      backgroundColor={BoxBackgroundColor.BackgroundDefault}
      className="h-full w-full shadow-xs"
    >
      <SettingsV2Header
        title={headerTitle}
        isPopupOrSidepanel={isPopupOrSidepanel}
        isOnSettingsRoot={isOnSettingsRoot}
        onClose={() => navigate(backRoute)}
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        onSearchClear={() => setSearchValue('')}
      />
      <Box
        flexDirection={BoxFlexDirection.Row}
        className={classnames(`h-[calc(100%-${HEADER_HEIGHT_PX}px)]`, {
          'sm:border-t sm:border-border-muted': !isSidepanel,
        })}
      >
        <Box
          className={classnames(
            'w-full h-full sm:max-w-[262px] sm:bg-background-muted',
            {
              flex: isOnSettingsRoot,
              'hidden sm:flex': !isOnSettingsRoot && !isSidepanel,
              hidden: !isOnSettingsRoot && isSidepanel,
              'sm:max-w-full sm:bg-background-default':
                isOnSettingsRoot && isSidepanel,
            },
          )}
        >
          <TabBar
            tabs={itemTabs}
            isActive={(key) => {
              // First tab is active when at settings root
              if (key === FIRST_TAB_PATH && pathname === SETTINGS_V2_ROUTE) {
                return true;
              }
              return pathname === key || pathname.startsWith(`${key}/`);
            }}
            removeFullscreenStyles={isPopupOrSidepanel}
          />
        </Box>
        <Box
          className={classnames('flex-auto flex-col w-full', {
            flex: !isOnSettingsRoot,
            'hidden sm:flex': isOnSettingsRoot && !isSidepanel,
            hidden: isOnSettingsRoot && isSidepanel,
          })}
        >
          {showBreadcrumbs && (
            <Box
              className="hidden sm:flex"
              flexDirection={BoxFlexDirection.Row}
              alignItems={BoxAlignItems.Center}
              gap={2}
              paddingHorizontal={4}
              paddingVertical={3}
            >
              {breadcrumbs.map((crumb, index) => {
                const isLast = index === breadcrumbs.length - 1;
                return (
                  <Fragment key={crumb}>
                    {index > 0 && (
                      <Icon
                        name={IconName.ArrowRight}
                        size={IconSize.Xs}
                        className="text-icon-alternative"
                      />
                    )}
                    <Text
                      variant={TextVariant.BodyMd}
                      color={
                        isLast
                          ? TextColor.TextDefault
                          : TextColor.TextAlternative
                      }
                    >
                      {t(crumb)}
                    </Text>
                  </Fragment>
                );
              })}
            </Box>
          )}
          <Suspense fallback={null}>{children}</Suspense>
        </Box>
      </Box>
    </Box>
  );
};

/**
 * Settings V2 router component.
 * All routes are derived from the centralized SETTINGS_V2_ROUTES registry.
 */
const SettingsV2 = () => {
  return (
    <RouterRoutes>
      {SETTINGS_V2_RENDERABLE_ROUTES.map(({ path, component: Component }) => (
        <Route
          key={path}
          path={toRelativeRoutePath(path, SETTINGS_V2_ROUTE)}
          element={
            <SettingsV2Layout>
              <Component />
            </SettingsV2Layout>
          }
        />
      ))}
      {/* Catch-all and root: show first tab content */}
      <Route
        path="*"
        element={
          <SettingsV2Layout>
            {FirstTabComponent && <FirstTabComponent />}
          </SettingsV2Layout>
        }
      />
    </RouterRoutes>
  );
};

export default SettingsV2;
