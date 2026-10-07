import { renderHook, act } from '@testing-library/react';
import { toEvmCaipChainId } from '@metamask/multichain-network-controller';
import { CHAIN_IDS } from '../../../../../shared/constants/chain-ids';
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

jest.mock('../../../../selectors/selectors', () => {
  const { CHAIN_IDS: mockChainIds } = jest.requireActual(
    '../../../../../shared/constants/chain-ids',
  );
  const { toEvmCaipChainId: mockToEvmCaipChainId } = jest.requireActual(
    '@metamask/multichain-network-controller',
  );
  const mainnetCaip = mockToEvmCaipChainId(mockChainIds.MAINNET);
  const lineaCaip = mockToEvmCaipChainId(mockChainIds.LINEA_MAINNET);

  return {
    ...jest.requireActual('../../../../selectors/selectors'),
    getAllChainsToPoll: () => [],
  };
});
jest.mock('../../../../selectors/confirm-transaction', () => {
  const { CHAIN_IDS: mockChainIds } = jest.requireActual(
    '../../../../../shared/constants/chain-ids',
  );
  const { toEvmCaipChainId: mockToEvmCaipChainId } = jest.requireActual(
    '@metamask/multichain-network-controller',
  );
  const mainnetCaip = mockToEvmCaipChainId(mockChainIds.MAINNET);
  const lineaCaip = mockToEvmCaipChainId(mockChainIds.LINEA_MAINNET);

  return {
    ...jest.requireActual('../../../../selectors/confirm-transaction'),
  };
});
jest.mock('../../../../pages/confirmations/selectors/confirm', () => {
  const { CHAIN_IDS: mockChainIds } = jest.requireActual(
    '../../../../../shared/constants/chain-ids',
  );
  const { toEvmCaipChainId: mockToEvmCaipChainId } = jest.requireActual(
    '@metamask/multichain-network-controller',
  );
  const mainnetCaip = mockToEvmCaipChainId(mockChainIds.MAINNET);
  const lineaCaip = mockToEvmCaipChainId(mockChainIds.LINEA_MAINNET);

  return {
    ...jest.requireActual('../../../../pages/confirmations/selectors/confirm'),
  };
});
jest.mock('../../../../selectors/accounts', () => {
  const { CHAIN_IDS: mockChainIds } = jest.requireActual(
    '../../../../../shared/constants/chain-ids',
  );
  const { toEvmCaipChainId: mockToEvmCaipChainId } = jest.requireActual(
    '@metamask/multichain-network-controller',
  );
  const mainnetCaip = mockToEvmCaipChainId(mockChainIds.MAINNET);
  const lineaCaip = mockToEvmCaipChainId(mockChainIds.LINEA_MAINNET);

  return {
    ...jest.requireActual('../../../../selectors/accounts'),
  };
});
jest.mock('../../../../selectors/onboarding/onboarding', () => {
  const { CHAIN_IDS: mockChainIds } = jest.requireActual(
    '../../../../../shared/constants/chain-ids',
  );
  const { toEvmCaipChainId: mockToEvmCaipChainId } = jest.requireActual(
    '@metamask/multichain-network-controller',
  );
  const mainnetCaip = mockToEvmCaipChainId(mockChainIds.MAINNET);
  const lineaCaip = mockToEvmCaipChainId(mockChainIds.LINEA_MAINNET);

  return {
    ...jest.requireActual('../../../../selectors/onboarding/onboarding'),
  };
});
jest.mock('../../../../selectors/multichain/networks', () => {
  const { CHAIN_IDS: mockChainIds } = jest.requireActual(
    '../../../../../shared/constants/chain-ids',
  );
  const { toEvmCaipChainId: mockToEvmCaipChainId } = jest.requireActual(
    '@metamask/multichain-network-controller',
  );
  const mainnetCaip = mockToEvmCaipChainId(mockChainIds.MAINNET);
  const lineaCaip = mockToEvmCaipChainId(mockChainIds.LINEA_MAINNET);

  return {
    ...jest.requireActual('../../../../selectors/multichain/networks'),
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
jest.mock('../../../../../shared/lib/selectors/assets-migration', () => {
  const { CHAIN_IDS: mockChainIds } = jest.requireActual(
    '../../../../../shared/constants/chain-ids',
  );
  const { toEvmCaipChainId: mockToEvmCaipChainId } = jest.requireActual(
    '@metamask/multichain-network-controller',
  );
  const mainnetCaip = mockToEvmCaipChainId(mockChainIds.MAINNET);
  const lineaCaip = mockToEvmCaipChainId(mockChainIds.LINEA_MAINNET);

  return {
    ...jest.requireActual(
      '../../../../../shared/lib/selectors/assets-migration',
    ),
  };
});
jest.mock('../../../../selectors/approvals', () => {
  const { CHAIN_IDS: mockChainIds } = jest.requireActual(
    '../../../../../shared/constants/chain-ids',
  );
  const { toEvmCaipChainId: mockToEvmCaipChainId } = jest.requireActual(
    '@metamask/multichain-network-controller',
  );
  const mainnetCaip = mockToEvmCaipChainId(mockChainIds.MAINNET);
  const lineaCaip = mockToEvmCaipChainId(mockChainIds.LINEA_MAINNET);

  return {
    ...jest.requireActual('../../../../selectors/approvals'),
  };
});
jest.mock('../../../../selectors/transactions', () => {
  const { CHAIN_IDS: mockChainIds } = jest.requireActual(
    '../../../../../shared/constants/chain-ids',
  );
  const { toEvmCaipChainId: mockToEvmCaipChainId } = jest.requireActual(
    '@metamask/multichain-network-controller',
  );
  const mainnetCaip = mockToEvmCaipChainId(mockChainIds.MAINNET);
  const lineaCaip = mockToEvmCaipChainId(mockChainIds.LINEA_MAINNET);

  return {
    ...jest.requireActual('../../../../selectors/transactions'),
  };
});
jest.mock('../../../../selectors/custom-gas', () => {
  const { CHAIN_IDS: mockChainIds } = jest.requireActual(
    '../../../../../shared/constants/chain-ids',
  );
  const { toEvmCaipChainId: mockToEvmCaipChainId } = jest.requireActual(
    '@metamask/multichain-network-controller',
  );
  const mainnetCaip = mockToEvmCaipChainId(mockChainIds.MAINNET);
  const lineaCaip = mockToEvmCaipChainId(mockChainIds.LINEA_MAINNET);

  return {
    ...jest.requireActual('../../../../selectors/custom-gas'),
  };
});
jest.mock('../../../../selectors/metametrics', () => {
  const { CHAIN_IDS: mockChainIds } = jest.requireActual(
    '../../../../../shared/constants/chain-ids',
  );
  const { toEvmCaipChainId: mockToEvmCaipChainId } = jest.requireActual(
    '@metamask/multichain-network-controller',
  );
  const mainnetCaip = mockToEvmCaipChainId(mockChainIds.MAINNET);
  const lineaCaip = mockToEvmCaipChainId(mockChainIds.LINEA_MAINNET);

  return {
    ...jest.requireActual('../../../../selectors/metametrics'),
  };
});
jest.mock('../../../../../shared/lib/selectors/multichain', () => {
  const { CHAIN_IDS: mockChainIds } = jest.requireActual(
    '../../../../../shared/constants/chain-ids',
  );
  const { toEvmCaipChainId: mockToEvmCaipChainId } = jest.requireActual(
    '@metamask/multichain-network-controller',
  );
  const mainnetCaip = mockToEvmCaipChainId(mockChainIds.MAINNET);
  const lineaCaip = mockToEvmCaipChainId(mockChainIds.LINEA_MAINNET);

  return {
    ...jest.requireActual('../../../../../shared/lib/selectors/multichain'),
  };
});
jest.mock('../../../../selectors/first-time-flow', () => {
  const { CHAIN_IDS: mockChainIds } = jest.requireActual(
    '../../../../../shared/constants/chain-ids',
  );
  const { toEvmCaipChainId: mockToEvmCaipChainId } = jest.requireActual(
    '@metamask/multichain-network-controller',
  );
  const mainnetCaip = mockToEvmCaipChainId(mockChainIds.MAINNET);
  const lineaCaip = mockToEvmCaipChainId(mockChainIds.LINEA_MAINNET);

  return {
    ...jest.requireActual('../../../../selectors/first-time-flow'),
  };
});
jest.mock('../../../../selectors/multichain/feature-flags', () => {
  const { CHAIN_IDS: mockChainIds } = jest.requireActual(
    '../../../../../shared/constants/chain-ids',
  );
  const { toEvmCaipChainId: mockToEvmCaipChainId } = jest.requireActual(
    '@metamask/multichain-network-controller',
  );
  const mainnetCaip = mockToEvmCaipChainId(mockChainIds.MAINNET);
  const lineaCaip = mockToEvmCaipChainId(mockChainIds.LINEA_MAINNET);

  return {
    ...jest.requireActual('../../../../selectors/multichain/feature-flags'),
  };
});
jest.mock('../../../../selectors/test-networks', () => {
  const { CHAIN_IDS: mockChainIds } = jest.requireActual(
    '../../../../../shared/constants/chain-ids',
  );
  const { toEvmCaipChainId: mockToEvmCaipChainId } = jest.requireActual(
    '@metamask/multichain-network-controller',
  );
  const mainnetCaip = mockToEvmCaipChainId(mockChainIds.MAINNET);
  const lineaCaip = mockToEvmCaipChainId(mockChainIds.LINEA_MAINNET);

  return {
    ...jest.requireActual('../../../../selectors/test-networks'),
  };
});
jest.mock('../../../../selectors/origin-throttling', () => {
  const { CHAIN_IDS: mockChainIds } = jest.requireActual(
    '../../../../../shared/constants/chain-ids',
  );
  const { toEvmCaipChainId: mockToEvmCaipChainId } = jest.requireActual(
    '@metamask/multichain-network-controller',
  );
  const mainnetCaip = mockToEvmCaipChainId(mockChainIds.MAINNET);
  const lineaCaip = mockToEvmCaipChainId(mockChainIds.LINEA_MAINNET);

  return {
    ...jest.requireActual('../../../../selectors/origin-throttling'),
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
