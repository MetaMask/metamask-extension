import { renderHookWithProvider } from '../../test/lib/render-helpers';
import {
  accountTrackerStartPolling,
  accountTrackerStopPollingByPollingToken,
} from '../store/actions';
import useAccountTrackerPolling from './useAccountTrackerPolling';

let mockPromises: Promise<string>[];

jest.mock('../store/actions', () => ({
  accountTrackerStartPolling: jest.fn().mockImplementation((input) => {
    const promise = Promise.resolve(`${input}_tracking`);
    mockPromises.push(promise);
    return promise;
  }),
  accountTrackerStopPollingByPollingToken: jest.fn(),
}));

let originalPortfolioView: string | undefined;

describe('useAccountTrackerPolling', () => {
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

  it('should poll account trackers for network client IDs when enabled and stop on dismount', async () => {
    process.env.PORTFOLIO_VIEW = 'true';

    const state = {
      metamask: {
        isUnlocked: true,
        completedOnboarding: true,
        selectedNetworkClientId: 'selectedNetworkClientId',
        networkConfigurationsByChainId: {
          '0x1': {
            chainId: '0x1',
            defaultRpcEndpointIndex: 0,
            rpcEndpoints: [
              {
                networkClientId: 'selectedNetworkClientId',
              },
            ],
          },
          '0x89': {
            chainId: '0x89',
            defaultRpcEndpointIndex: 0,
            rpcEndpoints: [
              {
                networkClientId: 'selectedNetworkClientId2',
              },
            ],
          },
        },
      },
    };

    const { unmount } = renderHookWithProvider(
      () => useAccountTrackerPolling(),
      state,
    );

    // Should poll each client ID
    await Promise.all(mockPromises);
    expect(accountTrackerStartPolling).toHaveBeenCalledTimes(2);
    expect(accountTrackerStartPolling).toHaveBeenCalledWith(
      'selectedNetworkClientId',
    );
    expect(accountTrackerStartPolling).toHaveBeenCalledWith(
      'selectedNetworkClientId2',
    );

    // Stop polling on dismount
    unmount();
    expect(accountTrackerStopPollingByPollingToken).toHaveBeenCalledTimes(2);
    expect(accountTrackerStopPollingByPollingToken).toHaveBeenCalledWith(
      'selectedNetworkClientId_tracking',
    );
  });

  it('should not poll if onboarding is not completed', async () => {
    const state = {
      metamask: {
        isUnlocked: true,
        completedOnboarding: false,
        networkConfigurationsByChainId: {
          '0x1': {},
        },
      },
    };

    renderHookWithProvider(() => useAccountTrackerPolling(), state);

    await Promise.all(mockPromises);
    expect(accountTrackerStartPolling).toHaveBeenCalledTimes(0);
    expect(accountTrackerStopPollingByPollingToken).toHaveBeenCalledTimes(0);
  });

  it('should not poll when locked', async () => {
    const state = {
      metamask: {
        isUnlocked: false,
        completedOnboarding: true,
        networkConfigurationsByChainId: {
          '0x1': {},
        },
      },
    };

    renderHookWithProvider(() => useAccountTrackerPolling(), state);

    await Promise.all(mockPromises);
    expect(accountTrackerStartPolling).toHaveBeenCalledTimes(0);
    expect(accountTrackerStopPollingByPollingToken).toHaveBeenCalledTimes(0);
  });

  it('should not poll when no network client IDs are provided', async () => {
    const state = {
      metamask: {
        isUnlocked: true,
        completedOnboarding: true,
        networkConfigurationsByChainId: {
          '0x1': {},
        },
      },
    };

    renderHookWithProvider(() => useAccountTrackerPolling(), state);

    await Promise.all(mockPromises);
    expect(accountTrackerStartPolling).toHaveBeenCalledTimes(0);
    expect(accountTrackerStopPollingByPollingToken).toHaveBeenCalledTimes(0);
  });
});
