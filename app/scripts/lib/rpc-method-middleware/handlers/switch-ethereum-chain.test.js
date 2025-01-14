import {
  CHAIN_IDS,
  NETWORK_TYPES,
} from '../../../../../shared/constants/network';
import switchEthereumChain from './switch-ethereum-chain';

const NON_INFURA_CHAIN_ID = '0x123456789';

const createMockMainnetConfiguration = () => ({
  chainId: CHAIN_IDS.MAINNET,
  defaultRpcEndpointIndex: 0,
  rpcEndpoints: [
    {
      networkClientId: NETWORK_TYPES.MAINNET,
    },
  ],
});

describe('switchEthereumChainHandler', () => {
  const makeMocks = ({
    permissionedChainIds = [],
    overrides = {},
    mockedGetNetworkConfigurationByChainIdReturnValue = createMockMainnetConfiguration(),
    mockedGetCurrentChainIdForDomainReturnValue = NON_INFURA_CHAIN_ID,
  } = {}) => {
    const mockGetCaveat = jest.fn();
    mockGetCaveat.mockReturnValue({ value: permissionedChainIds });

    return {
      getCurrentChainIdForDomain: jest
        .fn()
        .mockReturnValue(mockedGetCurrentChainIdForDomainReturnValue),
      setNetworkClientIdForDomain: jest.fn(),
      setActiveNetwork: jest.fn(),
      requestPermittedChainsPermission: jest.fn(),
      getCaveat: mockGetCaveat,
      getNetworkConfigurationByChainId: jest
        .fn()
        .mockReturnValue(mockedGetNetworkConfigurationByChainIdReturnValue),
      ...overrides,
    };
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should call requestPermittedChainsPermission and setActiveNetwork when chainId is not in `endowment:permitted-chains`', async () => {
    const mockrequestPermittedChainsPermission = jest.fn().mockResolvedValue();
    const mocks = makeMocks({
      overrides: {
        requestPermittedChainsPermission: mockrequestPermittedChainsPermission,
      },
    });
    const switchEthereumChainHandler = switchEthereumChain.implementation;
    await switchEthereumChainHandler(
      {
        origin: 'example.com',
        params: [{ chainId: CHAIN_IDS.MAINNET }],
      },
      {},
      jest.fn(),
      jest.fn(),
      mocks,
    );

    expect(mocks.requestPermittedChainsPermission).toHaveBeenCalledTimes(1);
    expect(mocks.requestPermittedChainsPermission).toHaveBeenCalledWith([
      CHAIN_IDS.MAINNET,
    ]);
    expect(mocks.setActiveNetwork).toHaveBeenCalledTimes(1);
    expect(mocks.setActiveNetwork).toHaveBeenCalledWith(
      createMockMainnetConfiguration().rpcEndpoints[0].networkClientId,
    );
  });

  it('should call setActiveNetwork without calling requestPermittedChainsPermission when requested chainId is in `endowment:permitted-chains`', async () => {
    const mocks = makeMocks({
      permissionedChainIds: [CHAIN_IDS.MAINNET],
    });
    const switchEthereumChainHandler = switchEthereumChain.implementation;
    await switchEthereumChainHandler(
      {
        origin: 'example.com',
        params: [{ chainId: CHAIN_IDS.MAINNET }],
      },
      {},
      jest.fn(),
      jest.fn(),
      mocks,
    );

    expect(mocks.requestPermittedChainsPermission).not.toHaveBeenCalled();
    expect(mocks.setActiveNetwork).toHaveBeenCalledTimes(1);
    expect(mocks.setActiveNetwork).toHaveBeenCalledWith(
      createMockMainnetConfiguration().rpcEndpoints[0].networkClientId,
    );
  });

  it('should handle errors during the switch network permission request', async () => {
    const mockError = new Error('Permission request failed');
    const mockrequestPermittedChainsPermission = jest
      .fn()
      .mockRejectedValue(mockError);
    const mocks = makeMocks({
      overrides: {
        requestPermittedChainsPermission: mockrequestPermittedChainsPermission,
      },
    });
    const mockEnd = jest.fn();
    const switchEthereumChainHandler = switchEthereumChain.implementation;

    await switchEthereumChainHandler(
      {
        origin: 'example.com',
        params: [{ chainId: CHAIN_IDS.MAINNET }],
      },
      {},
      jest.fn(),
      mockEnd,
      mocks,
    );

    expect(mocks.requestPermittedChainsPermission).toHaveBeenCalledTimes(1);
    expect(mockEnd).toHaveBeenCalledWith(mockError);
    expect(mocks.setActiveNetwork).not.toHaveBeenCalled();
  });
});
