/* eslint-disable import/extensions */
import React, { Suspense } from 'react';
import {
  Routes as RouterRoutes,
  Route,
  useNavigate,
  useLocation,
} from 'react-router-dom';
import { useSelector } from 'react-redux';
import classnames from 'clsx';
import { Box } from '@metamask/design-system-react';
import { useI18nContext } from '../../hooks/useI18nContext';
import {
  CURRENCY_ROUTE,
  DEFAULT_ROUTE,
  LANGUAGE_ROUTE,
  SETTINGS_V2_ROUTE,
  THEME_ROUTE,
} from '../../helpers/constants/routes';
import {
  Box as LegacyBox,
  ButtonIcon,
  ButtonIconSize,
  Icon,
  IconName,
  Text,
} from '../../components/component-library';
import {
  AlignItems,
  Display,
  FlexDirection,
  TextVariant,
} from '../../helpers/constants/design-system';
import TabBar from '../../components/app/tab-bar';
import MetafoxLogo from '../../components/ui/metafox-logo';
import { getMostRecentOverviewPage } from '../../ducks/history/history';
// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import { getEnvironmentType } from '../../../app/scripts/lib/util';
import {
  ENVIRONMENT_TYPE_POPUP,
  ENVIRONMENT_TYPE_SIDEPANEL,
} from '../../../shared/constants/app';
import { DynamicImportType, mmLazy } from '../../helpers/utils/mm-lazy';
import { toRelativeRoutePath } from '../routes/utils';
import {
  SETTINGS_V2_MENU_LIST_ITEM_REGISTRY,
  getSettingsV2RouteMeta,
} from './settings-registry';

const CurrencySubPage = mmLazy(
  (() =>
    import(
      './assets-tab/currency-sub-page.tsx'
    )) as unknown as DynamicImportType,
);

const ThemeSubPage = mmLazy(
  (() =>
    import(
      './preferences-and-display-tab/theme-sub-page.tsx'
    )) as unknown as DynamicImportType,
);

const LanguageSubPage = mmLazy(
  (() =>
    import(
      './preferences-and-display-tab/language-sub-page.tsx'
    )) as unknown as DynamicImportType,
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

  const mostRecentOverviewPage = useSelector(getMostRecentOverviewPage);

  const environmentType = getEnvironmentType();
  const isPopup =
    environmentType === ENVIRONMENT_TYPE_POPUP ||
    environmentType === ENVIRONMENT_TYPE_SIDEPANEL;
  const isSidepanel = environmentType === ENVIRONMENT_TYPE_SIDEPANEL;

  const isOnSettingsRoot = pathname === SETTINGS_V2_ROUTE;

  // Determine back route: sub-pages go to their parent, top-level tabs go to settings root
  const backRoute = meta?.parentPath ?? SETTINGS_V2_ROUTE;

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
      <LegacyBox
        className="settings-page__header"
        padding={4}
        paddingBottom={2}
      >
        <div className="settings-page__header__title-container">
          {isPopup && (
            <>
              {isOnSettingsRoot ? (
                <MetafoxLogo
                  className="settings-page__header__title-container__metamask-logo"
                  unsetIconHeight
                  onClick={() => navigate(DEFAULT_ROUTE)}
                  display={[Display.Flex, Display.None]}
                />
              ) : (
                <ButtonIcon
                  ariaLabel={t('back')}
                  iconName={IconName.ArrowLeft}
                  className="settings-page__header__title-container__back-button"
                  onClick={() => navigate(backRoute)}
                  size={ButtonIconSize.Md}
                  display={[Display.Flex, Display.None]}
                />
              )}
            </>
          )}
          <div className="settings-page__header__title-container__title">
            <Text variant={TextVariant.headingMd} ellipsis>
              {headerTitle}
            </Text>
          </div>
          <ButtonIcon
            className="settings-page__header__title-container__close-button"
            iconName={IconName.Close}
            ariaLabel={t('close')}
            onClick={() => navigate(mostRecentOverviewPage)}
            size={ButtonIconSize.Md}
            marginLeft="auto"
          />
        </div>
      </LegacyBox>

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
