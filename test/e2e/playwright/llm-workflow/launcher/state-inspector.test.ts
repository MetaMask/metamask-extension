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
import HeaderNavbar from '../../../page-objects/pages/home/header-navbar';
import StartOnboardingPage from '../../../page-objects/pages/onboarding/start-onboarding-page';
import type { Driver } from '../../../webdriver/driver';
import { getE2EDriver } from '../e2e-driver';
import {
  LAUNCH_SCREEN_CHECKS,
  detectCurrentScreen,
  detectScreenFromUrl,
  detectUnlockState,
  getBaseExtensionState,
  waitForAnyScreen,
} from './state-inspector';

const mockDriver = { timeout: 30_000 } as unknown as Driver;

jest.mock('../e2e-driver', () => ({
  getE2EDriver: jest.fn(),
  withTimeout: (driver: object, timeout: number) => ({ ...driver, timeout }),
}));

const mockLoginLoaded = jest.fn();
const mockWelcomeLoaded = jest.fn();
const mockHomeLoaded = jest.fn();
const mockGetBalance = jest.fn();
const mockHeaderLoaded = jest.fn();
const mockOtherLoaded = jest.fn();

function mockPageObject(methods: () => Record<string, jest.Mock>) {
  return {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    __esModule: true,
    default: jest.fn().mockImplementation(() => methods()),
  };
}

jest.mock('../../../page-objects/pages/onboarding/login-page', () =>
  mockPageObject(() => ({ checkPageIsLoaded: mockLoginLoaded })),
);
jest.mock('../../../page-objects/pages/onboarding/start-onboarding-page', () =>
  mockPageObject(() => ({ checkLoginPageIsLoaded: mockWelcomeLoaded })),
);
jest.mock('../../../page-objects/pages/home/homepage', () =>
  mockPageObject(() => ({
    checkPageIsLoaded: mockHomeLoaded,
    getBalance: mockGetBalance,
  })),
);
jest.mock('../../../page-objects/pages/home/header-navbar', () =>
  mockPageObject(() => ({ checkPageIsLoaded: mockHeaderLoaded })),
);
jest.mock('../../../page-objects/pages/onboarding/onboarding-srp-page', () =>
  mockPageObject(() => ({ checkPageIsLoaded: mockOtherLoaded })),
);
jest.mock(
  '../../../page-objects/pages/onboarding/onboarding-password-page',
  () => mockPageObject(() => ({ checkPageIsLoaded: mockOtherLoaded })),
);
jest.mock(
  '../../../page-objects/pages/onboarding/onboarding-complete-page',
  () => mockPageObject(() => ({ checkPageIsLoaded: mockOtherLoaded })),
);
jest.mock(
  '../../../page-objects/pages/onboarding/onboarding-metrics-page',
  () => mockPageObject(() => ({ checkPageIsLoaded: mockOtherLoaded })),
);
jest.mock(
  '../../../page-objects/pages/onboarding/onboarding-privacy-settings-page',
  () => mockPageObject(() => ({ checkPageIsLoaded: mockOtherLoaded })),
);
jest.mock('../../../page-objects/pages/settings/settings-page', () =>
  mockPageObject(() => ({ checkPageIsLoaded: mockOtherLoaded })),
);

const notShown = () => Promise.reject(new Error('not shown'));

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
  cdpMetamaskState: unknown = null,
): Page {
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
  } as unknown as Page;
}

