import { act, waitFor } from '@testing-library/react';
import { renderHookWithProvider } from '../../../test/lib/render-helpers-navigate';
import { setBackgroundConnection } from '../../store/background-connection';
import { useVipTier } from './useVipTier';

const mockGetVipTierForAccount = jest.fn();
setBackgroundConnection({
  rewardsGetVipTierForAccount: async (...args: unknown[]) =>
    mockGetVipTierForAccount(...args),
} as never);

const stateWithAccount = {
  metamask: {
    internalAccounts: {
      selectedAccount: 'acc-1',
      accounts: {
        'acc-1': {
          id: 'acc-1',
          address: '0xabc123',
          metadata: { name: 'Account', keyring: { type: 'HD Key Tree' } },
          type: 'eip155:eoa',
          scopes: ['eip155:1'],
          methods: [],
        },
      },
    },
    selectedNetworkClientId: 'mainnet',
    networkConfigurationsByChainId: {
      '0x1': {
        chainId: '0x1',
        rpcEndpoints: [{ networkClientId: 'mainnet' }],
        defaultRpcEndpointIndex: 0,
      },
    },
    remoteFeatureFlags: {
      vipProgramEnabled: { enabled: true, minimumVersion: '0.0.0' },
    },
  },
};

const stateWithoutAccount = {
  metamask: {
    internalAccounts: { selectedAccount: '', accounts: {} },
    selectedNetworkClientId: 'mainnet',
    networkConfigurationsByChainId: {
      '0x1': {
        chainId: '0x1',
        rpcEndpoints: [{ networkClientId: 'mainnet' }],
        defaultRpcEndpointIndex: 0,
      },
    },
    remoteFeatureFlags: {
      vipProgramEnabled: { enabled: true, minimumVersion: '0.0.0' },
    },
  },
};

const stateWithVipDisabled = {
  metamask: {
    ...stateWithAccount.metamask,
    remoteFeatureFlags: {
      vipProgramEnabled: { enabled: false, minimumVersion: '0.0.0' },
    },
  },
};

const SOLANA_SCOPE = 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp';
const SOLANA_ADDRESS = 'FdASaVKKMZr5QZqdBCi4SbDLeLJYKLGyMEy4gHukTykP';

const stateWithSolanaAccount = {
  metamask: {
    ...stateWithAccount.metamask,
    internalAccounts: {
      selectedAccount: 'sol-1',
      accounts: {
        'sol-1': {
          id: 'sol-1',
          address: SOLANA_ADDRESS,
          metadata: {
            name: 'Solana Account',
            keyring: { type: 'Snap Keyring' },
          },
          type: 'solana:data-account',
          scopes: [SOLANA_SCOPE],
          methods: [],
        },
      },
    },
  },
};

const stateWithScopelessAccount = {
  metamask: {
    ...stateWithAccount.metamask,
    internalAccounts: {
      selectedAccount: 'acc-2',
      accounts: {
        'acc-2': {
          id: 'acc-2',
          address: '0xdef456',
          metadata: { name: 'Account', keyring: { type: 'HD Key Tree' } },
          type: 'eip155:eoa',
          scopes: [],
          methods: [],
        },
      },
    },
  },
};

describe('useVipTier', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns null initially while loading', () => {
    mockGetVipTierForAccount.mockReturnValue(new Promise(() => undefined));

    const { result } = renderHookWithProvider(
      () => useVipTier(),
      stateWithAccount,
    );

    expect(result.current).toBeNull();
  });

  it('returns the VIP tier on success and derives the CAIP-10 id from the account scope', async () => {
    mockGetVipTierForAccount.mockResolvedValue(3);

    const { result } = renderHookWithProvider(
      () => useVipTier(),
      stateWithAccount,
    );

    await waitFor(() => {
      expect(result.current).toBe(3);
    });

    expect(mockGetVipTierForAccount).toHaveBeenCalledWith('eip155:1:0xabc123');
  });

  it('builds a solana CAIP-10 id (not an eip155 one) for a non-EVM account', async () => {
    mockGetVipTierForAccount.mockResolvedValue(5);

    const { result } = renderHookWithProvider(
      () => useVipTier(),
      stateWithSolanaAccount,
    );

    await waitFor(() => {
      expect(result.current).toBe(5);
    });

    expect(mockGetVipTierForAccount).toHaveBeenCalledWith(
      `${SOLANA_SCOPE}:${SOLANA_ADDRESS}`,
    );
  });

  it('returns null and skips the lookup when the account has no scope', () => {
    const { result } = renderHookWithProvider(
      () => useVipTier(),
      stateWithScopelessAccount,
    );

    expect(result.current).toBeNull();
    expect(mockGetVipTierForAccount).not.toHaveBeenCalled();
  });

  it('returns null when no account is selected', () => {
    const { result } = renderHookWithProvider(
      () => useVipTier(),
      stateWithoutAccount,
    );

    expect(result.current).toBeNull();
    expect(mockGetVipTierForAccount).not.toHaveBeenCalled();
  });

  it('returns null when the background returns null', async () => {
    mockGetVipTierForAccount.mockResolvedValue(null);

    const { result } = renderHookWithProvider(
      () => useVipTier(),
      stateWithAccount,
    );

    await waitFor(() => {
      expect(mockGetVipTierForAccount).toHaveBeenCalledTimes(1);
    });

    expect(result.current).toBeNull();
  });

  it('returns null on error', async () => {
    mockGetVipTierForAccount.mockRejectedValue(new Error('fail'));

    const { result } = renderHookWithProvider(
      () => useVipTier(),
      stateWithAccount,
    );

    await waitFor(() => {
      expect(mockGetVipTierForAccount).toHaveBeenCalledTimes(1);
    });

    expect(result.current).toBeNull();
  });

  it('returns null and skips the lookup when vipProgramEnabled is false', () => {
    mockGetVipTierForAccount.mockResolvedValue(3);

    const { result } = renderHookWithProvider(
      () => useVipTier(),
      stateWithVipDisabled,
    );

    expect(result.current).toBeNull();
    expect(mockGetVipTierForAccount).not.toHaveBeenCalled();
  });

  it('refetches the VIP tier once the rewards subscription hydrates (cold-start race)', async () => {
    // Cold start: subscription state is not hydrated yet, so the controller
    // resolves no subscription and the background returns null (no /vip/fees).
    mockGetVipTierForAccount.mockResolvedValueOnce(null);

    const { result, store } = renderHookWithProvider(
      () => useVipTier(),
      stateWithAccount,
    );

    await waitFor(() => {
      expect(mockGetVipTierForAccount).toHaveBeenCalledTimes(1);
    });
    expect(result.current).toBeNull();

    // Silent auth completes and populates the active rewards subscription id.
    // The query is keyed on it, so this triggers a refetch that now resolves.
    mockGetVipTierForAccount.mockResolvedValueOnce(5);
    act(() => {
      store.dispatch({
        type: 'UPDATE_METAMASK_STATE',
        value: {
          rewardsActiveAccount: {
            account: 'eip155:1:0xabc123',
            subscriptionId: 'sub-1',
          },
        },
      });
    });

    await waitFor(() => {
      expect(result.current).toBe(5);
    });
    expect(mockGetVipTierForAccount).toHaveBeenCalledTimes(2);
  });
});
