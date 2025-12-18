import {
  NetworkConfiguration,
  RpcEndpointType,
} from '@metamask/network-controller';
import { getNetworkConfigurationsByChainId } from '../../shared/modules/selectors/networks';
import { getDappActiveNetwork } from './dapp';
import {
  getOrderedConnectedAccountsForActiveTab,
  getOriginOfCurrentTab,
  getAllDomains,
} from './selectors';
import { getMultichainNetworkConfigurationsByChainId } from './multichain';

// Mock the selectors that the new getDappActiveNetwork uses
jest.mock('./selectors', () => ({
  getOrderedConnectedAccountsForActiveTab: jest.fn(),
  getOriginOfCurrentTab: jest.fn(),
  getAllDomains: jest.fn(),
}));

jest.mock('../../shared/modules/selectors/networks', () => ({
  getNetworkConfigurationsByChainId: jest.fn(),
}));

jest.mock('./multichain', () => ({
  getMultichainNetworkConfigurationsByChainId: jest.fn(),
}));

const mockGetOrderedConnectedAccountsForActiveTab = jest.mocked(
  getOrderedConnectedAccountsForActiveTab,
);
const mockGetOriginOfCurrentTab = jest.mocked(getOriginOfCurrentTab);
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
      mockEvmAccount,
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
      mockSolanaAccount,
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
    mocks.mockGetOrderedConnectedAccountsForActiveTab.mockReturnValue(null);
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
      mockSolanaAccount,
    ]);
    mocks.mockGetMultichainNetworkConfigurationsByChainId.mockReturnValue({});

    const result = getDappActiveNetwork(mocks.mockState);
    expect(result).toBeNull();
  });
});
