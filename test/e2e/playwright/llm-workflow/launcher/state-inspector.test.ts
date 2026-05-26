import type { Page } from '@playwright/test';
import {
  CONFIRM_TRANSACTION_ROUTE,
  CROSS_CHAIN_SWAP_ROUTE,
  PREPARE_SWAP_ROUTE,
  SETTINGS_ROUTE,
  SIGNATURE_REQUEST_PATH,
  UNLOCK_ROUTE,
} from '../../../../../ui/helpers/constants/routes';
import { HomePage } from '../page-objects/home-page';
import {
  detectCurrentScreen,
  detectScreenFromUrl,
  getExtensionState,
} from './state-inspector';

const mockGetAccountAddress = jest.fn();
const mockGetNetworkName = jest.fn();
const mockGetBalance = jest.fn();

jest.mock('../page-objects/home-page', () => {
  return {
    HomePage: jest.fn().mockImplementation(() => {
      return {
        getAccountAddress: mockGetAccountAddress,
        getNetworkName: mockGetNetworkName,
        getBalance: mockGetBalance,
      };
    }),
  };
});

function buildPage(
  currentUrl = 'chrome-extension://id/home.html',
  visibleBySelector: Record<string, boolean> = {},
  rejectSelectors: string[] = [],
): Page {
  const rejectSet = new Set(rejectSelectors);
  return {
    url: jest.fn().mockReturnValue(currentUrl),
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
    mockGetAccountAddress.mockResolvedValue('0xabc');
    mockGetNetworkName.mockResolvedValue('Localhost 8545');
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

  describe('getExtensionState', () => {
    it('throws when extension is not initialized', async () => {
      await expect(
        getExtensionState(undefined, { extensionId: undefined, chainId: 1 }),
      ).rejects.toThrow('Extension not initialized');
    });

    it('returns minimal state for non-home screens', async () => {
      const page = buildPage('chrome-extension://id/home.html#/send', {
        '[data-testid="account-menu-icon"]': false,
      });

      const state = await getExtensionState(page, {
        extensionId: 'a'.repeat(32),
        chainId: 1,
      });

      expect(state.isLoaded).toBe(true);
      expect(state.extensionId).toBe('a'.repeat(32));
      expect(state.chainId).toBe(1);
      expect(state.currentScreen).toBe('send');
      expect(state.accountAddress).toBeNull();
      expect(state.networkName).toBeNull();
      expect(state.balance).toBeNull();
      expect(HomePage).not.toHaveBeenCalled();
    });

    it('returns home details when unlocked on home', async () => {
      const page = buildPage('chrome-extension://id/home.html#/random', {
        '[data-testid="account-menu-icon"]': true,
      });

      const state = await getExtensionState(page, {
        extensionId: 'b'.repeat(32),
        chainId: 1337,
      });

      expect(state.currentScreen).toBe('home');
      expect(state.isUnlocked).toBe(true);
      expect(state.accountAddress).toBe('0xabc');
      expect(state.networkName).toBe('Localhost 8545');
      expect(state.balance).toBe('25 ETH');
      expect(HomePage).toHaveBeenCalledWith(page);
    });
  });
});
