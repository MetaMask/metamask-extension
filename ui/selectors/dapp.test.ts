import { getAllDomains, getOriginOfCurrentTab } from './selectors';
import { getNetworkConfigurationsByChainId } from '../../shared/modules/selectors/networks';
import {
  NetworkConfiguration,
  RpcEndpointType,
} from '@metamask/network-controller';
import { getDappActiveNetwork } from './dapp';

jest.mock('./selectors', () => ({
  getOriginOfCurrentTab: jest.fn(),
  getAllDomains: jest.fn(),
}));

jest.mock('../../shared/modules/selectors/networks', () => ({
  getNetworkConfigurationsByChainId: jest.fn(),
}));

const mockGetOriginOfCurrentTab = jest.mocked(getOriginOfCurrentTab);
const mockGetAllDomains = jest.mocked(getAllDomains);
const mockGetNetworkConfigurationsByChainId = jest.mocked(
  getNetworkConfigurationsByChainId,
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

  const arrangeMocks = () => {
    mockGetOriginOfCurrentTab.mockReturnValue(mockOrigin);

    mockGetAllDomains.mockReturnValue({
      [mockOrigin]: mockNetworkClientId,
    });

    mockGetNetworkConfigurationsByChainId.mockReturnValue({
      '0x1': mockNetworkConfig,
    });

    return {
      mockOrigin,
      mockNetworkClientId,
      mockGetAllDomains,
      mockGetOriginOfCurrentTab,
      mockGetNetworkConfigurationsByChainId,
      mockState: {},
    };
  };

  it('returns correct network configuration when all data is available', () => {
    const mocks = arrangeMocks();
    const result = getDappActiveNetwork(mocks.mockState);
    expect(result).toEqual(mockNetworkConfig);
  });

  it('returns null when activeTabOrigin is null', () => {
    const mocks = arrangeMocks();
    mocks.mockGetOriginOfCurrentTab.mockReturnValue(null);
    const result = getDappActiveNetwork(mocks.mockState);
    expect(result).toBeNull();
  });

  it('returns null when allDomains is null', () => {
    const mocks = arrangeMocks();
    mocks.mockGetAllDomains.mockReturnValue(null);
    const result = getDappActiveNetwork(mocks.mockState);
    expect(result).toBeNull();
  });

  it('returns null when networkClientId not found for origin', () => {
    const mocks = arrangeMocks();
    mocks.mockGetAllDomains.mockReturnValue({});
    const result = getDappActiveNetwork(mocks.mockState);
    expect(result).toBeNull();
  });

  it('returns null when no matching network configuration exists', () => {
    const mocks = arrangeMocks();
    mocks.mockGetNetworkConfigurationsByChainId.mockReturnValue({});
    const result = getDappActiveNetwork(mocks.mockState);
    expect(result).toBeNull();
  });
});
