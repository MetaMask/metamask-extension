import { AVAILABLE_MULTICHAIN_NETWORK_CONFIGURATIONS } from '@metamask/multichain-network-controller';
import { BtcScope } from '@metamask/keyring-api';
import { renderHookWithProvider } from '../../test/lib/render-helpers-navigate';
import {
  tokenListStartPolling,
  tokenListStopPollingByPollingToken,
} from '../store/actions';
import useTokenListPolling from './useTokenListPolling';

let mockPromises: Promise<string>[];

jest.mock('../store/actions', () => ({
  tokenListStartPolling: jest.fn().mockImplementation((input) => {
    const promise = Promise.resolve(`${input}_token`);
    mockPromises.push(promise);
    return promise;
  }),
  tokenListStopPollingByPollingToken: jest.fn(),
}));

const getBaseState = (
  overrides: Record<string, unknown> = {},
  enabledNetworkMap: Record<string, Record<string, boolean>> = {
    eip155: {
      '0x1': true,
    },
  },
) => ({
  metamask: {
    isUnlocked: true,
    completedOnboarding: true,
    useExternalServices: true,
    useTokenDetection: true,
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
    },
    multichainNetworkConfigurationsByChainId:
      AVAILABLE_MULTICHAIN_NETWORK_CONFIGURATIONS,
    selectedMultichainNetworkChainId: BtcScope.Mainnet,
    isEvmSelected: true,
    ...overrides,
  },
});

describe('useTokenListPolling', () => {
  beforeEach(() => {
    mockPromises = [];
    jest.clearAllMocks();
  });

  it('should poll the selected network when enabled, and stop on dismount', async () => {
    const { unmount } = renderHookWithProvider(
      () => useTokenListPolling(),
      getBaseState(),
    );

    // Should poll each chain
    await Promise.all(mockPromises);
    expect(tokenListStartPolling).toHaveBeenCalledTimes(1);
    expect(tokenListStartPolling).toHaveBeenCalledWith('0x1');

    // Stop polling on dismount
    unmount();
    expect(tokenListStopPollingByPollingToken).toHaveBeenCalledTimes(1);
    expect(tokenListStopPollingByPollingToken).toHaveBeenCalledWith(
      '0x1_token',
    );
  });

  it('should not poll before onboarding is completed', async () => {
    renderHookWithProvider(
      () => useTokenListPolling(),
      getBaseState({ completedOnboarding: false }),
    );

    await Promise.all(mockPromises);
    expect(tokenListStartPolling).toHaveBeenCalledTimes(0);
    expect(tokenListStopPollingByPollingToken).toHaveBeenCalledTimes(0);
  });

  it('should not poll when locked', async () => {
    renderHookWithProvider(
      () => useTokenListPolling(),
      getBaseState({ isUnlocked: false }),
    );

    await Promise.all(mockPromises);
    expect(tokenListStartPolling).toHaveBeenCalledTimes(0);
    expect(tokenListStopPollingByPollingToken).toHaveBeenCalledTimes(0);
  });

  it('should not poll when disabled', async () => {
    // disabled when detection, petnames, and simulations are all disabled
    renderHookWithProvider(
      () => useTokenListPolling(),
      getBaseState({
        useTokenDetection: false,
        useTransactionSimulations: false,
      }),
    );

    await Promise.all(mockPromises);
    expect(tokenListStartPolling).toHaveBeenCalledTimes(0);
    expect(tokenListStopPollingByPollingToken).toHaveBeenCalledTimes(0);
  });
});
