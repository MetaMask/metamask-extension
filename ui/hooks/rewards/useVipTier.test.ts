import { waitFor } from '@testing-library/react';
import { renderHookWithProvider } from '../../../test/lib/render-helpers-navigate';
import { setBackgroundConnection } from '../../store/background-connection';
import { useVipTier } from './useVipTier';

jest.mock('../../helpers/utils/rewards-utils', () => ({
  formatAccountToCaipAccountId: (address: string, chainId: string) =>
    `eip155:${chainId}:${address}`,
}));

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
          scopes: [],
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

  it('returns the VIP tier on success', async () => {
    mockGetVipTierForAccount.mockResolvedValue(3);

    const { result } = renderHookWithProvider(
      () => useVipTier(),
      stateWithAccount,
    );

    await waitFor(() => {
      expect(result.current).toBe(3);
    });

    expect(mockGetVipTierForAccount).toHaveBeenCalledWith(
      'eip155:0x1:0xabc123',
    );
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
});
