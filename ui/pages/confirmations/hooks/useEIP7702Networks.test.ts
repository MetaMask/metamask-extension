import { renderHookWithProvider } from '../../../../test/lib/render-helpers';
import { useEIP7702Networks } from './useEIP7702Networks';

const mockNetworkConfig = {
  '0x1': {
    blockExplorerUrls: ['https://etherscan.io'],
    chainId: '0x1',
    defaultBlockExplorerUrlIndex: 0,
    defaultRpcEndpointIndex: 0,
    name: 'Ethereum Mainnet',
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
  '0x18c6': {
    blockExplorerUrls: ['https://megaexplorer.xyz'],
    chainId: '0x18c6',
    defaultBlockExplorerUrlIndex: 0,
    defaultRpcEndpointIndex: 0,
    name: 'Mega Testnet',
    nativeCurrency: 'MegaETH',
    rpcEndpoints: [
      {
        failoverUrls: [],
        networkClientId: 'megaeth-testnet',
        type: 'custom',
        url: 'https://carrot.megaeth.com/rpc',
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
    isSupported: false,
    upgradeContractAddress: '0x63c0c19a282a1B52b07dD5a65b58948A07DAE32B',
  },
  {
    chainId: '0x18c6',
    isSupported: false,
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
  return { result: result.current, rerender };
}

describe('useEIP7702Networks', () => {
  it('returns pending as true initially', () => {
    const { result } = runHook();
    expect(result.pending).toBe(true);
    expect(result.network7702List).toHaveLength(0);
  });

  it('does not return any network for hardware wallet account', () => {
    const { result } = runHook('ledger');
    expect(result.pending).toBe(false);
    expect(result.network7702List).toHaveLength(0);
  });
});
