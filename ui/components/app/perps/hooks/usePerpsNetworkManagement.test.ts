import { act, renderHook } from '@testing-library/react-hooks';
import { CHAIN_IDS } from '../../../../../shared/constants/network';
import { usePerpsNetworkManagement } from './usePerpsNetworkManagement';

const mockDispatch = jest.fn();
let mockNetworkConfigs: Record<string, unknown> = {};

jest.mock('react-redux', () => ({
  useDispatch: () => mockDispatch,
  useSelector: (selector: () => unknown) => selector(),
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
    mockNetworkConfigs = {};
  });

  it('adds the Arbitrum One network when it is not configured', async () => {
    const { result } = renderHook(() => usePerpsNetworkManagement());

    await act(async () => {
      await result.current.ensureArbitrumNetworkExists();
    });

    expect(mockDispatch).toHaveBeenCalledTimes(1);
    const dispatched = mockDispatch.mock.calls[0][0];
    // Always Arbitrum One: the controller's DepositService resolves the deposit
    // route with isTestnet: false, so the deposit chain is mainnet Arbitrum
    // regardless of the perps testnet toggle. Adding any other chain (e.g.
    // Arbitrum Sepolia) would leave the controller without a network client and
    // the deposit would still fail.
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
});
