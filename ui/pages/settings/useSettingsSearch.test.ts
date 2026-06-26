import { renderHook } from '@testing-library/react-hooks';
import React from 'react';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import { useSettingsSearch } from './useSettingsSearch';

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
      id: 'privacy',
      path: '/settings/privacy',
      labelKey: 'securityAndPrivacy',
      iconName: 'Security',
      component: () => null,
    },
  ],
  SETTINGS_ROUTES: {
    '/settings/privacy/third-party-apis': {
      labelKey: 'thirdPartyApis',
    },
  },
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
      tabId: 'privacy',
      items: [
        { id: 'third-party-apis', titleKey: 'thirdPartyApis' },
        {
          id: 'batch-account-balance-requests',
          titleKey: 'useMultiAccountBalanceChecker',
        },
      ],
      subPages: [
        {
          path: '/settings/privacy/third-party-apis',
          items: [
            { id: 'ipfs-gateway', titleKey: 'ipfsGateway' },
            { id: 'autodetect-nfts', titleKey: 'useNftDetection' },
          ],
        },
      ],
    },
  ],
}));

describe('useSettingsSearch', () => {
  const createWrapper =
    (
      remoteFeatureFlags = {},
      isBasicFunctionalityConsolidatedEnabled = false,
    ) =>
    ({ children }: { children: React.ReactNode }) => {
      const store = configureMockStore()({
        metamask: {
          remoteFeatureFlags,
          preferences: {
            isBasicFunctionalityConsolidatedEnabled,
          },
        },
      });

      return React.createElement(Provider, { store }, children);
    };

  it('returns empty results for queries shorter than 3 characters', () => {
    const { result } = renderHook(() => useSettingsSearch('th'), {
      wrapper: createWrapper(),
    });
    expect(result.current).toEqual([]);
  });

  it('returns empty results for empty string', () => {
    const { result } = renderHook(() => useSettingsSearch(''), {
      wrapper: createWrapper(),
    });
    expect(result.current).toEqual([]);
  });

  it('returns matching results for a valid query', () => {
    const { result } = renderHook(() => useSettingsSearch('theme'), {
      wrapper: createWrapper(),
    });
    expect(result.current.length).toBeGreaterThan(0);
    expect(result.current[0].titleKey).toBe('theme');
  });

  it('returns matching results for partial queries', () => {
    const { result } = renderHook(() => useSettingsSearch('curr'), {
      wrapper: createWrapper(),
    });
    expect(result.current.length).toBeGreaterThan(0);

    const titleKeys = result.current.map((item) => item.titleKey);
    expect(titleKeys).toContain('localCurrency');
  });

  it('returns empty array for non-matching queries', () => {
    const { result } = renderHook(() => useSettingsSearch('xyznonexistent'), {
      wrapper: createWrapper(),
    });
    expect(result.current).toEqual([]);
  });

  it('hides consolidated Basic Functionality settings when the flag is enabled', () => {
    const { result } = renderHook(() => useSettingsSearch('auto'), {
      wrapper: createWrapper({ basicFunctionality: true }, true),
    });

    expect(result.current).toEqual([]);
  });

  it('keeps IPFS searchable on the Third-party APIs page when the flag is enabled', () => {
    const { result } = renderHook(() => useSettingsSearch('ipfs'), {
      wrapper: createWrapper({ basicFunctionality: true }, true),
    });

    expect(result.current).toHaveLength(1);
    expect(result.current[0].titleKey).toBe('ipfsGateway');
    expect(result.current[0].tabRoute).toBe(
      '/settings/privacy/third-party-apis',
    );
  });

  it('keeps granular settings searchable when the flag is enabled without the local cohort marker', () => {
    const { result } = renderHook(() => useSettingsSearch('auto'), {
      wrapper: createWrapper({ basicFunctionality: true }, false),
    });

    expect(result.current).toHaveLength(1);
    expect(result.current[0].titleKey).toBe('autoDetectTokens');
  });
});
