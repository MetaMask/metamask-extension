/* eslint-disable import-x/extensions */
import React, { Suspense, useState } from 'react';
import {
  Routes as RouterRoutes,
  Route,
  useNavigate,
  useLocation,
} from 'react-router-dom';
import classnames from 'clsx';
import { Box } from '@metamask/design-system-react';
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
import {
  Box as LegacyBox,
  Icon,
  Text,
} from '../../components/component-library';
import {
  AlignItems,
  FlexDirection,
  TextVariant,
} from '../../helpers/constants/design-system';
import TabBar from '../../components/app/tab-bar';
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
  const isPopup =
    environmentType === ENVIRONMENT_TYPE_POPUP ||
    environmentType === ENVIRONMENT_TYPE_SIDEPANEL;
  const isSidepanel = environmentType === ENVIRONMENT_TYPE_SIDEPANEL;

  const isOnSettingsRoot = pathname === SETTINGS_V2_ROUTE;
  const [searchValue, setSearchValue] = useState('');
  const backRoute = isOnSettingsRoot
    ? DEFAULT_ROUTE
    : (meta?.parentPath ?? SETTINGS_V2_ROUTE);

  // Subheader label - at root, use first tab's label since that's what's displayed
  const subheaderLabelKey = isOnSettingsRoot
    ? SETTINGS_V2_MENU_LIST_ITEM_REGISTRY[0]?.labelKey
    : (meta?.labelKey ?? SETTINGS_V2_MENU_LIST_ITEM_REGISTRY[0]?.labelKey);

  // Header: "Settings" on fullscreen or at root, section name on popup sub-routes
  const headerTitle =
    isPopup && !isOnSettingsRoot ? t(subheaderLabelKey) : t('settings');

  // Subheader: always shows the current section name
  const showSubheader = Boolean(subheaderLabelKey);

  const itemTabs = SETTINGS_V2_MENU_LIST_ITEM_REGISTRY.map((item) => ({
    key: item.path,
    content: t(item.labelKey),
    icon: <Icon name={item.iconName} />,
  }));

  return (
    <div
      className={classnames(
        'main-container main-container--has-shadow settings-page settings-v2',
        {
          'settings-page--selected': !isOnSettingsRoot,
          'settings-page--sidepanel': isSidepanel,
        },
      )}
    >
      <SettingsV2Header
        title={headerTitle}
        isPopup={isPopup}
        isOnSettingsRoot={isOnSettingsRoot}
        onClose={() => navigate(backRoute)}
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        onSearchClear={() => setSearchValue('')}
      />

      <div className="settings-page__content">
        <div className="settings-page__content__tabs">
          <TabBar
            tabs={itemTabs}
            isActive={(key) => {
              // First tab is active when at settings root (like Settings V1)
              if (key === FIRST_TAB_PATH && pathname === SETTINGS_V2_ROUTE) {
                return true;
              }
              return pathname === key || pathname.startsWith(`${key}/`);
            }}
            onSelect={(key) => navigate(key)}
          />
        </div>
        <div className="settings-page__content__modules">
          {showSubheader && (
            <LegacyBox
              className="settings-page__subheader"
              padding={4}
              paddingLeft={6}
              paddingRight={6}
              flexDirection={FlexDirection.Row}
              alignItems={AlignItems.center}
            >
              <Text variant={TextVariant.headingSm}>
                {t(subheaderLabelKey)}
              </Text>
            </LegacyBox>
          )}
          <Suspense fallback={null}>
            <Box>{children}</Box>
          </Suspense>
        </div>
      </div>
    </div>
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
