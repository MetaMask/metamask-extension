import type { Page } from '@playwright/test';
import {
  CONFIRM_TRANSACTION_ROUTE,
  CROSS_CHAIN_SWAP_ROUTE,
  ONBOARDING_METAMETRICS,
  PREPARE_SWAP_ROUTE,
  SETTINGS_ROUTE,
  SIGNATURE_REQUEST_PATH,
  UNLOCK_ROUTE,
} from '../../../../../ui/helpers/constants/routes';
import { HomePage } from '../page-objects/home-page';
import {
  detectCurrentScreen,
  detectScreenFromUrl,
  detectUnlockState,
  getBaseExtensionState,
} from './state-inspector';

const mockGetBalance = jest.fn();

jest.mock('../page-objects/home-page', () => {
  return {
    HomePage: jest.fn().mockImplementation(() => {
      return {
        getBalance: mockGetBalance,
      };
    }),
  };
});

const DEFAULT_METAMASK_STATE = {
  internalAccounts: {
    selectedAccount: 'account-1',
    accounts: {
      'account-1': { address: '0xABC123def456' },
    },
  },
  networkConfigurationsByChainId: {
    '0x539': {
      name: 'Localhost 8545',
      chainId: '0x539',
      rpcEndpoints: [{ networkClientId: 'network-client-1' }],
    },
  },
  selectedNetworkClientId: 'network-client-1',
};

function buildPage(
  currentUrl = 'chrome-extension://id/home.html',
  visibleBySelector: Record<string, boolean> = {},
  rejectSelectors: string[] = [],
  cdpMetamaskState: unknown = null,
): Page {
  const rejectSet = new Set(rejectSelectors);
  const mockCdpSend = jest.fn().mockImplementation(() => {
    if (cdpMetamaskState === null) {
      return Promise.resolve({ result: {} });
    }
    return Promise.resolve({
      result: { value: JSON.stringify(cdpMetamaskState) },
    });
  });
  return {
    url: jest.fn().mockReturnValue(currentUrl),
    context: jest.fn().mockReturnValue({
      newCDPSession: jest.fn().mockResolvedValue({
        send: mockCdpSend,
        detach: jest.fn().mockResolvedValue(undefined),
      }),
    }),
    locator: jest.fn().mockImplementation((selector: string) => {
      return {
        isVisible: jest.fn().mockImplementation(() => {
          if (rejectSet.has(selector)) {
            return Promise.reject(new Error('Locator failed'));
          }
          return Promise.resolve(Boolean(visibleBySelector[selector]));
        }),
      };
    }),
  } as unknown as Page;
}

