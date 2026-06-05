import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import Fuse from 'fuse.js';
import { getIsPasskeyFeatureAvailable } from '../../selectors';
import { SETTINGS_TABS, SETTINGS_ROUTES } from './settings-registry';
import { SETTINGS_SEARCH_CONFIG } from './search-config';
import { useSettingsI18n } from './useSettingsI18n';

export const MIN_SEARCH_LENGTH = 3;

/** Setting id of the passkey entry, gated behind the passkey feature flag. */
const PASSKEY_SETTING_ID = 'passkey';

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
 *
 * @param excludedSettingIds - Setting ids to omit (e.g. feature-flagged items
 * that are not rendered, so they must not appear in search results).
 */
function buildSearchableItems(
  excludedSettingIds: ReadonlySet<string>,
): SettingsSearchResult[] {
  const tabById = new Map(SETTINGS_TABS.map((t) => [t.id, t]));

  return SETTINGS_SEARCH_CONFIG.flatMap((cfg) => {
    const tab = tabById.get(cfg.tabId);
    if (!tab) {
      return [];
    }

    const tabItems: SettingsSearchResult[] = cfg.items
      .filter((item) => !excludedSettingIds.has(item.id))
      .map((item) => ({
        settingId: item.id,
        tabLabelKey: tab.labelKey,
        titleKey: item.titleKey,
        tabRoute: tab.path,
        iconName: tab.iconName,
      }));

    const subPageItems: SettingsSearchResult[] = (cfg.subPages ?? []).flatMap(
      (subPage) => {
        const meta = SETTINGS_ROUTES[subPage.path];
        return subPage.items
          .filter((item) => !excludedSettingIds.has(item.id))
          .map((item) => ({
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
  const isPasskeyFeatureAvailable = useSelector(getIsPasskeyFeatureAvailable);

  const fuse = useMemo(() => {
    const excludedSettingIds = new Set<string>();
    if (!isPasskeyFeatureAvailable) {
      excludedSettingIds.add(PASSKEY_SETTING_ID);
    }
    const items = buildSearchableItems(excludedSettingIds);
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
  }, [t, isPasskeyFeatureAvailable]);

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
