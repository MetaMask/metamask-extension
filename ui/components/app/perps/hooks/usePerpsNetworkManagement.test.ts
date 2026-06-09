import { act, renderHook } from '@testing-library/react-hooks';
import {
  CHAIN_IDS,
  FEATURED_RPCS,
} from '../../../../../shared/constants/network';
import { usePerpsNetworkManagement } from './usePerpsNetworkManagement';

const mockDispatch = jest.fn();
let mockIsTestnet = false;
let mockNetworkConfigs: Record<string, unknown> = {};

jest.mock('react-redux', () => ({
  useDispatch: () => mockDispatch,
  useSelector: (selector: () => unknown) => selector(),
}));

jest.mock('../../../../selectors/perps-controller', () => ({
  selectPerpsIsTestnet: () => mockIsTestnet,
}));

jest.mock('../../../../../shared/lib/selectors/networks', () => ({
  getNetworkConfigurationsByChainId: () => mockNetworkConfigs,
}));

jest.mock('../../../../store/actions', () => ({
  addNetwork: jest.fn((config) => ({ type: 'ADD_NETWORK', payload: config })),
}));

describe('usePerpsNetworkManagement', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsTestnet = false;
    mockNetworkConfigs = {};
  });

  it('adds the Arbitrum One network when it is not configured (mainnet)', async () => {
    const { result } = renderHook(() => usePerpsNetworkManagement());

    await act(async () => {
      await result.current.ensureArbitrumNetworkExists();
    });

    expect(mockDispatch).toHaveBeenCalledTimes(1);
    const dispatched = mockDispatch.mock.calls[0][0];
    expect(dispatched.payload.chainId).toBe(CHAIN_IDS.ARBITRUM);
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

  it('does not add a network absent from the featured list (testnet)', async () => {
    mockIsTestnet = true;
    // Arbitrum Sepolia is not in FEATURED_RPCS, so there is nothing to add.
    const isFeatured = FEATURED_RPCS.some(
      (rpc) => rpc.chainId === CHAIN_IDS.ARBITRUM_SEPOLIA,
    );

    const { result } = renderHook(() => usePerpsNetworkManagement());

    await act(async () => {
      await result.current.ensureArbitrumNetworkExists();
    });

    expect(isFeatured).toBe(false);
    expect(mockDispatch).not.toHaveBeenCalled();
  });
});
