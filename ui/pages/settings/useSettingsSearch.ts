import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import Fuse from 'fuse.js';
import { getIsBasicFunctionalityConsolidationEnabled } from '../../selectors/multichain/feature-flags';
import { SETTINGS_TABS, SETTINGS_ROUTES } from './settings-registry';
import { SETTINGS_SEARCH_CONFIG, type TabSearchConfig } from './search-config';
import { useSettingsI18n } from './useSettingsI18n';

export const MIN_SEARCH_LENGTH = 3;

export type SettingsSearchResult = {
  /** Setting item id — used as hash fragment for scroll-to-setting */
  settingId: string;
  tabLabelKey: string;
  titleKey: string;
  tabRoute: string;
  iconName: string;
  /** Present for sub-page items to show full breadcrumb: Parent > SubPage > Item */
  parentTabLabelKey?: string;
};

const HIDDEN_BY_CONSOLIDATED_BASIC_FUNCTIONALITY: Record<
  string,
  ReadonlySet<string>
> = {
  assets: new Set([
    'display-nft-media',
    'autodetect-nfts',
    'autodetect-tokens',
  ]),
  privacy: new Set(['third-party-apis', 'batch-account-balance-requests']),
  'security-and-password': new Set(['phishing-detection']),
  transactions: new Set([
    'estimate-balance-changes',
    'security-alerts',
    'proposed-nicknames',
  ]),
};

const HIDDEN_SUBPAGE_ITEMS_BY_CONSOLIDATED_BASIC_FUNCTIONALITY: ReadonlySet<string> =
  new Set([
    'network-details-check',
    'show-ens-domains',
    'make-smart-contracts-easier',
    'display-nft-media',
    'autodetect-nfts',
    'proposed-nicknames',
  ]);

function getSearchConfig(
  isBasicFunctionalityToggleEnabled: boolean,
): TabSearchConfig[] {
  if (!isBasicFunctionalityToggleEnabled) {
    return SETTINGS_SEARCH_CONFIG;
  }

  return SETTINGS_SEARCH_CONFIG.map((config) => {
    const hiddenItems =
      HIDDEN_BY_CONSOLIDATED_BASIC_FUNCTIONALITY[config.tabId] ?? new Set();
    const items = config.items.filter((item) => !hiddenItems.has(item.id));
    const subPages =
      config.tabId === 'privacy'
        ? undefined
        : config.subPages?.map((subPage) => ({
            ...subPage,
            items: subPage.items.filter(
              (item) =>
                !HIDDEN_SUBPAGE_ITEMS_BY_CONSOLIDATED_BASIC_FUNCTIONALITY.has(
                  item.id,
                ),
            ),
          }));

    return { ...config, items, subPages };
  });
}

/**
 * Builds a flat list of searchable items by joining the lightweight
 * search config (id + titleKey pairs) with the registry (labelKey, path, iconName).
 *
 * @param isBasicFunctionalityToggleEnabled - Whether consolidated Basic Functionality settings should hide granular items.
 */
function buildSearchableItems(
  isBasicFunctionalityToggleEnabled: boolean,
): SettingsSearchResult[] {
  const tabById = new Map(SETTINGS_TABS.map((t) => [t.id, t]));

  return getSearchConfig(isBasicFunctionalityToggleEnabled).flatMap((cfg) => {
    const tab = tabById.get(cfg.tabId);
    if (!tab) {
      return [];
    }

    const tabItems: SettingsSearchResult[] = cfg.items.map((item) => ({
      settingId: item.id,
      tabLabelKey: tab.labelKey,
      titleKey: item.titleKey,
      tabRoute: tab.path,
      iconName: tab.iconName,
    }));

    const subPageItems: SettingsSearchResult[] = (cfg.subPages ?? []).flatMap(
      (subPage) => {
        const meta = SETTINGS_ROUTES[subPage.path];
        return subPage.items.map((item) => ({
          settingId: item.id,
          parentTabLabelKey: tab.labelKey,
          tabLabelKey: meta?.labelKey ?? tab.labelKey,
          titleKey: item.titleKey,
          tabRoute: subPage.path,
          iconName: tab.iconName,
        }));
      },
    );

    return [...tabItems, ...subPageItems];
  });
}

/**
 * Hook that provides fuzzy search over Settings items.
 * Items are derived from the lightweight search config — importing this
 * does NOT eagerly load any tab component module.
 *
 * @param searchValue - Current search input value
 * @returns Matching search results (empty if query is shorter than 3 characters)
 */
export function useSettingsSearch(searchValue: string): SettingsSearchResult[] {
  const t = useSettingsI18n();
  const isBasicFunctionalityConsolidationEnabled = useSelector(
    getIsBasicFunctionalityConsolidationEnabled,
  );

  const fuse = useMemo(() => {
    const items = buildSearchableItems(
      isBasicFunctionalityConsolidationEnabled,
    );
    return new Fuse(items, {
      shouldSort: true,
      threshold: 0.3,
      location: 0,
      distance: 100,
      minMatchCharLength: 1,
      keys: ['tabLabelKey', 'titleKey', 'parentTabLabelKey'],
      getFn: (item, path) => {
        const key = Array.isArray(path) ? path[0] : path;
        const labelKey = item[key as keyof SettingsSearchResult];
        return typeof labelKey === 'string' ? t(labelKey) : '';
      },
    });
  }, [isBasicFunctionalityConsolidationEnabled, t]);

  return useMemo(() => {
    const query = searchValue.trim();
    if (query.length < MIN_SEARCH_LENGTH) {
      return [];
    }
    // Fuse.js v3 returns T[] directly (not FuseResult<T>[] like v6+).
    // The bundled types describe the v6 API, so the cast is needed.
    return fuse.search(query) as unknown as SettingsSearchResult[];
  }, [fuse, searchValue]);
}
