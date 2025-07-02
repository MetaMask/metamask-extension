import { AVAILABLE_MULTICHAIN_NETWORK_CONFIGURATIONS } from '@metamask/multichain-network-controller';
import { renderHookWithProvider } from '../../test/lib/render-helpers';
import { deFiStartPolling, deFiStopPolling } from '../store/actions';
import useDeFiPolling from './useDeFiPolling';

let mockPromises: Promise<string>[];

jest.mock('../store/actions', () => ({
  deFiStartPolling: jest.fn().mockImplementation(() => {
    const promise = Promise.resolve(`detection`);
    mockPromises.push(promise);
    return promise;
  }),
  deFiStopPolling: jest.fn(),
}));
let originalPortfolioView: string | undefined;

describe('useDeFiPolling', () => {
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

  it('should poll defi when enabled and stop on dismount', async () => {
    process.env.PORTFOLIO_VIEW = 'true';
    const state = {
      metamask: {
        isUnlocked: true,
        completedOnboarding: true,
        useTokenDetection: true,
        selectedNetworkClientId: 'selectedNetworkClientId',
        enabledNetworkMap: {
          eip155: {
            '0x1': true,
            '0x89': true,
          },
        },
        multichainNetworkConfigurationsByChainId:
          AVAILABLE_MULTICHAIN_NETWORK_CONFIGURATIONS,
        selectedMultichainNetworkChainId: 'eip155:1',
        isEvmSelected: true,
        networkConfigurationsByChainId: {
          '0x1': {
            chainId: '0x1',
            rpcEndpoints: [
              {
                networkClientId: 'selectedNetworkClientId',
              },
            ],
          },
          '0x89': {
            chainId: '0x89',
            rpcEndpoints: [
              {
                networkClientId: 'selectedNetworkClientId2',
              },
            ],
          },
        },
      },
    };

    const { unmount } = renderHookWithProvider(() => useDeFiPolling(), state);

    // Should poll each chain
    await Promise.all(mockPromises);
    expect(deFiStartPolling).toHaveBeenCalledTimes(1);
    expect(deFiStartPolling).toHaveBeenCalledWith(null);

    // Stop polling on dismount
    unmount();
    expect(deFiStopPolling).toHaveBeenCalledTimes(1);
    expect(deFiStopPolling).toHaveBeenCalledWith('detection');
  });

  it('should not poll if onboarding is not completed', async () => {
    const state = {
      metamask: {
        isUnlocked: true,
        completedOnboarding: false,
        useTokenDetection: true,
        networkConfigurationsByChainId: {
          '0x1': {},
        },
      },
    };

    renderHookWithProvider(() => useDeFiPolling(), state);

    await Promise.all(mockPromises);
    expect(deFiStartPolling).toHaveBeenCalledTimes(0);
    expect(deFiStopPolling).toHaveBeenCalledTimes(0);
  });
});
