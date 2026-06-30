import { renderHook } from '@testing-library/react-hooks';
import { getIsPasskeyFeatureAvailable } from '../../selectors';
import { useSettingsSearch } from './useSettingsSearch';

jest.mock('react-redux', () => ({
  useSelector: (selector: unknown) =>
    typeof selector === 'function' ? selector() : selector,
}));

jest.mock('../../selectors', () => ({
  getIsPasskeyFeatureAvailable: jest.fn(),
}));

jest.mock('../../../shared/lib/passkey', () => ({
  getPasskeyAuthMethodKey: () => 'passkeyAuthMethodBiometrics',
}));

jest.mock('../../hooks/useI18nContext', () => ({
  useI18nContext: () => (key: string, substitutions?: string[]) => {
    if (substitutions?.length) {
      return `${key}(${substitutions.join(',')})`;
    }
    return key;
  },
}));

jest.mock('./settings-registry', () => ({
  SETTINGS_TABS: [
    {
      id: 'assets',
      path: '/settings/assets',
      labelKey: 'assets',
      iconName: 'Coin',
      component: () => null,
    },
    {
      id: 'preferences-and-display',
      path: '/settings/preferences-and-display',
      labelKey: 'preferencesAndDisplay',
      iconName: 'Customize',
      component: () => null,
    },
    {
      id: 'security-and-password',
      path: '/settings/security-and-password',
      labelKey: 'securityAndPrivacy',
      iconName: 'Lock',
      component: () => null,
    },
  ],
}));

jest.mock('./search-config', () => ({
  SETTINGS_SEARCH_CONFIG: [
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
    {
      tabId: 'security-and-password',
      items: [{ id: 'passkey', titleKey: 'unlockWithPasskey' }],
    },
  ],
}));

describe('useSettingsSearch', () => {
  beforeEach(() => {
    jest.mocked(getIsPasskeyFeatureAvailable).mockReturnValue(true);
  });

  it('returns empty results for queries shorter than 3 characters', () => {
    const { result } = renderHook(() => useSettingsSearch('th'));
    expect(result.current).toEqual([]);
  });

  it('returns empty results for empty string', () => {
    const { result } = renderHook(() => useSettingsSearch(''));
    expect(result.current).toEqual([]);
  });

  it('returns matching results for a valid query', () => {
    const { result } = renderHook(() => useSettingsSearch('theme'));
    expect(result.current.length).toBeGreaterThan(0);
    expect(result.current[0].titleKey).toBe('theme');
  });

  it('returns matching results for partial queries', () => {
    const { result } = renderHook(() => useSettingsSearch('curr'));
    expect(result.current.length).toBeGreaterThan(0);

    const titleKeys = result.current.map((item) => item.titleKey);
    expect(titleKeys).toContain('localCurrency');
  });

  it('returns empty array for non-matching queries', () => {
    const { result } = renderHook(() => useSettingsSearch('xyznonexistent'));
    expect(result.current).toEqual([]);
  });

  it('includes the passkey/biometric option when the feature is available', () => {
    jest.mocked(getIsPasskeyFeatureAvailable).mockReturnValue(true);

    const { result } = renderHook(() =>
      useSettingsSearch('passkeyAuthMethodBiometrics'),
    );

    const titleKeys = result.current.map((item) => item.titleKey);
    expect(titleKeys).toContain('unlockWithPasskey');
  });

  it('hides the passkey/biometric option when the passkey feature is unavailable', () => {
    jest.mocked(getIsPasskeyFeatureAvailable).mockReturnValue(false);

    const { result } = renderHook(() =>
      useSettingsSearch('passkeyAuthMethodBiometrics'),
    );

    const titleKeys = result.current.map((item) => item.titleKey);
    expect(titleKeys).not.toContain('unlockWithPasskey');
  });
});
