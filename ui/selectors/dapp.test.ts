import {
  NetworkConfiguration,
  RpcEndpointType,
} from '@metamask/network-controller';
import { getNetworkConfigurationsByChainId } from '../../shared/lib/selectors/networks';
import { getDappActiveNetwork, getIsEip1193CompatibleConnection } from './dapp';
import {
  getOrderedConnectedAccountsForActiveTab,
  getOriginOfCurrentTab,
  getPermissions,
  getAllDomains,
} from './selectors';
import { getMultichainNetworkConfigurationsByChainId } from './multichain';

// Mocked value for testing purposes only
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MockedValue = any;

// Mock the selectors that the new getDappActiveNetwork uses
jest.mock('./selectors', () => ({
  getOrderedConnectedAccountsForActiveTab: jest.fn(),
  getOriginOfCurrentTab: jest.fn(),
  getPermissions: jest.fn(),
  getAllDomains: jest.fn(),
}));

jest.mock('../../shared/lib/selectors/networks', () => ({
  getNetworkConfigurationsByChainId: jest.fn(),
}));

jest.mock('./multichain', () => ({
  getMultichainNetworkConfigurationsByChainId: jest.fn(),
}));

const mockGetOrderedConnectedAccountsForActiveTab = jest.mocked(
  getOrderedConnectedAccountsForActiveTab,
);
const mockGetOriginOfCurrentTab = jest.mocked(getOriginOfCurrentTab);
const mockGetPermissions = jest.mocked(getPermissions);
const mockGetAllDomains = jest.mocked(getAllDomains);
const mockGetNetworkConfigurationsByChainId = jest.mocked(
  getNetworkConfigurationsByChainId,
);
const mockGetMultichainNetworkConfigurationsByChainId = jest.mocked(
  getMultichainNetworkConfigurationsByChainId,
);

describe('getDappActiveNetwork selector', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockOrigin = 'MOCK_ORIGIN';
  const mockNetworkClientId = '111';
  const mockNetworkConfig: NetworkConfiguration = {
    chainId: '0x1',
    defaultRpcEndpointIndex: 0,
    rpcEndpoints: [
      {
        networkClientId: mockNetworkClientId,
        type: RpcEndpointType.Custom,
        url: '',
      },
    ],
    blockExplorerUrls: [],
    name: '',
    nativeCurrency: '',
  };

  const mockEvmAccount = {
    id: 'eip155:1:0x1234567890123456789012345678901234567890',
    address: '0x1234567890123456789012345678901234567890',
    type: 'eip155:eoa',
    metadata: {
      name: 'Test Account',
      lastSelected: Date.now(),
    },
    scopes: ['eip155:1'],
    methods: [],
    options: {},
  };

  const mockSolanaAccount = {
    id: 'solana:mainnet:0x1234567890123456789012345678901234567890',
    address: '0x1234567890123456789012345678901234567890',
    type: 'solana:data-account',
    metadata: {
      name: 'Test Solana Account',
      lastSelected: Date.now(),
    },
    scopes: ['solana:mainnet'],
    methods: [],
    options: {},
  };

  const mockMultichainNetworkConfig: NetworkConfiguration = {
    chainId: '0x1' as `0x${string}`,
    name: 'Solana Mainnet',
    nativeCurrency: 'SOL',
    blockExplorerUrls: [],
    defaultRpcEndpointIndex: 0,
    rpcEndpoints: [
      {
        networkClientId: 'solana-mainnet',
        type: RpcEndpointType.Custom,
        url: '',
      },
    ],
  };

  const arrangeMocks = () => {
    mockGetOrderedConnectedAccountsForActiveTab.mockReturnValue([
      mockEvmAccount as MockedValue,
    ]);
    mockGetOriginOfCurrentTab.mockReturnValue(mockOrigin);
    mockGetAllDomains.mockReturnValue({
      [mockOrigin]: mockNetworkClientId,
    });
    mockGetNetworkConfigurationsByChainId.mockReturnValue({
      '0x1': mockNetworkConfig,
    });
    mockGetMultichainNetworkConfigurationsByChainId.mockReturnValue({});

    return {
      mockOrigin,
      mockNetworkClientId,
      mockGetOrderedConnectedAccountsForActiveTab,
      mockGetOriginOfCurrentTab,
      mockGetAllDomains,
      mockGetNetworkConfigurationsByChainId,
      mockGetMultichainNetworkConfigurationsByChainId,
      mockState: {},
    };
  };

  it('returns correct EVM network configuration when all data is available', () => {
    const mocks = arrangeMocks();
    const result = getDappActiveNetwork(mocks.mockState);
    expect(result).toEqual({ ...mockNetworkConfig, isEvm: true });
  });

  it('returns correct non-EVM network configuration for Solana account', () => {
    const mocks = arrangeMocks();
    mocks.mockGetOrderedConnectedAccountsForActiveTab.mockReturnValue([
      mockSolanaAccount as MockedValue,
    ]);
    mocks.mockGetMultichainNetworkConfigurationsByChainId.mockReturnValue({
      'solana:mainnet': mockMultichainNetworkConfig,
    });

    const result = getDappActiveNetwork(mocks.mockState);
    expect(result).toEqual({ ...mockMultichainNetworkConfig, isEvm: false });
  });

  it('returns null when no connected accounts', () => {
    const mocks = arrangeMocks();
    mocks.mockGetOrderedConnectedAccountsForActiveTab.mockReturnValue([]);
    const result = getDappActiveNetwork(mocks.mockState);
    expect(result).toBeNull();
  });

  it('returns null when orderedConnectedAccounts is null', () => {
    const mocks = arrangeMocks();
    mocks.mockGetOrderedConnectedAccountsForActiveTab.mockReturnValue(
      null as MockedValue,
    );
    const result = getDappActiveNetwork(mocks.mockState);
    expect(result).toBeNull();
  });

  it('returns null when no matching EVM network configuration exists', () => {
    const mocks = arrangeMocks();
    mocks.mockGetNetworkConfigurationsByChainId.mockReturnValue({});
    const result = getDappActiveNetwork(mocks.mockState);
    expect(result).toBeNull();
  });

  it('returns null when no matching non-EVM network configuration exists', () => {
    const mocks = arrangeMocks();
    mocks.mockGetOrderedConnectedAccountsForActiveTab.mockReturnValue([
      mockSolanaAccount as MockedValue,
    ]);
    mocks.mockGetMultichainNetworkConfigurationsByChainId.mockReturnValue({});

    const result = getDappActiveNetwork(mocks.mockState);
    expect(result).toBeNull();
  });
});

