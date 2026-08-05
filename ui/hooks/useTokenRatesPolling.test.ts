import { AVAILABLE_MULTICHAIN_NETWORK_CONFIGURATIONS } from '@metamask/multichain-network-controller';
import { BtcScope } from '@metamask/keyring-api';
import { renderHookWithProvider } from '../../test/lib/render-helpers-navigate';
import {
  tokenRatesStartPolling,
  tokenRatesStopPollingByPollingToken,
} from '../store/actions';
import useTokenRatesPolling from './useTokenRatesPolling';

let mockPromises: Promise<string>[];

jest.mock('../store/actions', () => ({
  tokenRatesStartPolling: jest.fn().mockImplementation((input) => {
    const promise = Promise.resolve(`${input}_rates`);
    mockPromises.push(promise);
    return promise;
  }),
  tokenRatesStopPollingByPollingToken: jest.fn(),
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
    useCurrencyRateCheck: true,
    selectedNetworkClientId: 'selectedNetworkClientId',
    enabledNetworkMap,
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
    multichainNetworkConfigurationsByChainId:
      AVAILABLE_MULTICHAIN_NETWORK_CONFIGURATIONS,
    selectedMultichainNetworkChainId: BtcScope.Mainnet,
    isEvmSelected: true,
    ...overrides,
  },
});

let originalPortfolioView: string | undefined;
describe('useTokenRatesPolling', () => {
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

  it('should poll token rates when enabled and stop on dismount', async () => {
    const { unmount } = renderHookWithProvider(
      () => useTokenRatesPolling(),
      getBaseState(),
    );

    // Should poll each chain
    await Promise.all(mockPromises);
    expect(tokenRatesStartPolling).toHaveBeenCalledTimes(1);
    expect(tokenRatesStartPolling).toHaveBeenCalledWith(['0x1', '0x89']);
    // Stop polling on dismount
    unmount();
    expect(tokenRatesStopPollingByPollingToken).toHaveBeenCalledTimes(1);
    expect(tokenRatesStopPollingByPollingToken).toHaveBeenCalledWith(
      '0x1,0x89_rates',
    );
  });

  it('should not poll if onboarding is not completed', async () => {
    renderHookWithProvider(
      () => useTokenRatesPolling(),
      getBaseState({ completedOnboarding: false }),
    );

    await Promise.all(mockPromises);
    expect(tokenRatesStartPolling).toHaveBeenCalledTimes(0);
    expect(tokenRatesStopPollingByPollingToken).toHaveBeenCalledTimes(0);
  });

  it('should not poll when locked', async () => {
    renderHookWithProvider(
      () => useTokenRatesPolling(),
      getBaseState({ isUnlocked: false }),
    );

    await Promise.all(mockPromises);
    expect(tokenRatesStartPolling).toHaveBeenCalledTimes(0);
    expect(tokenRatesStopPollingByPollingToken).toHaveBeenCalledTimes(0);
  });

  it('should not poll when rate checking is disabled', async () => {
    renderHookWithProvider(
      () => useTokenRatesPolling(),
      getBaseState({ useCurrencyRateCheck: false }),
    );

    await Promise.all(mockPromises);
    expect(tokenRatesStartPolling).toHaveBeenCalledTimes(0);
    expect(tokenRatesStopPollingByPollingToken).toHaveBeenCalledTimes(0);
  });

  it('should not poll when no chains are provided', async () => {
    renderHookWithProvider(
      () => useTokenRatesPolling(),
      getBaseState({}, { eip155: {} }),
    );

    await Promise.all(mockPromises);
    expect(tokenRatesStartPolling).toHaveBeenCalledTimes(0);
    expect(tokenRatesStopPollingByPollingToken).toHaveBeenCalledTimes(0);
  });
});
