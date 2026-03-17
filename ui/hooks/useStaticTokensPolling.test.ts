import { AVAILABLE_MULTICHAIN_NETWORK_CONFIGURATIONS } from '@metamask/multichain-network-controller';
import { renderHookWithProvider } from '../../test/lib/render-helpers-navigate';
import {
  staticAssetsStartPolling,
  staticAssetsStopPollingByPollingToken,
} from '../store/actions';
import useStaticTokensPollingHook from './useStaticTokensPolling';

const mockSelectedAccountAddress = '0x4f71DA06987BfeDE90aF0b33E1e3e4ffDCEE7a63';
const mockEnabledChainIds = ['0x1', '0x89'];
let mockPromises: Promise<string>[];

jest.mock('../store/actions', () => ({
  staticAssetsStartPolling: jest.fn().mockImplementation((input) => {
    const promise = Promise.resolve(`${input}_detection`);
    mockPromises.push(promise);
    return promise;
  }),
  staticAssetsStopPollingByPollingToken: jest.fn(),
}));

jest.mock('../selectors', () => ({
  ...jest.requireActual('../selectors'),
  getEnabledChainIds: jest.fn(() => mockEnabledChainIds),
  getSelectedAccount: jest.fn(() => ({
    address: mockSelectedAccountAddress,
  })),
}));

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

describe('useStaticTokensPollingHook', () => {
  beforeEach(() => {
    mockPromises = [];
    jest.clearAllMocks();
  });

  it('calls useMultiPolling with correct arguments when chain IDs and account are available', async () => {
    const { unmount } = renderHookWithProvider(
      () => useStaticTokensPollingHook(),
      state,
    );

    // Execute the polling
    await Promise.all(mockPromises);

    expect(staticAssetsStartPolling).toHaveBeenCalledTimes(1);
    expect(staticAssetsStartPolling).toHaveBeenCalledWith({
      chainIds: mockEnabledChainIds,
      selectedAccountAddress: mockSelectedAccountAddress,
    });
    unmount();
    expect(staticAssetsStopPollingByPollingToken).toHaveBeenCalledTimes(1);
  });
});
