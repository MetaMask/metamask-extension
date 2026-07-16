import { toEvmCaipChainId } from '@metamask/multichain-network-controller';
import type { MultichainNetworkConfiguration } from '@metamask/multichain-network-controller';
import { SolScope } from '@metamask/keyring-api';
import { renderHook } from '@testing-library/react-hooks';
import { CHAIN_IDS } from '../../../../../shared/constants/network';
import { removeNetwork, showModal } from '../../../../store/actions';
import { getSelectedMultichainNetworkChainId } from '../../../../selectors';
import { useNetworkItemCallbacks } from './useNetworkItemCallbacks';

const mockDispatch = jest.fn();

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: () => mockDispatch,
  useSelector: (selector: (state: unknown) => unknown) =>
    selector({
      metamask: {
        isUnlocked: true,
        completedOnboarding: true,
      },
    }),
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useSearchParams: () => [new URLSearchParams(), jest.fn()],
}));

jest.mock('../../../../store/actions', () => ({
  removeNetwork: jest.fn((chainId: string) => ({
    type: 'REMOVE_NETWORK',
    chainId,
  })),
  setEditedNetwork: jest.fn(),
  showModal: jest.fn((payload) => ({ type: 'SHOW_MODAL', payload })),
}));

jest.mock('../../../../selectors', () => ({
  getMultichainNetworkConfigurationsByChainId: () => [
    {},
    {
      '0xa': {
        chainId: 'eip155:10',
        rpcEndpoints: [{ url: 'https://example.com' }],
        defaultRpcEndpointIndex: 0,
      },
      '0xabc': {
        chainId: 'eip155:2748',
        rpcEndpoints: [{ url: 'https://example.com' }],
        defaultRpcEndpointIndex: 0,
      },
    },
  ],
  getNetworkDiscoverButtonEnabled: () => ({}),
  getSelectedMultichainNetworkChainId: jest.fn(() => 'eip155:1'),
}));

jest.mock('../../../../ducks/metamask/metamask', () => ({
  getCompletedOnboarding: () => true,
}));

jest.mock('../../../../ducks/metamask/base-selectors', () => ({
  getIsUnlocked: () => true,
}));

jest.mock('../../../../hooks/accounts/useAccountNetworkAvailability', () => ({
  useAccountNetworkAvailability: () => ({
    hasAnyAccountsInNetwork: () => true,
  }),
}));

const optimismNetwork = {
  chainId: toEvmCaipChainId(CHAIN_IDS.OPTIMISM),
  name: 'Optimism',
  isEvm: true,
} as MultichainNetworkConfiguration;

const customNetwork = {
  chainId: toEvmCaipChainId('0xabc' as `0x${string}`),
  name: 'Custom Network',
  isEvm: true,
} as MultichainNetworkConfiguration;

const solanaNetwork = {
  chainId: SolScope.Mainnet,
  name: 'Solana',
  isEvm: false,
  nativeCurrency: `${SolScope.Mainnet}/slip44:501`,
} as MultichainNetworkConfiguration;

const solanaDevnetNetwork = {
  chainId: SolScope.Devnet,
  name: 'Solana Devnet',
  isEvm: false,
  nativeCurrency: `${SolScope.Devnet}/slip44:501`,
} as MultichainNetworkConfiguration;

describe('useNetworkItemCallbacks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest
      .mocked(getSelectedMultichainNetworkChainId)
      .mockReturnValue('eip155:1');
  });

  it('shows Disable label and removes default networks without confirmation', () => {
    const { result } = renderHook(() => useNetworkItemCallbacks());
    const callbacks = result.current.getItemCallbacks(optimismNetwork);

    expect(callbacks.onDeleteMenuLabel).toBe('disable');
    callbacks.onDelete?.();

    expect(mockDispatch).toHaveBeenCalledWith(
      removeNetwork(optimismNetwork.chainId),
    );
    expect(showModal).not.toHaveBeenCalled();
  });

  it('shows Delete label and opens confirmation for custom networks', () => {
    const { result } = renderHook(() => useNetworkItemCallbacks());
    const callbacks = result.current.getItemCallbacks(customNetwork);

    expect(callbacks.onDeleteMenuLabel).toBe('delete');
    callbacks.onDelete?.();

    expect(mockDispatch).toHaveBeenCalledWith(
      showModal({
        name: 'CONFIRM_DELETE_NETWORK',
        target: '0xabc',
        onConfirm: expect.any(Function),
        onHide: expect.any(Function),
      }),
    );
    expect(removeNetwork).not.toHaveBeenCalled();
  });

  it('does not show Disable for the active default network', () => {
    jest
      .mocked(getSelectedMultichainNetworkChainId)
      .mockReturnValue(optimismNetwork.chainId);

    const { result } = renderHook(() => useNetworkItemCallbacks());
    const callbacks = result.current.getItemCallbacks(optimismNetwork);

    expect(callbacks.onDeleteMenuLabel).toBeUndefined();
    expect(callbacks.onDelete).toBeUndefined();
  });

  it('does not show Disable for featured non-EVM networks', () => {
    const { result } = renderHook(() => useNetworkItemCallbacks());
    const callbacks = result.current.getItemCallbacks(solanaNetwork);

    expect(callbacks.onDelete).toBeUndefined();
    expect(callbacks.onDeleteMenuLabel).toBeUndefined();
  });

  it('does not show Delete for non-EVM testnets', () => {
    const { result } = renderHook(() => useNetworkItemCallbacks());
    const callbacks = result.current.getItemCallbacks(solanaDevnetNetwork);

    expect(callbacks.onDelete).toBeUndefined();
    expect(callbacks.onDeleteMenuLabel).toBeUndefined();
  });
});
