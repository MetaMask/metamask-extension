import { useMemo } from 'react';
import Fuse from 'fuse.js';
import { SETTINGS_TABS, SETTINGS_ROUTES } from './settings-registry';
import { SETTINGS_SEARCH_CONFIG } from './search-config';
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

/**
 * Builds a flat list of searchable items by joining the lightweight
 * search config (id + titleKey pairs) with the registry (labelKey, path, iconName).
 */
function buildSearchableItems(): SettingsSearchResult[] {
  const tabById = new Map(SETTINGS_TABS.map((t) => [t.id, t]));

  return SETTINGS_SEARCH_CONFIG.flatMap((cfg) => {
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

  const fuse = useMemo(() => {
    const items = buildSearchableItems();
    return new Fuse(items, {
      shouldSort: true,
      threshold: 0.3,
      location: 0,
      distance: 100,
      minMatchCharLength: 1,
      keys: ['tabLabelKey', 'titleKey'],
      getFn: (item, path) => {
        const key = Array.isArray(path) ? path[0] : path;
        return t(item[key as 'tabLabelKey' | 'titleKey']);
      },
    });
  }, [t]);

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
