import { useMemo } from 'react';
import Fuse from 'fuse.js';
import { useI18nContext } from '../../hooks/useI18nContext';
import { SETTINGS_V2_MENU_LIST_ITEM_REGISTRY } from './settings-registry';

export const MIN_SEARCH_LENGTH = 3;

export type SettingsV2SearchResult = {
  tabLabelKey: string;
  titleKey: string;
  tabRoute: string;
  iconName: string;
};

/**
 * Builds a flat list of searchable items from the registry,
 * pairing each tab's metadata with its individual setting items.
 */
function buildSearchableItems(): SettingsV2SearchResult[] {
  return SETTINGS_V2_MENU_LIST_ITEM_REGISTRY.flatMap((tab) =>
    tab.settingItems.map((item) => ({
      tabLabelKey: tab.labelKey,
      titleKey: item.titleKey,
      tabRoute: tab.path,
      iconName: tab.iconName,
    })),
  );
}

/**
 * Hook that provides fuzzy search over Settings V2 items.
 * Items are derived from the tab registry — no separate search list to maintain.
 *
 * @param searchValue - Current search input value
 * @returns Matching search results (empty if query is shorter than 3 characters)
 */
export function useSettingsV2Search(
  searchValue: string,
): SettingsV2SearchResult[] {
  const t = useI18nContext();

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
    return fuse.search(query) as unknown as SettingsV2SearchResult[];
  }, [fuse, searchValue]);
}
