import { waitFor } from '@testing-library/react';
import { renderHookWithProvider } from '../../../../test/lib/render-helpers';
import {
  useEIP7702Networks,
  EIP7702NetworkConfiguration,
} from './useEIP7702Networks';

const mockNetworkConfig = {
  '0x1': {
    blockExplorerUrls: ['https://etherscan.io'],
    chainId: '0x1',
    defaultBlockExplorerUrlIndex: 0,
    defaultRpcEndpointIndex: 0,
    name: 'Ethereum',
    nativeCurrency: 'ETH',
    rpcEndpoints: [
      {
        failoverUrls: [],
        networkClientId: 'mainnet',
        type: 'infura',
        url: 'https://mainnet.infura.io/v3/{infuraProjectId}',
      },
    ],
  },
  '0x5': {
    blockExplorerUrls: ['https://goerli.etherscan.io'],
    chainId: '0x5',
    defaultBlockExplorerUrlIndex: 0,
    defaultRpcEndpointIndex: 0,
    name: 'Goerli',
    nativeCurrency: 'GoerliETH',
    rpcEndpoints: [
      {
        failoverUrls: [],
        networkClientId: 'goerli',
        type: 'infura',
        url: 'https://goerli.infura.io/v3/{infuraProjectId}',
      },
    ],
  },
  '0x18c7': {
    blockExplorerUrls: ['https://megaeth-testnet-v2.blockscout.com'],
    chainId: '0x18c7',
    defaultBlockExplorerUrlIndex: 0,
    defaultRpcEndpointIndex: 0,
    name: 'MegaETH Testnet',
    nativeCurrency: 'MegaETH',
    rpcEndpoints: [
      {
        failoverUrls: [],
        networkClientId: 'megaeth-testnet-v2',
        type: 'custom',
        url: 'https://timothy.megaeth.com/rpc',
      },
    ],
  },
  '0xaa36a7': {
    blockExplorerUrls: ['https://sepolia.etherscan.io'],
    chainId: '0xaa36a7',
    defaultBlockExplorerUrlIndex: 0,
    defaultRpcEndpointIndex: 0,
    name: 'Sepolia',
    nativeCurrency: 'SepoliaETH',
    rpcEndpoints: [
      {
        failoverUrls: [],
        networkClientId: 'sepolia',
        type: 'infura',
        url: 'https://sepolia.infura.io/v3/{infuraProjectId}',
      },
    ],
  },
};

const MOCK_ADDRESS = '0x8a0bbcd42cf79e7cee834e7808eb2fef1cebdb87';

const mockNetworkBatchSupport = [
  {
    chainId: '0xaa36a7',
    isSupported: true,
    upgradeContractAddress: '0x63c0c19a282a1B52b07dD5a65b58948A07DAE32B',
  },
  {
    chainId: '0x18c7',
    isSupported: true,
    upgradeContractAddress: '0x63c0c19a282a1B52b07dD5a65b58948A07DAE32B',
  },
  {
    chainId: '0x1',
    isSupported: true,
    upgradeContractAddress: '0x63c0c19a282a1B52b07dD5a65b58948A07DAE32B',
  },
  {
    chainId: '0x5',
    isSupported: true,
    upgradeContractAddress: '0x63c0c19a282a1B52b07dD5a65b58948A07DAE32B',
  },
];

jest.mock('../../../store/controller-actions/transaction-controller', () => ({
  isAtomicBatchSupported: () => Promise.resolve(mockNetworkBatchSupport),
}));

function runHook(keyringType = 'HD Key Tree') {
  const { result, rerender } = renderHookWithProvider(
    () => useEIP7702Networks(MOCK_ADDRESS),
    {
      metamask: {
        networkConfigurationsByChainId: mockNetworkConfig,

        internalAccounts: {
          accounts: {
            [MOCK_ADDRESS]: {
              address: MOCK_ADDRESS,
              metadata: {
                keyring: {
                  type: keyringType,
                },
              },
            },
          },
        },
      },
    },
  );
  return { result, rerender };
}

describe('useEIP7702Networks', () => {
  it('returns pending as true initially', () => {
    const { result } = runHook();
    expect(result.current.pending).toBe(true);
    expect(result.current.network7702List).toHaveLength(0);
  });

  it('does not return any network for hardware wallet account', () => {
    const { result } = runHook('ledger');
    expect(result.current.pending).toBe(false);
    expect(result.current.network7702List).toHaveLength(0);
  });

  it('sorts networks by chainId in ascending order', async () => {
    const { result } = runHook();

    await waitFor(() => expect(result.current.pending).toBe(false));

    expect(result.current.network7702List).toHaveLength(4);
    const chainIds =
      result.current.network7702List?.map(
        (network: EIP7702NetworkConfiguration) => network.chainIdHex,
      ) || [];
    expect(chainIds).toEqual(['0x1', '0x5', '0x18c7', '0xaa36a7']);

    // Verify the corresponding decimal values are in ascending order
    const decimalChainIds = chainIds.map((id: string) => parseInt(id, 16));
    expect(decimalChainIds).toEqual([1, 5, 6343, 11155111]);
  });

  it('returns the correct values for non-EVM accounts', () => {
    const { result } = runHook('ledger');

    expect(result.current.pending).toBe(false);
    expect(result.current.network7702List).toHaveLength(0);
    expect(result.current.networkSupporting7702Present).toBe(false);
    expect(result.current).toEqual({
      network7702List: [],
      networkSupporting7702Present: false,
      pending: false,
    });
  });
});