describe('state-inspector', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(getE2EDriver).mockReturnValue(mockDriver);
    for (const check of [
      mockLoginLoaded,
      mockWelcomeLoaded,
      mockHomeLoaded,
      mockHeaderLoaded,
      mockOtherLoaded,
    ]) {
      check.mockImplementation(notShown);
    }
    mockGetBalance.mockResolvedValue('25 ETH');
  });

  describe('waitForAnyScreen', () => {
    it('resolves with the screen whose page object loads', async () => {
      mockWelcomeLoaded.mockResolvedValue(undefined);

      const reached = await waitForAnyScreen(mockDriver, LAUNCH_SCREEN_CHECKS);

      expect(reached.screen).toBe('onboarding-welcome');
      expect(StartOnboardingPage).toHaveBeenCalledWith(mockDriver);
    });

    it('rejects when no page object loads', async () => {
      await expect(
        waitForAnyScreen(mockDriver, LAUNCH_SCREEN_CHECKS),
      ).rejects.toBeInstanceOf(AggregateError);
    });
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
      expect(getE2EDriver).not.toHaveBeenCalled();
    });

    it('falls back to the e2e page objects with a short timeout when route is unknown', async () => {
      const page = buildPage('chrome-extension://id/home.html#/random');
      mockWelcomeLoaded.mockResolvedValue(undefined);

      await expect(detectCurrentScreen(page)).resolves.toBe(
        'onboarding-welcome',
      );
      expect(getE2EDriver).toHaveBeenCalledWith(page);
      expect(jest.mocked(StartOnboardingPage).mock.calls[0][0].timeout).toBe(
        2_000,
      );
    });

    it('returns unknown when no page object matches', async () => {
      const page = buildPage('chrome-extension://id/home.html#/random');

      await expect(detectCurrentScreen(page)).resolves.toBe('unknown');
    });

    it('returns unknown when a page object waits past the probe limit', async () => {
      jest.useFakeTimers();
      try {
        const page = buildPage('chrome-extension://id/home.html#/random');
        mockWelcomeLoaded.mockReturnValue(new Promise(() => undefined));

        const detected = detectCurrentScreen(page);
        await jest.advanceTimersByTimeAsync(2_000);

        await expect(detected).resolves.toBe('unknown');
      } finally {
        jest.useRealTimers();
      }
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
      expect(HeaderNavbar).not.toHaveBeenCalled();
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
      expect(HeaderNavbar).not.toHaveBeenCalled();
    });

    it('falls back to the e2e header navbar for unknown screen', async () => {
      const page = buildPage('chrome-extension://id/home.html');
      mockHeaderLoaded.mockResolvedValue(undefined);

      await expect(detectUnlockState(page, 'unknown')).resolves.toBe(true);
      expect(jest.mocked(HeaderNavbar).mock.calls[0][0].timeout).toBe(2_000);
    });

    it('returns false when the header navbar is not shown', async () => {
      const page = buildPage('chrome-extension://id/home.html');

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
      expect(mockGetBalance).not.toHaveBeenCalled();
    });

    it('returns identity and balance when unlocked on home', async () => {
      const page = buildPage(
        'chrome-extension://id/home.html#/',
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
      expect(mockGetBalance).toHaveBeenCalledWith(2_000);
    });

    it('returns a null balance when the home balance is empty or missing', async () => {
      const page = buildPage('chrome-extension://id/home.html#/');
      const options = { extensionId: 'j'.repeat(32), chainId: 1 };

      mockGetBalance.mockResolvedValueOnce('');
      expect((await getBaseExtensionState(page, options)).balance).toBeNull();

      mockGetBalance.mockRejectedValueOnce(new Error('not shown'));
      expect((await getBaseExtensionState(page, options)).balance).toBeNull();
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
      const page = buildPage('chrome-extension://id/home.html#/', null);

      const state = await getBaseExtensionState(page, {
        extensionId: 'f'.repeat(32),
        chainId: 1,
      });

      expect(state.accountAddress).toBeNull();
      expect(state.networkName).toBeNull();
      expect(state.chainId).toBe(1);
    });

    it('parses hex chainId from Redux state to number', async () => {
      const page = buildPage('chrome-extension://id/home.html#/', {
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
      const page = buildPage('chrome-extension://id/home.html#/', {
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

    it('returns isUnlocked: true when URL is home even if the header navbar is not visible', async () => {
      const page = buildPage('chrome-extension://id/home.html#/');

      const state = await getBaseExtensionState(page, {
        extensionId: 'c'.repeat(32),
        chainId: 1,
      });

      expect(state.currentScreen).toBe('home');
      expect(state.isUnlocked).toBe(true);
    });

    it('returns isUnlocked: false during onboarding even if the header navbar is visible', async () => {
      mockHeaderLoaded.mockResolvedValue(undefined);
      const page = buildPage(
        'chrome-extension://id/home.html#/onboarding/welcome',
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
      expect(mockGetBalance).not.toHaveBeenCalled();
    });
  });
});
