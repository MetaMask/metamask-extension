/* eslint-disable import-x/extensions */
import React, { Fragment, Suspense, useState } from 'react';
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
  ACCOUNT_IDENTICON_ROUTE,
  AUTO_LOCK_ROUTE,
  CURRENCY_ROUTE,
  DEFAULT_ROUTE,
  LANGUAGE_ROUTE,
  SETTINGS_V2_ROUTE,
  THEME_ROUTE,
  THIRD_PARTY_APIS_ROUTE,
} from '../../helpers/constants/routes';
import TabBar from '../../components/app/tab-bar/tab-bar.tsx';
// TODO: Remove restricted import
// eslint-disable-next-line import-x/no-restricted-paths
import { getEnvironmentType } from '../../../app/scripts/lib/util';
import {
  ENVIRONMENT_TYPE_POPUP,
  ENVIRONMENT_TYPE_SIDEPANEL,
} from '../../../shared/constants/app';
import { mmLazy } from '../../helpers/utils/mm-lazy';
import { toRelativeRoutePath } from '../routes/utils';
import {
  SETTINGS_V2_MENU_LIST_ITEM_REGISTRY,
  getSettingsV2RouteMeta,
} from './settings-registry';
import { SettingsV2Header } from './shared';

const CurrencySubPage = mmLazy(
  () => import('./assets-tab/currency-sub-page.tsx'),
);

const ThemeSubPage = mmLazy(
  () => import('./preferences-and-display-tab/theme-sub-page.tsx'),
);

const LanguageSubPage = mmLazy(
  () => import('./preferences-and-display-tab/language-sub-page.tsx'),
);

const AccountIdenticonSubPage = mmLazy(
  () => import('./preferences-and-display-tab/account-identicon-sub-page.tsx'),
);

const ThirdPartyApisSubPage = mmLazy(
  () => import('./privacy-tab/third-party-apis-sub-page.tsx'),
);

const AutoLockSubPage = mmLazy(
  () => import('./security-and-password-tab/auto-lock-sub-page.tsx'),
);

// Get the first tab's component for rendering at the settings root (like Settings V1)
const FirstTabComponent = SETTINGS_V2_MENU_LIST_ITEM_REGISTRY[0]?.component;
const FIRST_TAB_PATH = SETTINGS_V2_MENU_LIST_ITEM_REGISTRY[0]?.path;

/**
 * Layout for Settings V2: header, tab bar, and content area.
 * Mirrors the existing Settings page structure.
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

  // Breadcrumbs: these are shown on sub-pages (2 levels deep from settings root)
  const breadcrumbs = React.useMemo((): string[] => {
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

  const itemTabs = SETTINGS_V2_MENU_LIST_ITEM_REGISTRY.map((item) => ({
    key: item.path,
    content: t(item.labelKey),
    iconName: item.iconName,
  }));

  return (
    <Box
      flexDirection={BoxFlexDirection.Column}
      backgroundColor={BoxBackgroundColor.BackgroundDefault}
      className="h-full w-full"
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
        className={classnames('h-full', {
          'sm:border-t sm:border-border-muted': !isSidepanel,
        })}
      >
        <Box
          className={classnames(
            'w-full sm:max-w-[262px] sm:bg-background-muted',
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
          <Suspense fallback={null}>
            <Box>{children}</Box>
          </Suspense>
        </Box>
      </Box>
    </Box>
  );
};

const SettingsV2 = () => {
  return (
    <RouterRoutes>
      {/* Tab routes from registry */}
      {SETTINGS_V2_MENU_LIST_ITEM_REGISTRY.map((item) => (
        <Route
          key={item.id}
          path={toRelativeRoutePath(item.path, SETTINGS_V2_ROUTE)}
          element={
            <SettingsV2Layout>
              <item.component />
            </SettingsV2Layout>
          }
        />
      ))}
      {/* Currency sub-page */}
      <Route
        path={toRelativeRoutePath(CURRENCY_ROUTE, SETTINGS_V2_ROUTE)}
        element={
          <SettingsV2Layout>
            <CurrencySubPage />
          </SettingsV2Layout>
        }
      />
      {/* Theme sub-page */}
      <Route
        path={toRelativeRoutePath(THEME_ROUTE, SETTINGS_V2_ROUTE)}
        element={
          <SettingsV2Layout>
            <Suspense fallback={null}>
              <ThemeSubPage />
            </Suspense>
          </SettingsV2Layout>
        }
      />
      {/* Language sub-page */}
      <Route
        path={toRelativeRoutePath(LANGUAGE_ROUTE, SETTINGS_V2_ROUTE)}
        element={
          <SettingsV2Layout>
            <Suspense fallback={null}>
              <LanguageSubPage />
            </Suspense>
          </SettingsV2Layout>
        }
      />
      {/* Account identicon sub-page */}
      <Route
        path={toRelativeRoutePath(ACCOUNT_IDENTICON_ROUTE, SETTINGS_V2_ROUTE)}
        element={
          <SettingsV2Layout>
            <Suspense fallback={null}>
              <AccountIdenticonSubPage />
            </Suspense>
          </SettingsV2Layout>
        }
      />
      {/* Third-party APIs sub-page */}
      <Route
        path={toRelativeRoutePath(THIRD_PARTY_APIS_ROUTE, SETTINGS_V2_ROUTE)}
        element={
          <SettingsV2Layout>
            <Suspense fallback={null}>
              <ThirdPartyApisSubPage />
            </Suspense>
          </SettingsV2Layout>
        }
      />
      {/* Auto-lock sub-page */}
      <Route
        path={toRelativeRoutePath(AUTO_LOCK_ROUTE, SETTINGS_V2_ROUTE)}
        element={
          <SettingsV2Layout>
            <Suspense fallback={null}>
              <AutoLockSubPage />
            </Suspense>
          </SettingsV2Layout>
        }
      />
      {/* Catch-all and root: show first tab content (like Settings V1) */}
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
