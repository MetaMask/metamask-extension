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
    const translations: Record<string, string> = {
      notifications: 'Notifications',
      notificationsSettingsWalletActivityTitle: 'Wallet activity',
      privacy: 'Privacy',
      thirdPartyApis: 'Third-party APIs',
      ipfsGateway: 'IPFS gateway',
      assets: 'Assets',
      preferencesAndDisplay: 'Preferences and display',
      theme: 'Theme',
      language: 'Language',
      localCurrency: 'Local currency',
      autoDetectTokens: 'Auto-detect tokens',
    };

    if (substitutions?.length) {
      return `${key}(${substitutions.join(',')})`;
    }
    return translations[key] ?? key;
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
      id: 'notifications',
      path: '/settings/notifications',
      labelKey: 'notifications',
      iconName: 'Notification',
      component: () => null,
    },
    {
      id: 'privacy',
      path: '/settings/privacy',
      labelKey: 'privacy',
      iconName: 'Lock',
      component: () => null,
    },
  ],
  SETTINGS_ROUTES: {
    '/settings/notifications/wallet-activity': {
      labelKey: 'notificationsSettingsWalletActivityTitle',
    },
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
      tabId: 'notifications',
      items: [{ id: 'allow-notifications', titleKey: 'notifications' }],
      subPages: [
        {
          path: '/settings/notifications/wallet-activity',
          items: [
            {
              id: 'wallet-activity',
              titleKey: 'notificationsSettingsWalletActivityTitle',
            },
          ],
        },
      ],
    },
    {
      tabId: 'privacy',
      items: [
        { id: 'third-party-apis', titleKey: 'thirdPartyApis' },
        { id: 'ipfs-gateway', titleKey: 'ipfsGateway' },
        {
          id: 'batch-account-balance-requests',
          titleKey: 'useMultiAccountBalanceChecker',
        },
      ],
      subPages: [
        {
          path: '/settings/privacy/third-party-apis',
          items: [{ id: 'autodetect-nfts', titleKey: 'useNftDetection' }],
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

      return React.createElement(Provider, { store, children });
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
      wrapper: createWrapper({ extensionBasicFunctionalityToggle: true }, true),
    });

    expect(result.current).toEqual([]);
  });

  it('keeps IPFS searchable on the Privacy page when the flag is enabled', () => {
    const { result } = renderHook(() => useSettingsSearch('ipfs'), {
      wrapper: createWrapper({ extensionBasicFunctionalityToggle: true }, true),
    });

    expect(result.current).toHaveLength(1);
    expect(result.current[0].titleKey).toBe('ipfsGateway');
    expect(result.current[0].tabRoute).toBe('/settings/privacy');
  });

  it('keeps granular settings searchable when the flag is enabled without the local cohort marker', () => {
    const { result } = renderHook(() => useSettingsSearch('auto'), {
      wrapper: createWrapper(
        { extensionBasicFunctionalityToggle: true },
        false,
      ),
    });

    expect(result.current).toHaveLength(1);
    expect(result.current[0].titleKey).toBe('autoDetectTokens');
  });

  it('returns notification sub-pages when the query matches the parent tab label', () => {
    const { result } = renderHook(() => useSettingsSearch('notif'), {
      wrapper: createWrapper(),
    });

    const walletActivity = result.current.find(
      (item) => item.settingId === 'wallet-activity',
    );
    expect(walletActivity).toEqual(
      expect.objectContaining({
        settingId: 'wallet-activity',
        parentTabLabelKey: 'notifications',
        tabRoute: '/settings/notifications/wallet-activity',
        titleKey: 'notificationsSettingsWalletActivityTitle',
      }),
    );
  });

  it('returns privacy sub-pages when the query matches the parent tab label', () => {
    const { result } = renderHook(() => useSettingsSearch('priv'), {
      wrapper: createWrapper(),
    });

    const autodetectNfts = result.current.find(
      (item) =>
        item.settingId === 'autodetect-nfts' &&
        item.tabRoute === '/settings/privacy/third-party-apis',
    );
    expect(autodetectNfts).toEqual(
      expect.objectContaining({
        settingId: 'autodetect-nfts',
        parentTabLabelKey: 'privacy',
        tabRoute: '/settings/privacy/third-party-apis',
      }),
    );
  });
});
