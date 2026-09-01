import { AVAILABLE_MULTICHAIN_NETWORK_CONFIGURATIONS } from '@metamask/multichain-network-controller';
import { renderHookWithProvider } from '../../test/lib/render-helpers-navigate';
import {
  tokenDetectionStartPolling,
  tokenDetectionStopPollingByPollingToken,
} from '../store/actions';
import useTokenDetectionPolling from './useTokenDetectionPolling';

let mockPromises: Promise<string>[];

jest.mock('../store/actions', () => ({
  tokenDetectionStartPolling: jest.fn().mockImplementation((input) => {
    const promise = Promise.resolve(`${input}_detection`);
    mockPromises.push(promise);
    return promise;
  }),
  tokenDetectionStopPollingByPollingToken: jest.fn(),
}));

const getBaseState = (
  overrides: Record<string, unknown> = {},
  enabledNetworkMap: Record<string, Record<string, boolean>> = {
    eip155: {
      '0x1': true,
      '0x89': true,
    },
  },
) => ({
  metamask: {
    isUnlocked: true,
    completedOnboarding: true,
    useTokenDetection: true,
    selectedNetworkClientId: 'selectedNetworkClientId',
    enabledNetworkMap,
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
    ...overrides,
  },
});

let originalPortfolioView: string | undefined;

describe('useTokenDetectionPolling', () => {
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

  it('should poll token detection for chain IDs when enabled and stop on dismount', async () => {
    process.env.PORTFOLIO_VIEW = 'true';
    const { unmount } = renderHookWithProvider(
      () => useTokenDetectionPolling(),
      getBaseState(),
    );

    // Should poll each chain
    await Promise.all(mockPromises);
    expect(tokenDetectionStartPolling).toHaveBeenCalledTimes(1);
    expect(tokenDetectionStartPolling).toHaveBeenCalledWith(['0x1', '0x89']);

    // Stop polling on dismount
    unmount();
    expect(tokenDetectionStopPollingByPollingToken).toHaveBeenCalledTimes(1);
    expect(tokenDetectionStopPollingByPollingToken).toHaveBeenCalledWith(
      '0x1,0x89_detection',
    );
  });

  it('should not poll if onboarding is not completed', async () => {
    renderHookWithProvider(
      () => useTokenDetectionPolling(),
      getBaseState({ completedOnboarding: false }),
    );

    await Promise.all(mockPromises);
    expect(tokenDetectionStartPolling).toHaveBeenCalledTimes(0);
    expect(tokenDetectionStopPollingByPollingToken).toHaveBeenCalledTimes(0);
  });

  it('should not poll when locked', async () => {
    renderHookWithProvider(
      () => useTokenDetectionPolling(),
      getBaseState({ isUnlocked: false }),
    );

    await Promise.all(mockPromises);
    expect(tokenDetectionStartPolling).toHaveBeenCalledTimes(0);
    expect(tokenDetectionStopPollingByPollingToken).toHaveBeenCalledTimes(0);
  });

  it('should not poll when token detection is disabled', async () => {
    renderHookWithProvider(
      () => useTokenDetectionPolling(),
      getBaseState({ useTokenDetection: false }),
    );

    await Promise.all(mockPromises);
    expect(tokenDetectionStartPolling).toHaveBeenCalledTimes(0);
    expect(tokenDetectionStopPollingByPollingToken).toHaveBeenCalledTimes(0);
  });

  it('should not poll when no chains are provided', async () => {
    renderHookWithProvider(
      () => useTokenDetectionPolling(),
      getBaseState({}, { eip155: {} }),
    );

    await Promise.all(mockPromises);
    expect(tokenDetectionStartPolling).toHaveBeenCalledTimes(0);
    expect(tokenDetectionStopPollingByPollingToken).toHaveBeenCalledTimes(0);
  });
});