describe('getIsEip1193CompatibleConnection', () => {
  const MOCK_ORIGIN = 'https://example-dapp.com';

  function makeCaip25Permission(
    scopes: Record<string, { accounts: string[] }>,
    sessionProperties?: Record<string, unknown>,
  ) {
    return {
      'endowment:caip25': {
        parentCapability: 'endowment:caip25',
        caveats: [
          {
            type: 'authorizedScopes',
            value: {
              requiredScopes: {},
              optionalScopes: scopes,
              isMultichainOrigin: false,
              ...(sessionProperties ? { sessionProperties } : {}),
            },
          },
        ],
      },
    };
  }

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetOriginOfCurrentTab.mockReturnValue(MOCK_ORIGIN);
  });

  it('returns true when sessionProperties contains eip1193-compatible: "true"', () => {
    const permissions = makeCaip25Permission(
      { 'eip155:1': { accounts: ['eip155:1:0xabc'] } },
      { 'eip1193-compatible': true },
    );
    mockGetPermissions.mockReturnValue(permissions as MockedValue);

    const result = getIsEip1193CompatibleConnection({} as MockedValue);
    expect(result).toBe(true);
  });

  it('returns false for EVM-only connections without eip1193-compatible session property', () => {
    const permissions = makeCaip25Permission({
      'eip155:1': { accounts: ['eip155:1:0xabc'] },
      'eip155:137': { accounts: ['eip155:137:0xabc'] },
    });
    mockGetPermissions.mockReturnValue(permissions as MockedValue);

    const result = getIsEip1193CompatibleConnection({} as MockedValue);
    expect(result).toBe(false);
  });

  it('returns false for mixed EVM + non-EVM connections without eip1193-compatible', () => {
    const permissions = makeCaip25Permission({
      'eip155:1': { accounts: ['eip155:1:0xabc'] },
      'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp': {
        accounts: ['solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp:7S3P4Hx'],
      },
    });
    mockGetPermissions.mockReturnValue(permissions as MockedValue);

    const result = getIsEip1193CompatibleConnection({} as MockedValue);
    expect(result).toBe(false);
  });

  it('returns false for Solana-only connections', () => {
    const permissions = makeCaip25Permission({
      'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp': {
        accounts: ['solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp:7S3P4Hx'],
      },
    });
    mockGetPermissions.mockReturnValue(permissions as MockedValue);

    const result = getIsEip1193CompatibleConnection({} as MockedValue);
    expect(result).toBe(false);
  });

  it('returns true for mixed scopes when eip1193-compatible session property is set', () => {
    const permissions = makeCaip25Permission(
      {
        'eip155:1': { accounts: ['eip155:1:0xabc'] },
        'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp': {
          accounts: ['solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp:7S3P4Hx'],
        },
      },
      { 'eip1193-compatible': true },
    );
    mockGetPermissions.mockReturnValue(permissions as MockedValue);

    const result = getIsEip1193CompatibleConnection({} as MockedValue);
    expect(result).toBe(true);
  });

  it('returns false when no permissions exist for the origin', () => {
    mockGetPermissions.mockReturnValue(undefined as MockedValue);

    const result = getIsEip1193CompatibleConnection({} as MockedValue);
    expect(result).toBe(false);
  });

  it('returns false when no active tab origin', () => {
    mockGetOriginOfCurrentTab.mockReturnValue('');

    const result = getIsEip1193CompatibleConnection({} as MockedValue);
    expect(result).toBe(false);
  });

  it('returns false when scopes are empty', () => {
    const permissions = makeCaip25Permission({});
    mockGetPermissions.mockReturnValue(permissions as MockedValue);

    const result = getIsEip1193CompatibleConnection({} as MockedValue);
    expect(result).toBe(false);
  });
});
