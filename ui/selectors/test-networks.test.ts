import { getIsTestnetInUse, getShouldShowTestNetworks } from './test-networks';

const mainnet = {
  chainId: '0x1',
  rpcEndpoints: [{ networkClientId: 'mainnet' }],
};

const sepolia = {
  chainId: '0xaa36a7',
  rpcEndpoints: [{ networkClientId: 'sepolia' }],
};

const connectedSubject = (origin: string) => ({
  permissions: {
    'endowment:caip25': {
      parentCapability: 'endowment:caip25',
      invoker: origin,
      caveats: [
        {
          type: 'authorizedScopes',
          value: {
            requiredScopes: {},
            optionalScopes: {
              'eip155:1': {
                accounts: [
                  'eip155:1:0x1111111111111111111111111111111111111111',
                ],
              },
            },
            isMultichainOrigin: false,
          },
        },
      ],
    },
  },
});

const buildState = ({
  selectedChainId = 'eip155:1',
  showTestNetworks = false,
  domains = { 'https://dapp.example': 'mainnet' },
  connectedOrigins = ['https://dapp.example'],
}: {
  selectedChainId?: string;
  showTestNetworks?: boolean;
  domains?: Record<string, string>;
  connectedOrigins?: string[];
} = {}) =>
  ({
    metamask: {
      isEvmSelected: false,
      selectedMultichainNetworkChainId: selectedChainId,
      domains,
      subjects: Object.fromEntries(
        connectedOrigins.map((origin) => [origin, connectedSubject(origin)]),
      ),
      networkConfigurationsByChainId: {
        '0x1': mainnet,
        '0xaa36a7': sepolia,
      },
      preferences: { showTestNetworks },
    },
  }) as never;

describe('test network visibility selectors', () => {
  it('stays off when every dapp and the selected network are mainnet', () => {
    const state = buildState();

    expect(getIsTestnetInUse(state)).toBe(false);
    expect(getShouldShowTestNetworks(state)).toBe(false);
  });

  it('is on when a connected dapp is on a testnet even if the wallet network is mainnet', () => {
    const state = buildState({
      domains: {
        'https://mainnet.example': 'mainnet',
        'https://dapp.example': 'sepolia',
      },
      connectedOrigins: ['https://dapp.example'],
    });

    expect(getIsTestnetInUse(state)).toBe(true);
    expect(getShouldShowTestNetworks(state)).toBe(true);
  });

  it('stays off when only a disconnected origin is still recorded on a testnet', () => {
    const state = buildState({
      domains: {
        'https://dapp.example': 'mainnet',
        'https://old.example': 'sepolia',
      },
      connectedOrigins: ['https://dapp.example'],
    });

    expect(getIsTestnetInUse(state)).toBe(false);
    expect(getShouldShowTestNetworks(state)).toBe(false);
  });

  it('is on when the selected network is a testnet', () => {
    const state = buildState({ selectedChainId: 'eip155:11155111' });

    expect(getIsTestnetInUse(state)).toBe(true);
    expect(getShouldShowTestNetworks(state)).toBe(true);
  });

  it('follows the preference when no testnet is in use', () => {
    const state = buildState({ showTestNetworks: true });

    expect(getIsTestnetInUse(state)).toBe(false);
    expect(getShouldShowTestNetworks(state)).toBe(true);
  });
});