describe('state-inspector', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetBalance.mockResolvedValue('25 ETH');
  });

  describe('detectScreenFromUrl', () => {
    it('detects send, swap, settings and unlock from hash routes', () => {
      expect(detectScreenFromUrl('chrome-extension://id/home.html#/send')).toBe(
        'send',
      );
      expect(
        detectScreenFromUrl(
          `chrome-extension://id/home.html#${CROSS_CHAIN_SWAP_ROUTE + PREPARE_SWAP_ROUTE}`,
        ),
      ).toBe('swap');
      expect(
        detectScreenFromUrl(
          `chrome-extension://id/home.html#${SETTINGS_ROUTE}`,
        ),
      ).toBe('settings');
      expect(
        detectScreenFromUrl(`chrome-extension://id/home.html#${UNLOCK_ROUTE}`),
      ).toBe('unlock');
    });

    it('detects confirm and signature requests from canonical routes', () => {
      expect(
        detectScreenFromUrl(
          `chrome-extension://id/home.html#${CONFIRM_TRANSACTION_ROUTE}/123`,
        ),
      ).toBe('confirm-transaction');
      expect(
        detectScreenFromUrl(
          `chrome-extension://id/home.html#${CONFIRM_TRANSACTION_ROUTE}/123${SIGNATURE_REQUEST_PATH}`,
        ),
      ).toBe('confirm-signature');
    });

    it('detects notification and unknown routes', () => {
      expect(
        detectScreenFromUrl('chrome-extension://id/notification.html'),
      ).toBe('notification');
      expect(
        detectScreenFromUrl('chrome-extension://id/home.html#/random'),
      ).toBe('unknown');
    });

    it('detects all onboarding sub-routes', () => {
      expect(
        detectScreenFromUrl(
          'chrome-extension://id/home.html#/onboarding/welcome',
        ),
      ).toBe('onboarding-welcome');
      expect(
        detectScreenFromUrl(
          'chrome-extension://id/home.html#/onboarding/create-password',
        ),
      ).toBe('onboarding-password');
      expect(
        detectScreenFromUrl(
          'chrome-extension://id/home.html#/onboarding/import-with-recovery-phrase',
        ),
      ).toBe('onboarding-import');
      expect(
        detectScreenFromUrl(
          'chrome-extension://id/home.html#/onboarding/reveal-recovery-phrase',
        ),
      ).toBe('onboarding-srp');
      expect(
        detectScreenFromUrl(
          'chrome-extension://id/home.html#/onboarding/review-recovery-phrase',
        ),
      ).toBe('onboarding-srp');
      expect(
        detectScreenFromUrl(
          'chrome-extension://id/home.html#/onboarding/confirm-recovery-phrase',
        ),
      ).toBe('onboarding-srp');
      expect(
        detectScreenFromUrl(
          'chrome-extension://id/home.html#/onboarding/completion',
        ),
      ).toBe('onboarding-complete');
      expect(
        detectScreenFromUrl(
          'chrome-extension://id/home.html#/onboarding/help-us-improve',
        ),
      ).toBe('onboarding-metametrics');
      expect(
        detectScreenFromUrl(
          `chrome-extension://id/home.html#${ONBOARDING_METAMETRICS}`,
        ),
      ).toBe('onboarding-metametrics');
      expect(
        detectScreenFromUrl(
          'chrome-extension://id/home.html#/onboarding/privacy-settings',
        ),
      ).toBe('onboarding-privacy');
    });

    it('detects onboarding base route as onboarding-welcome', () => {
      expect(
        detectScreenFromUrl('chrome-extension://id/home.html#/onboarding'),
      ).toBe('onboarding-welcome');
    });

    it('detects home route from hash /', () => {
      expect(detectScreenFromUrl('chrome-extension://id/home.html#/')).toBe(
        'home',
      );
    });

    it('detects home route from empty hash', () => {
      expect(detectScreenFromUrl('chrome-extension://id/home.html')).toBe(
        'home',
      );
    });

    it('does not false-positive home for /send, /settings, /onboarding', () => {
      expect(detectScreenFromUrl('chrome-extension://id/home.html#/send')).toBe(
        'send',
      );
      expect(
        detectScreenFromUrl('chrome-extension://id/home.html#/settings'),
      ).toBe('settings');
      expect(
        detectScreenFromUrl('chrome-extension://id/home.html#/onboarding'),
      ).toBe('onboarding-welcome');
    });

    it('detects onboarding/unlock as unlock not onboarding', () => {
      expect(
        detectScreenFromUrl(
          'chrome-extension://id/home.html#/onboarding/unlock',
        ),
      ).toBe('unlock');
    });
  });

  describe('detectCurrentScreen', () => {
    it('returns unknown when page is undefined', async () => {
      await expect(detectCurrentScreen(undefined)).resolves.toBe('unknown');
    });

    it('prefers URL detection when route is known', async () => {
      const page = buildPage('chrome-extension://id/home.html#/send');
      await expect(detectCurrentScreen(page)).resolves.toBe('send');
    });

    it('falls back to selector detection when route is unknown', async () => {
      const page = buildPage('chrome-extension://id/home.html#/random', {
        '[data-testid="onboarding-create-wallet"]': true,
      });

      await expect(detectCurrentScreen(page)).resolves.toBe(
        'onboarding-create',
      );
    });

    it('handles selector lookup failures and returns unknown', async () => {
      const page = buildPage('chrome-extension://id/home.html#/random', {}, [
        '[data-testid="unlock-password"]',
      ]);

      await expect(detectCurrentScreen(page)).resolves.toBe('unknown');
    });
  });

  describe('detectUnlockState', () => {
    it('returns true for unlocked screens without DOM check', async () => {
      const page = buildPage('chrome-extension://id/home.html#/');

      await expect(detectUnlockState(page, 'home')).resolves.toBe(true);
      await expect(detectUnlockState(page, 'send')).resolves.toBe(true);
      await expect(detectUnlockState(page, 'settings')).resolves.toBe(true);
      await expect(detectUnlockState(page, 'swap')).resolves.toBe(true);
      await expect(
        detectUnlockState(page, 'confirm-transaction'),
      ).resolves.toBe(true);
      expect(page.locator).not.toHaveBeenCalled();
    });

    it('returns false for locked/onboarding screens without DOM check', async () => {
      const page = buildPage('chrome-extension://id/home.html');

      await expect(detectUnlockState(page, 'unlock')).resolves.toBe(false);
      await expect(detectUnlockState(page, 'onboarding-welcome')).resolves.toBe(
        false,
      );
      await expect(
        detectUnlockState(page, 'onboarding-password'),
      ).resolves.toBe(false);
      await expect(detectUnlockState(page, 'onboarding-privacy')).resolves.toBe(
        false,
      );
      expect(page.locator).not.toHaveBeenCalled();
    });

    it('falls back to DOM check for unknown screen', async () => {
      const page = buildPage('chrome-extension://id/home.html', {
        '[data-testid="account-menu-icon"]': true,
      });

      await expect(detectUnlockState(page, 'unknown')).resolves.toBe(true);
      expect(page.locator).toHaveBeenCalledWith(
        '[data-testid="account-menu-icon"]',
      );
    });

    it('returns false when DOM check fails', async () => {
      const page = buildPage('chrome-extension://id/home.html', {}, [
        '[data-testid="account-menu-icon"]',
      ]);

      await expect(detectUnlockState(page, 'unknown')).resolves.toBe(false);
    });
  });

  describe('getExtensionState', () => {
    it('throws when extension is not initialized', async () => {
      await expect(
        getBaseExtensionState(undefined, {
          extensionId: undefined,
          chainId: 1,
        }),
      ).rejects.toThrow('Extension not initialized');
    });

    it('returns identity fields on unlocked non-home screens via stateHooks', async () => {
      const page = buildPage(
        'chrome-extension://id/home.html#/send',
        {},
        [],
        DEFAULT_METAMASK_STATE,
      );

      const state = await getBaseExtensionState(page, {
        extensionId: 'a'.repeat(32),
        chainId: 1,
      });

      expect(state.isLoaded).toBe(true);
      expect(state.extensionId).toBe('a'.repeat(32));
      expect(state.currentScreen).toBe('send');
      expect(state.isUnlocked).toBe(true);
      expect(state.accountAddress).toBe('0xABC123def456');
      expect(state.networkName).toBe('Localhost 8545');
      expect(state.chainId).toBe(1337);
      expect(state.balance).toBeNull();
      expect(HomePage).not.toHaveBeenCalled();
    });

    it('returns identity and balance when unlocked on home', async () => {
      const page = buildPage(
        'chrome-extension://id/home.html#/',
        {},
        [],
        DEFAULT_METAMASK_STATE,
      );

      const state = await getBaseExtensionState(page, {
        extensionId: 'b'.repeat(32),
        chainId: 1337,
      });

      expect(state.currentScreen).toBe('home');
      expect(state.isUnlocked).toBe(true);
      expect(state.accountAddress).toBe('0xABC123def456');
      expect(state.networkName).toBe('Localhost 8545');
      expect(state.chainId).toBe(1337);
      expect(state.balance).toBe('25 ETH');
      expect(HomePage).toHaveBeenCalledWith(page);
    });

    it('returns null identity when CDP session fails', async () => {
      const page = buildPage('chrome-extension://id/home.html#/');
      (page.context().newCDPSession as jest.Mock).mockRejectedValue(
        new Error('Page navigating'),
      );

      const state = await getBaseExtensionState(page, {
        extensionId: 'e'.repeat(32),
        chainId: 1337,
      });

      expect(state.accountAddress).toBeNull();
      expect(state.networkName).toBeNull();
      expect(state.chainId).toBe(1337);
      expect(state.balance).toBe('25 ETH');
    });

    it('returns null identity when evaluate returns null', async () => {
      const page = buildPage('chrome-extension://id/home.html#/', {}, [], null);

      const state = await getBaseExtensionState(page, {
        extensionId: 'f'.repeat(32),
        chainId: 1,
      });

      expect(state.accountAddress).toBeNull();
      expect(state.networkName).toBeNull();
      expect(state.chainId).toBe(1);
    });

    it('parses hex chainId from Redux state to number', async () => {
      const page = buildPage('chrome-extension://id/home.html#/', {}, [], {
        ...DEFAULT_METAMASK_STATE,
        networkConfigurationsByChainId: {
          '0x1': {
            name: 'Ethereum Mainnet',
            chainId: '0x1',
            rpcEndpoints: [{ networkClientId: 'network-client-1' }],
          },
        },
      });

      const state = await getBaseExtensionState(page, {
        extensionId: 'g'.repeat(32),
        chainId: 1337,
      });

      expect(state.chainId).toBe(1);
    });

    it('falls back to options.chainId when Redux chainId is null', async () => {
      const page = buildPage('chrome-extension://id/home.html#/', {}, [], {
        ...DEFAULT_METAMASK_STATE,
        networkConfigurationsByChainId: {
          '0x539': {
            name: 'Localhost 8545',
            chainId: null,
            rpcEndpoints: [{ networkClientId: 'network-client-1' }],
          },
        },
      });

      const state = await getBaseExtensionState(page, {
        extensionId: 'h'.repeat(32),
        chainId: 42,
      });

      expect(state.chainId).toBe(42);
    });

    it('returns isUnlocked: true when URL is home even if account-menu-icon not visible', async () => {
      const page = buildPage('chrome-extension://id/home.html#/', {
        '[data-testid="account-menu-icon"]': false,
      });

      const state = await getBaseExtensionState(page, {
        extensionId: 'c'.repeat(32),
        chainId: 1,
      });

      expect(state.currentScreen).toBe('home');
      expect(state.isUnlocked).toBe(true);
    });

    it('returns isUnlocked: false during onboarding even if account-menu-icon visible', async () => {
      const page = buildPage(
        'chrome-extension://id/home.html#/onboarding/welcome',
        {
          '[data-testid="account-menu-icon"]': true,
        },
      );

      const state = await getBaseExtensionState(page, {
        extensionId: 'd'.repeat(32),
        chainId: 1,
      });

      expect(state.currentScreen).toBe('onboarding-welcome');
      expect(state.isUnlocked).toBe(false);
    });

    it('extracts identity even when locked but skips balance', async () => {
      const page = buildPage(
        'chrome-extension://id/home.html#/unlock',
        {},
        [],
        DEFAULT_METAMASK_STATE,
      );

      const state = await getBaseExtensionState(page, {
        extensionId: 'i'.repeat(32),
        chainId: 1,
      });

      expect(state.isUnlocked).toBe(false);
      expect(state.accountAddress).toBe('0xABC123def456');
      expect(state.networkName).toBe('Localhost 8545');
      expect(state.chainId).toBe(1337);
      expect(state.balance).toBeNull();
      expect(HomePage).not.toHaveBeenCalled();
    });
  });
});
