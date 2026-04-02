/* eslint-disable import-x/extensions */
import React, {
  Fragment,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  Routes as RouterRoutes,
  Route,
  Link,
  useNavigate,
  useLocation,
} from 'react-router-dom';
import {
  Box,
  BoxAlignItems,
  BoxBackgroundColor,
  BoxFlexDirection,
  FontWeight,
  Icon,
  IconColor,
  IconName,
  IconSize,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import classnames from 'clsx';
import { useSelector } from 'react-redux';
import { useI18nContext } from '../../hooks/useI18nContext';
import {
  DEFAULT_ROUTE,
  SETTINGS_V2_ROUTE,
  SNAP_SETTINGS_ROUTE,
  TRANSACTION_SHIELD_ROUTE,
} from '../../helpers/constants/routes';
import { SnapSettingsRenderer } from '../../components/app/snaps/snap-settings-page';
// TODO: Remove restricted import
// eslint-disable-next-line import-x/no-restricted-paths
import { getEnvironmentType } from '../../../app/scripts/lib/util';
import {
  ENVIRONMENT_TYPE_POPUP,
  ENVIRONMENT_TYPE_SIDEPANEL,
} from '../../../shared/constants/app';
import {
  getUseExternalServices,
  getSettingsPageSnapsIds,
  getSnapsMetadata,
} from '../../selectors';
import { getSnapName } from '../../helpers/utils/util';
import { getHasSubscribedToShield } from '../../selectors/subscription/subscription';
// TODO: Remove restricted import
// eslint-disable-next-line import-x/no-restricted-paths
import { getIsMetaMaskShieldFeatureEnabled } from '../../../shared/lib/environment';
import ShieldEntryModal from '../../components/app/shield-entry-modal';
// TODO: Remove restricted import
// eslint-disable-next-line import-x/no-restricted-paths
import { SHIELD_QUERY_PARAMS } from '../../../shared/lib/deep-links/routes/shield';
import { toRelativeRoutePath } from '../routes/utils';
import TabBar from './tab-bar';
import {
  SETTINGS_V2_ROOT_SECTIONS,
  SETTINGS_V2_TABS,
  SETTINGS_V2_RENDERABLE_ROUTES,
  getSettingsV2RouteMeta,
} from './settings-registry';
import {
  SettingsV2Header,
  SettingsV2Root,
  SettingsV2SearchResults,
} from './shared';
import { useSettingsV2Search, MIN_SEARCH_LENGTH } from './useSettingsV2Search';

const FIRST_TAB_PATH = SETTINGS_V2_TABS[0]?.path;
const FirstTabComponent = SETTINGS_V2_TABS[0]?.component;

const normalizeSettingsPath = (path: string) =>
  path !== '/' && path.endsWith('/') ? path.slice(0, -1) : path;

const getRoutePathname = (path: string) => path.split('?')[0];

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
  const normalizedPathname = normalizeSettingsPath(location.pathname);
  const meta = getSettingsV2RouteMeta(normalizedPathname);
  const environmentType = getEnvironmentType();

  const isPopupOrSidepanel =
    environmentType === ENVIRONMENT_TYPE_POPUP ||
    environmentType === ENVIRONMENT_TYPE_SIDEPANEL;
  const isSidepanel = environmentType === ENVIRONMENT_TYPE_SIDEPANEL;
  const isOnSettingsRoot = normalizedPathname === SETTINGS_V2_ROUTE;
  const showRootLandingPage = isOnSettingsRoot && isPopupOrSidepanel;
  const backRoute = isOnSettingsRoot
    ? `${DEFAULT_ROUTE}?drawerOpen=true`
    : (meta?.parentPath ?? SETTINGS_V2_ROUTE);

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const searchResults = useSettingsV2Search(searchValue);

  // --- Shield entry modal interception ---
  const hasSubscribedToShield = useSelector(getHasSubscribedToShield);
  const useExternalServices = Boolean(useSelector(getUseExternalServices));
  const isShieldFeatureEnabled = getIsMetaMaskShieldFeatureEnabled();
  const [showShieldEntryModal, setShowShieldEntryModal] = useState(false);

  const shouldInterceptShieldTab =
    isShieldFeatureEnabled && useExternalServices && !hasSubscribedToShield;

  // Handle ?showShieldEntryModal=true query param (e.g. from deep links)
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get(SHIELD_QUERY_PARAMS.showShieldEntryModal) === 'true') {
      if (hasSubscribedToShield) {
        navigate(TRANSACTION_SHIELD_ROUTE, { replace: true });
      } else {
        setShowShieldEntryModal(true);
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- mount only

  // Intercept Transaction Shield tab click for non-subscribed users
  const handleTabClick = useCallback(
    (key: string): boolean | void => {
      if (key === TRANSACTION_SHIELD_ROUTE && shouldInterceptShieldTab) {
        setShowShieldEntryModal(true);
        return true; // prevent Link navigation
      }
      return undefined;
    },
    [shouldInterceptShieldTab],
  );

  const currentPageLabelKey = meta?.labelKey;

  // Header: "Settings" on fullscreen; tab or sub-page name on popup/sidepanel
  const headerTitle =
    isPopupOrSidepanel && !isOnSettingsRoot && currentPageLabelKey
      ? t(currentPageLabelKey)
      : t('settings');

  // Breadcrumbs: shown on sub-pages (2+ levels deep from settings root)
  const breadcrumbs = useMemo((): { labelKey: string; path: string }[] => {
    if (!meta?.parentPath || meta.parentPath === SETTINGS_V2_ROUTE) {
      return [];
    }
    const crumbs: { labelKey: string; path: string }[] = [];
    let currentPath: string | undefined = normalizedPathname;

    // Walk up the parent chain to build breadcrumbs
    while (currentPath && getRoutePathname(currentPath) !== SETTINGS_V2_ROUTE) {
      const routeMeta = getSettingsV2RouteMeta(getRoutePathname(currentPath));
      if (!routeMeta) {
        break;
      }
      crumbs.unshift({ labelKey: routeMeta.labelKey, path: currentPath });
      currentPath = routeMeta.parentPath;
    }

    return crumbs;
  }, [normalizedPathname, meta?.parentPath]);

  const showBreadcrumbs = breadcrumbs.length > 1 && !isPopupOrSidepanel;

  // --- Dynamic snap settings tabs ---
  const settingsPageSnapIds = useSelector(getSettingsPageSnapsIds);
  const snapsMetadata = useSelector(getSnapsMetadata);
  const snapNameGetter = useMemo(
    () => getSnapName(snapsMetadata),
    [snapsMetadata],
  );

  const itemTabs = useMemo(
    () =>
      SETTINGS_V2_TABS.map((item) => ({
        key: item.path,
        content: t(item.labelKey),
        iconName: item.iconName,
      })),
    [t],
  );
  const groupedItemTabs = useMemo(() => {
    const sections = SETTINGS_V2_ROOT_SECTIONS.map(({ titleKeys, paths }) => {
      const items = SETTINGS_V2_TABS.filter((item) =>
        paths.includes(item.path),
      ).map((item) => ({
        key: item.path,
        content: t(item.labelKey),
        iconName: item.iconName,
        dataTestId: `settings-v2-tab-item-${item.id}`,
      }));

      return {
        key: titleKeys.join('-'),
        title: titleKeys.map((key) => t(key)).join(' & '),
        items,
      };
    }).filter(({ items }) => items.length > 0);

    if (settingsPageSnapIds.length > 0) {
      sections.push({
        key: 'snaps',
        title: t('snaps') as string,
        items: settingsPageSnapIds.map((snapId: string) => ({
          key: `${SNAP_SETTINGS_ROUTE}?snapId=${encodeURIComponent(snapId)}`,
          content: snapNameGetter(snapId),
          iconName: IconName.Snaps,
          dataTestId: `settings-v2-tab-item-snap-${snapId}`,
        })),
      });
    }

    return sections;
  }, [t, settingsPageSnapIds, snapNameGetter]);

  const handleCloseSearch = () => {
    setIsSearchOpen(false);
    setSearchValue('');
  };

  const showSearchResults =
    isSearchOpen && searchValue.trim().length >= MIN_SEARCH_LENGTH;

  let mainContent: React.ReactNode;

  if (showSearchResults) {
    mainContent = (
      <Box className="flex-1 overflow-y-auto">
        <SettingsV2SearchResults
          results={searchResults}
          onClickResult={(item) => {
            navigate(`${item.tabRoute}#${item.settingId}`);
            handleCloseSearch();
          }}
        />
      </Box>
    );
  } else if (showRootLandingPage) {
    mainContent = (
      <Box className="flex-1 overflow-y-auto">
        <SettingsV2Root onBeforeNavigate={handleTabClick} />
      </Box>
    );
  } else {
    mainContent = (
      <Box
        flexDirection={BoxFlexDirection.Row}
        // 64px is the header height
        className={classnames(`h-[calc(100%-64px)]`, {
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
            tabs={isPopupOrSidepanel ? itemTabs : []}
            sections={isPopupOrSidepanel ? [] : groupedItemTabs}
            isActive={(key) => {
              // First tab is active when at settings root
              if (
                key === FIRST_TAB_PATH &&
                normalizedPathname === SETTINGS_V2_ROUTE
              ) {
                return true;
              }
              // Snap tabs: key includes ?snapId=, match against current URL
              if (
                normalizedPathname === SNAP_SETTINGS_ROUTE &&
                key.startsWith(`${SNAP_SETTINGS_ROUTE}?`)
              ) {
                const keySnapId = new URLSearchParams(key.split('?')[1]).get(
                  'snapId',
                );
                const currentSnapId = new URLSearchParams(location.search).get(
                  'snapId',
                );
                return keySnapId === currentSnapId;
              }
              return (
                normalizedPathname === key ||
                normalizedPathname.startsWith(`${key}/`)
              );
            }}
            removeFullscreenStyles={isPopupOrSidepanel}
            onTabClick={handleTabClick}
          />
        </Box>
        <Box
          className={classnames('flex-auto flex-col w-full pt-2', {
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
                const isFirst = index === 0;
                const isLast = index === breadcrumbs.length - 1;
                return (
                  <Fragment key={crumb.path}>
                    {!isFirst && (
                      <Text
                        variant={TextVariant.BodyMd}
                        fontWeight={FontWeight.Medium}
                        color={TextColor.TextAlternative}
                      >
                        {'>'}
                      </Text>
                    )}
                    {isLast ? (
                      <Text
                        variant={TextVariant.BodyMd}
                        fontWeight={FontWeight.Medium}
                        color={TextColor.TextDefault}
                      >
                        {t(crumb.labelKey)}
                      </Text>
                    ) : (
                      <Link
                        to={crumb.path}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        {isFirst && (
                          <Icon
                            name={IconName.ArrowLeft}
                            size={IconSize.Sm}
                            color={IconColor.IconDefault}
                          />
                        )}
                        <Text
                          variant={TextVariant.BodyMd}
                          fontWeight={FontWeight.Medium}
                          color={TextColor.TextAlternative}
                        >
                          {t(crumb.labelKey)}
                        </Text>
                      </Link>
                    )}
                  </Fragment>
                );
              })}
            </Box>
          )}
          <Suspense fallback={null}>
            {isOnSettingsRoot && !isPopupOrSidepanel && FirstTabComponent ? (
              <FirstTabComponent />
            ) : (
              children
            )}
          </Suspense>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      flexDirection={BoxFlexDirection.Column}
      backgroundColor={BoxBackgroundColor.BackgroundDefault}
      className="h-full w-full shadow-xs"
    >
      {showShieldEntryModal && (
        <ShieldEntryModal
          skipEventSubmission
          onClose={() => setShowShieldEntryModal(false)}
        />
      )}
      <SettingsV2Header
        title={headerTitle}
        isPopupOrSidepanel={isPopupOrSidepanel}
        isOnSettingsRoot={isOnSettingsRoot}
        onClose={() => navigate(backRoute)}
        isSearchOpen={isSearchOpen}
        onOpenSearch={() => setIsSearchOpen(true)}
        onCloseSearch={handleCloseSearch}
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        onSearchClear={() => setSearchValue('')}
      />
      {mainContent}
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
      <Route
        path={toRelativeRoutePath(SNAP_SETTINGS_ROUTE, SETTINGS_V2_ROUTE)}
        element={
          <SettingsV2Layout>
            <SnapSettingsRenderer />
          </SettingsV2Layout>
        }
      />
      {/* Catch-all and root: layout handles popup root and fullscreen first-tab rendering */}
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
