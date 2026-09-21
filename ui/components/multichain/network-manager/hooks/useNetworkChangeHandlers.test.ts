import { renderHook, act } from '@testing-library/react';
import { toEvmCaipChainId } from '@metamask/multichain-network-controller';
import { CHAIN_IDS } from '../../../../../shared/constants/network';
import {
  setActiveNetwork,
  setEnabledNetworks,
} from '../../../../store/actions';
import { useNetworkChangeHandlers } from './useNetworkChangeHandlers';

const mockDispatch = jest.fn();
const mockTrackEvent = jest.fn();
const mockCreateEventBuilder = jest.fn(() => ({
  addCategory: jest.fn().mockReturnThis(),
  addProperties: jest.fn().mockReturnThis(),
  build: jest.fn().mockReturnValue({ event: 'NavNetworkSwitched' }),
}));

const mockMainnetCaip = toEvmCaipChainId(CHAIN_IDS.MAINNET);
const mockLineaCaip = toEvmCaipChainId(CHAIN_IDS.LINEA_MAINNET);

jest.mock('../../../../store/hooks', () => ({
  useDispatch: () => mockDispatch,
}));

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: (selector: (state: unknown) => unknown) => selector({}),
}));

jest.mock('../../../../hooks/useAnalytics', () => ({
  useAnalytics: () => ({
    trackEvent: mockTrackEvent,
    createEventBuilder: mockCreateEventBuilder,
  }),
}));

jest.mock('../../../../store/actions', () => ({
  detectNfts: jest.fn(() => ({ type: 'DETECT_NFTS' })),
  setActiveNetwork: jest.fn((id: string) => ({
    type: 'SET_ACTIVE_NETWORK',
    id,
  })),
  setEnabledNetworks: jest.fn((chainId: string) => ({
    type: 'SET_ENABLED_NETWORKS',
    chainId,
  })),
  setNextNonce: jest.fn(() => ({ type: 'SET_NEXT_NONCE' })),
  updateCustomNonce: jest.fn(() => ({ type: 'UPDATE_CUSTOM_NONCE' })),
}));

jest.mock('../../../../selectors', () => {
  const { CHAIN_IDS: mockChainIds } = jest.requireActual(
    '../../../../../shared/constants/network',
  );
  const { toEvmCaipChainId: mockToEvmCaipChainId } = jest.requireActual(
    '@metamask/multichain-network-controller',
  );
  const mainnetCaip = mockToEvmCaipChainId(mockChainIds.MAINNET);
  const lineaCaip = mockToEvmCaipChainId(mockChainIds.LINEA_MAINNET);

  return {
    getAllChainsToPoll: () => [],
    getEnabledNetworksByNamespace: () => ({}),
    getSelectedMultichainNetworkChainId: () => mainnetCaip,
    getMultichainNetworkConfigurationsByChainId: () => [
      {
        [mainnetCaip]: {
          chainId: mainnetCaip,
          name: 'Ethereum',
          isEvm: true,
        },
        [lineaCaip]: {
          chainId: lineaCaip,
          name: 'Linea',
          isEvm: true,
        },
      },
      {
        [mainnetCaip]: {
          chainId: mockChainIds.MAINNET,
          defaultRpcEndpointIndex: 0,
          rpcEndpoints: [
            {
              networkClientId: 'mainnet',
              url: 'https://mainnet.infura.io',
            },
          ],
        },
        [lineaCaip]: {
          chainId: mockChainIds.LINEA_MAINNET,
          defaultRpcEndpointIndex: 0,
          rpcEndpoints: [
            {
              networkClientId: 'linea-mainnet',
              url: 'https://linea.infura.io',
            },
          ],
        },
      },
    ],
  };
});

jest.mock('../../../../../shared/lib/network.utils', () => ({
  ...jest.requireActual('../../../../../shared/lib/network.utils'),
  getRpcDataByChainId: (
    chainId: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    evmNetworks: Record<string, any>,
  ) => ({
    defaultRpcEndpoint: evmNetworks[chainId].rpcEndpoints[0],
  }),
}));

describe('useNetworkChangeHandlers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('dispatches enabled + active network updates for EVM switches', async () => {
    const { result } = renderHook(() => useNetworkChangeHandlers());

    await act(async () => {
      await result.current.handleNetworkChange(mockLineaCaip);
    });

    expect(setEnabledNetworks).toHaveBeenCalledWith(CHAIN_IDS.LINEA_MAINNET);
    expect(setActiveNetwork).toHaveBeenCalledWith('linea-mainnet');
    expect(mockDispatch).toHaveBeenCalledWith(
      setEnabledNetworks(CHAIN_IDS.LINEA_MAINNET),
    );
    expect(mockDispatch).toHaveBeenCalledWith(
      setActiveNetwork('linea-mainnet'),
    );
    expect(mockTrackEvent).toHaveBeenCalled();
  });

  it('exposes isPending and startTransition for callers', () => {
    const { result } = renderHook(() => useNetworkChangeHandlers());

    expect(result.current.isPending).toBe(false);
    expect(typeof result.current.startTransition).toBe('function');
  });

  it('keeps isPending true until network switch dispatches settle', async () => {
    let resolveEnabled!: () => void;
    const enabledPromise = new Promise<void>((resolve) => {
      resolveEnabled = resolve;
    });

    mockDispatch.mockImplementation((action: { type?: string }) => {
      if (action?.type === 'SET_ENABLED_NETWORKS') {
        return enabledPromise;
      }
      return Promise.resolve();
    });

    const { result } = renderHook(() => useNetworkChangeHandlers());

    let changePromise!: Promise<void>;
    await act(async () => {
      changePromise = result.current.handleNetworkChange(mockLineaCaip);
    });

    expect(result.current.isPending).toBe(true);

    await act(async () => {
      resolveEnabled();
      await changePromise;
    });

    expect(result.current.isPending).toBe(false);
  });
});
