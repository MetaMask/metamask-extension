import HeaderNavbar from '../../page-objects/pages/home/header-navbar';
import HomePage from '../../page-objects/pages/home/homepage';
import LoginPage from '../../page-objects/pages/onboarding/login-page';
import StartOnboardingPage from '../../page-objects/pages/onboarding/start-onboarding-page';
import type { Driver } from '../../webdriver/driver';
import {
  LAUNCH_SCREEN_CHECKS,
  describeScreens,
  detectScreenFromPageObjects,
  isWalletHeaderVisible,
  readHomeBalance,
  waitForAnyScreen,
  waitForHomePage,
} from './screen-checks';

const notShown = () => Promise.reject(new Error('not shown'));

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

jest.mock('../../page-objects/pages/onboarding/login-page', () =>
  mockPageObject(() => ({ checkPageIsLoaded: mockLoginLoaded })),
);
jest.mock('../../page-objects/pages/onboarding/start-onboarding-page', () =>
  mockPageObject(() => ({ checkLoginPageIsLoaded: mockWelcomeLoaded })),
);
jest.mock('../../page-objects/pages/home/homepage', () =>
  mockPageObject(() => ({
    checkPageIsLoaded: mockHomeLoaded,
    getBalance: mockGetBalance,
  })),
);
jest.mock('../../page-objects/pages/home/header-navbar', () =>
  mockPageObject(() => ({ checkPageIsLoaded: mockHeaderLoaded })),
);
jest.mock('../../page-objects/pages/onboarding/onboarding-srp-page', () =>
  mockPageObject(() => ({ checkPageIsLoaded: mockOtherLoaded })),
);
jest.mock('../../page-objects/pages/onboarding/onboarding-password-page', () =>
  mockPageObject(() => ({ checkPageIsLoaded: mockOtherLoaded })),
);
jest.mock('../../page-objects/pages/onboarding/onboarding-complete-page', () =>
  mockPageObject(() => ({ checkPageIsLoaded: mockOtherLoaded })),
);
jest.mock('../../page-objects/pages/onboarding/onboarding-metrics-page', () =>
  mockPageObject(() => ({ checkPageIsLoaded: mockOtherLoaded })),
);
jest.mock(
  '../../page-objects/pages/onboarding/onboarding-privacy-settings-page',
  () => mockPageObject(() => ({ checkPageIsLoaded: mockOtherLoaded })),
);
jest.mock('../../page-objects/pages/settings/settings-page', () =>
  mockPageObject(() => ({ checkPageIsLoaded: mockOtherLoaded })),
);

const driver = { timeout: 30_000 } as unknown as Driver;

describe('screen-checks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    for (const check of [
      mockLoginLoaded,
      mockWelcomeLoaded,
      mockHomeLoaded,
      mockHeaderLoaded,
      mockOtherLoaded,
    ]) {
      check.mockImplementation(notShown);
    }
  });

  describe('waitForAnyScreen', () => {
    it('resolves with the screen whose page object loads', async () => {
      mockWelcomeLoaded.mockResolvedValue(undefined);

      const reached = await waitForAnyScreen(driver, LAUNCH_SCREEN_CHECKS);

      expect(reached.screen).toBe('onboarding-welcome');
      expect(StartOnboardingPage).toHaveBeenCalledWith(driver);
    });

    it('rejects when no page object loads', async () => {
      await expect(
        waitForAnyScreen(driver, LAUNCH_SCREEN_CHECKS),
      ).rejects.toBeInstanceOf(AggregateError);
    });
  });

  it('describes the launch screens', () => {
    expect(describeScreens(LAUNCH_SCREEN_CHECKS)).toBe(
      'unlock page, onboarding welcome page, home page',
    );
  });

  describe('detectScreenFromPageObjects', () => {
    it('returns the detected screen and probes with the short timeout', async () => {
      mockLoginLoaded.mockResolvedValue(undefined);

      await expect(detectScreenFromPageObjects(driver, 500)).resolves.toBe(
        'unlock',
      );
      const probeDriver = jest.mocked(LoginPage).mock.calls[0][0];
      expect(probeDriver.timeout).toBe(500);
    });

    it('returns unknown when nothing matches', async () => {
      await expect(detectScreenFromPageObjects(driver, 500)).resolves.toBe(
        'unknown',
      );
    });

    it('returns unknown when a page object waits past the timeout', async () => {
      mockWelcomeLoaded.mockReturnValue(new Promise(() => undefined));

      await expect(detectScreenFromPageObjects(driver, 20)).resolves.toBe(
        'unknown',
      );
    });
  });

  it('waits for the home page', async () => {
    mockHomeLoaded.mockResolvedValue(undefined);

    await waitForHomePage(driver);

    expect(HomePage).toHaveBeenCalledWith(driver);
  });

  describe('isWalletHeaderVisible', () => {
    it('is true when the header navbar loads', async () => {
      mockHeaderLoaded.mockResolvedValue(undefined);

      await expect(isWalletHeaderVisible(driver, 300)).resolves.toBe(true);
      expect(jest.mocked(HeaderNavbar).mock.calls[0][0].timeout).toBe(300);
    });

    it('is false when the header navbar does not load', async () => {
      await expect(isWalletHeaderVisible(driver, 300)).resolves.toBe(false);
    });
  });

  describe('readHomeBalance', () => {
    it('returns the home page balance', async () => {
      mockGetBalance.mockResolvedValue('25 ETH');

      await expect(readHomeBalance(driver, 300)).resolves.toBe('25 ETH');
      expect(mockGetBalance).toHaveBeenCalledWith(300);
    });

    it('returns null when the balance is empty or missing', async () => {
      mockGetBalance.mockResolvedValueOnce('');
      await expect(readHomeBalance(driver, 300)).resolves.toBeNull();

      mockGetBalance.mockRejectedValueOnce(new Error('not shown'));
      await expect(readHomeBalance(driver, 300)).resolves.toBeNull();
    });
  });
});
