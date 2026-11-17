import { act, renderHook } from '@testing-library/react';
import { CHAIN_IDS } from '../../../../../shared/constants/network';
import { usePerpsNetworkManagement } from './usePerpsNetworkManagement';

const mockDispatch = jest.fn();
let mockNetworkConfigs: Record<string, unknown> = {};
let mockIsTestnet = false;

jest.mock('react-redux', () => ({
  useDispatch: () => mockDispatch,
  useSelector: (selector: () => unknown) => selector(),
}));

jest.mock('../../../../../shared/lib/selectors/networks', () => ({
  getNetworkConfigurationsByChainId: () => mockNetworkConfigs,
}));

jest.mock('../../../../selectors/perps-controller', () => ({
  selectPerpsIsTestnet: () => mockIsTestnet,
}));

jest.mock('../../../../store/actions', () => ({
  addNetwork: jest.fn((config) => ({ type: 'ADD_NETWORK', payload: config })),
}));

describe('usePerpsNetworkManagement', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNetworkConfigs = {};
    mockIsTestnet = false;
  });

  it('adds the Arbitrum One network on mainnet when it is not configured', async () => {
    const { result } = renderHook(() => usePerpsNetworkManagement());

    await act(async () => {
      await result.current.ensureArbitrumNetworkExists();
    });

    expect(mockDispatch).toHaveBeenCalledTimes(1);
    const dispatched = mockDispatch.mock.calls[0][0];
    expect(dispatched.payload.chainId).toBe(CHAIN_IDS.ARBITRUM);
  });

  it('adds the Arbitrum Sepolia network on testnet when it is not configured', async () => {
    mockIsTestnet = true;
    mockNetworkConfigs = {
      [CHAIN_IDS.ARBITRUM]: { chainId: CHAIN_IDS.ARBITRUM },
    };

    const { result } = renderHook(() => usePerpsNetworkManagement());

    await act(async () => {
      await result.current.ensureArbitrumNetworkExists();
    });

    expect(mockDispatch).toHaveBeenCalledTimes(1);
    const dispatched = mockDispatch.mock.calls[0][0];
    // The testnet deposit route settles USDC2 on Arbitrum Sepolia, so the
    // controller needs a network client for that chain, not Arbitrum One.
    expect(dispatched.payload).toStrictEqual(
      expect.objectContaining({
        chainId: CHAIN_IDS.ARBITRUM_SEPOLIA,
        name: 'Arbitrum Sepolia',
        nativeCurrency: 'ETH',
        rpcEndpoints: [
          expect.objectContaining({
            url: expect.stringMatching(
              /^https:\/\/arbitrum-sepolia\.infura\.io\/v3\//u,
            ),
          }),
        ],
      }),
    );
  });

  it('does not add Arbitrum Sepolia on testnet when it is already configured', async () => {
    mockIsTestnet = true;
    mockNetworkConfigs = {
      [CHAIN_IDS.ARBITRUM_SEPOLIA]: { chainId: CHAIN_IDS.ARBITRUM_SEPOLIA },
    };

    const { result } = renderHook(() => usePerpsNetworkManagement());

    await act(async () => {
      await result.current.ensureArbitrumNetworkExists();
    });

    expect(mockDispatch).not.toHaveBeenCalled();
  });

  it('does not add the network when it is already configured', async () => {
    mockNetworkConfigs = {
      [CHAIN_IDS.ARBITRUM]: { chainId: CHAIN_IDS.ARBITRUM },
    };

    const { result } = renderHook(() => usePerpsNetworkManagement());

    await act(async () => {
      await result.current.ensureArbitrumNetworkExists();
    });

    expect(mockDispatch).not.toHaveBeenCalled();
  });
});
