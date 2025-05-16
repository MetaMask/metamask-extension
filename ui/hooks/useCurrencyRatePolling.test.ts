import { renderHookWithProvider } from '../../test/lib/render-helpers';
import {
  currencyRateStartPolling,
  currencyRateStopPollingByPollingToken,
} from '../store/actions';
import useCurrencyRatePolling from './useCurrencyRatePolling';

let mockPromises: Promise<string>[];

jest.mock('../store/actions', () => ({
  currencyRateStartPolling: jest.fn().mockImplementation((input) => {
    const promise = Promise.resolve(`${input}_rates`);
    mockPromises.push(promise);
    return promise;
  }),
  currencyRateStopPollingByPollingToken: jest.fn(),
}));

let originalPortfolioView: string | undefined;

describe('useCurrencyRatePolling', () => {
  beforeEach(() => {
    // Mock process.env.PORTFOLIO_VIEW
    originalPortfolioView = process.env.PORTFOLIO_VIEW;
    process.env.PORTFOLIO_VIEW = 'true'; // Set your desired mock value here

    mockPromises = [];
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Restore the original value
    process.env.PORTFOLIO_VIEW = originalPortfolioView;
  });

  it('should poll currency rates for native currencies when enabled and stop on dismount', async () => {
    const state = {
      metamask: {
        isUnlocked: true,
        completedOnboarding: true,
        useCurrencyRateCheck: true,
        useSafeChainsListValidation: true,
        selectedNetworkClientId: 'selectedNetworkClientId',
        networkConfigurationsByChainId: {
          '0x1': {
            nativeCurrency: 'ETH',
            chainId: '0x1',
            defaultRpcEndpointIndex: 0,
            rpcEndpoints: [{ networkClientId: 'selectedNetworkClientId' }],
          },
          '0x38': {
            nativeCurrency: 'BNB',
            chainId: '0x38',
            defaultRpcEndpointIndex: 0,
            rpcEndpoints: [{ networkClientId: 'selectedNetworkClientId2' }],
          },
        },
      },
    };

    const { unmount } = renderHookWithProvider(
      () => useCurrencyRatePolling(),
      state,
    );

    // Wait for the asynchronous effect(s) to complete.
    await new Promise((r) => setTimeout(r, 0));
    await Promise.all(mockPromises);

    expect(currencyRateStartPolling).toHaveBeenCalledTimes(1);
    expect(currencyRateStartPolling).toHaveBeenCalledWith(['ETH', 'BNB']);

    // Simulate unmount, which should trigger stopping the polling.
    unmount();
    expect(currencyRateStopPollingByPollingToken).toHaveBeenCalledTimes(1);
    expect(currencyRateStopPollingByPollingToken).toHaveBeenCalledWith(
      'ETH,BNB_rates',
    );
  });

  it('should not poll if onboarding is not completed', async () => {
    const state = {
      metamask: {
        isUnlocked: true,
        completedOnboarding: false,
        useCurrencyRateCheck: true,
        useSafeChainsListValidation: true,
        networkConfigurationsByChainId: {
          '0x1': { nativeCurrency: 'ETH' },
        },
      },
    };

    renderHookWithProvider(() => useCurrencyRatePolling(), state);

    await Promise.all(mockPromises);
    expect(currencyRateStartPolling).toHaveBeenCalledTimes(0);
    expect(currencyRateStopPollingByPollingToken).toHaveBeenCalledTimes(0);
  });

  it('should not poll when locked', async () => {
    const state = {
      metamask: {
        isUnlocked: false,
        completedOnboarding: true,
        useCurrencyRateCheck: true,
        useSafeChainsListValidation: true,
        networkConfigurationsByChainId: {
          '0x1': { nativeCurrency: 'ETH' },
        },
      },
    };

    renderHookWithProvider(() => useCurrencyRatePolling(), state);

    await Promise.all(mockPromises);
    expect(currencyRateStartPolling).toHaveBeenCalledTimes(0);
    expect(currencyRateStopPollingByPollingToken).toHaveBeenCalledTimes(0);
  });

  it('should not poll when currency rate checking is disabled', async () => {
    const state = {
      metamask: {
        isUnlocked: true,
        completedOnboarding: true,
        useCurrencyRateCheck: false,
        useSafeChainsListValidation: true,
        networkConfigurationsByChainId: {
          '0x1': { nativeCurrency: 'ETH' },
        },
      },
    };

    renderHookWithProvider(() => useCurrencyRatePolling(), state);

    await Promise.all(mockPromises);
    expect(currencyRateStartPolling).toHaveBeenCalledTimes(0);
    expect(currencyRateStopPollingByPollingToken).toHaveBeenCalledTimes(0);
  });

  it('should not poll when native token does not match ticker', async () => {
    const state = {
      metamask: {
        isUnlocked: true,
        completedOnboarding: true,
        useCurrencyRateCheck: true,
        useSafeChainsListValidation: true,
        selectedNetworkClientId: 'selectedNetworkClientId',
        networkConfigurationsByChainId: {
          '0x1': {
            nativeCurrency: 'BTC', // Invalid Currency
            chainId: '0x1',
            defaultRpcEndpointIndex: 0,
            rpcEndpoints: [{ networkClientId: 'selectedNetworkClientId' }],
          },
        },
      },
    };

    renderHookWithProvider(() => useCurrencyRatePolling(), state);

    // Wait for the asynchronous effect(s) to complete.
    await new Promise((r) => setTimeout(r, 0));
    await Promise.all(mockPromises);

    expect(currencyRateStartPolling).toHaveBeenCalledTimes(0);
    expect(currencyRateStopPollingByPollingToken).toHaveBeenCalledTimes(0);
  });
});
