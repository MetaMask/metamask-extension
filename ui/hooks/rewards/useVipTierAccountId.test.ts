import { renderHookWithProvider } from '../../../test/lib/render-helpers-navigate';
import { useVipTierAccountId } from './useVipTierAccountId';

jest.mock('../../helpers/utils/rewards-utils', () => ({
  formatAccountToCaipAccountId: (address: string, chainId: string) =>
    `eip155:${chainId}:${address}`,
}));

const buildState = ({
  address,
  chainId = '0x1',
}: {
  address?: string;
  chainId?: string;
}) => ({
  metamask: {
    internalAccounts: address
      ? {
          selectedAccount: 'acc-1',
          accounts: {
            'acc-1': {
              id: 'acc-1',
              address,
              metadata: { name: 'Account', keyring: { type: 'HD Key Tree' } },
              type: 'eip155:eoa',
              scopes: [],
              methods: [],
            },
          },
        }
      : { selectedAccount: '', accounts: {} },
    selectedNetworkClientId: 'mainnet',
    networkConfigurationsByChainId: {
      [chainId]: {
        chainId,
        rpcEndpoints: [{ networkClientId: 'mainnet' }],
        defaultRpcEndpointIndex: 0,
      },
    },
  },
});

describe('useVipTierAccountId', () => {
  it('returns the CAIP-10 account ID for the selected account', () => {
    const { result } = renderHookWithProvider(
      () => useVipTierAccountId(),
      buildState({ address: '0xabc123' }),
    );

    expect(result.current).toBe('eip155:0x1:0xabc123');
  });

  it('returns null when no account is selected', () => {
    const { result } = renderHookWithProvider(
      () => useVipTierAccountId(),
      buildState({}),
    );

    expect(result.current).toBeNull();
  });
});
