import { renderHook } from '@testing-library/react-hooks';
import { useSettingsV2Search } from './useSettingsV2Search';

jest.mock('../../hooks/useI18nContext', () => ({
  useI18nContext: () => (key: string) => key,
}));

jest.mock('./settings-registry', () => ({
  SETTINGS_V2_TABS: [
    {
      id: 'assets',
      path: '/settings-v2/assets',
      labelKey: 'assets',
      iconName: 'Coin',
      component: () => null,
    },
    {
      id: 'preferences-and-display',
      path: '/settings-v2/preferences-and-display',
      labelKey: 'preferencesAndDisplay',
      iconName: 'Customize',
      component: () => null,
    },
  ],
}));

jest.mock('./search-config', () => ({
  SETTINGS_V2_SEARCH_CONFIG: [
    {
      tabId: 'assets',
      items: [{ id: 'autodetect-tokens', titleKey: 'autoDetectTokens' }],
    },
    {
      tabId: 'preferences-and-display',
      items: [
        { id: 'theme', titleKey: 'theme' },
        { id: 'language', titleKey: 'language' },
        { id: 'local-currency', titleKey: 'localCurrency' },
      ],
    },
  ],
}));

describe('useSettingsV2Search', () => {
  it('returns empty results for queries shorter than 3 characters', () => {
    const { result } = renderHook(() => useSettingsV2Search('th'));
    expect(result.current).toEqual([]);
  });

  it('returns empty results for empty string', () => {
    const { result } = renderHook(() => useSettingsV2Search(''));
    expect(result.current).toEqual([]);
  });

  it('returns matching results for a valid query', () => {
    const { result } = renderHook(() => useSettingsV2Search('theme'));
    expect(result.current.length).toBeGreaterThan(0);
    expect(result.current[0].titleKey).toBe('theme');
  });

  it('returns matching results for partial queries', () => {
    const { result } = renderHook(() => useSettingsV2Search('curr'));
    expect(result.current.length).toBeGreaterThan(0);

    const titleKeys = result.current.map((item) => item.titleKey);
    expect(titleKeys).toContain('localCurrency');
  });

  it('returns empty array for non-matching queries', () => {
    const { result } = renderHook(() => useSettingsV2Search('xyznonexistent'));
    expect(result.current).toEqual([]);
  });
});
