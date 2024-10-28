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

const createMockLineaMainnetConfiguration = () => ({
  chainId: CHAIN_IDS.LINEA_MAINNET,
  defaultRpcEndpointIndex: 0,
  rpcEndpoints: [
    {
      networkClientId: NETWORK_TYPES.LINEA_MAINNET,
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

  describe('with permittedChains permissioning inactive', () => {
    it('should call setActiveNetwork when switching to a built-in infura network', async () => {
      const mocks = makeMocks({
        overrides: {
          getNetworkConfigurationByChainId: jest
            .fn()
            .mockReturnValue(createMockMainnetConfiguration()),
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
      expect(mocks.setActiveNetwork).toHaveBeenCalledTimes(1);
      expect(mocks.setActiveNetwork).toHaveBeenCalledWith(
        createMockMainnetConfiguration().rpcEndpoints[0].networkClientId,
      );
    });

    it('should call setActiveNetwork when switching to a built-in infura network, when chainId from request is lower case', async () => {
      const mocks = makeMocks({
        overrides: {
          getNetworkConfigurationByChainId: jest
            .fn()
            .mockReturnValue(createMockLineaMainnetConfiguration()),
        },
      });
      const switchEthereumChainHandler = switchEthereumChain.implementation;
      await switchEthereumChainHandler(
        {
          origin: 'example.com',
          params: [{ chainId: CHAIN_IDS.LINEA_MAINNET.toLowerCase() }],
        },
        {},
        jest.fn(),
        jest.fn(),
        mocks,
      );
      expect(mocks.setActiveNetwork).toHaveBeenCalledTimes(1);
      expect(mocks.setActiveNetwork).toHaveBeenCalledWith(
        createMockLineaMainnetConfiguration().rpcEndpoints[0].networkClientId,
      );
    });

    it('should call setActiveNetwork when switching to a built-in infura network, when chainId from request is upper case', async () => {
      const mocks = makeMocks({
        overrides: {
          getNetworkConfigurationByChainId: jest
            .fn()
            .mockReturnValue(createMockLineaMainnetConfiguration()),
        },
      });
      const switchEthereumChainHandler = switchEthereumChain.implementation;
      await switchEthereumChainHandler(
        {
          origin: 'example.com',
          params: [{ chainId: CHAIN_IDS.LINEA_MAINNET.toUpperCase() }],
        },
        {},
        jest.fn(),
        jest.fn(),
        mocks,
      );
      expect(mocks.setActiveNetwork).toHaveBeenCalledTimes(1);
      expect(mocks.setActiveNetwork).toHaveBeenCalledWith(
        createMockLineaMainnetConfiguration().rpcEndpoints[0].networkClientId,
      );
    });

    it('should call setActiveNetwork when switching to a custom network', async () => {
      const mocks = makeMocks({
        overrides: {
          getCurrentChainIdForDomain: jest
            .fn()
            .mockReturnValue(CHAIN_IDS.MAINNET),
        },
      });
      const switchEthereumChainHandler = switchEthereumChain.implementation;
      await switchEthereumChainHandler(
        {
          origin: 'example.com',
          params: [{ chainId: NON_INFURA_CHAIN_ID }],
        },
        {},
        jest.fn(),
        jest.fn(),
        mocks,
      );
      expect(mocks.setActiveNetwork).toHaveBeenCalledTimes(1);
      expect(mocks.setActiveNetwork).toHaveBeenCalledWith(
        createMockMainnetConfiguration().rpcEndpoints[0].networkClientId,
      );
    });

    it('should handle missing networkConfiguration', async () => {
      // Mock a network configuration that has an undefined or missing rpcEndpoints
      const mockNetworkConfiguration = undefined;

      const mocks = makeMocks({
        overrides: {
          getNetworkConfigurationByChainId: jest
            .fn()
            .mockReturnValue(mockNetworkConfiguration),
        },
      });

      const switchEthereumChainHandler = switchEthereumChain.implementation;

      const mockEnd = jest.fn();
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

      // Check that the function handled the missing rpcEndpoints and did not attempt to call setActiveNetwork
      expect(mockEnd).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 4902,
          message: expect.stringContaining('Unrecognized chain ID'),
        }),
      );
      expect(mocks.setActiveNetwork).not.toHaveBeenCalled();
    });
  });

  describe('with permittedChains permissioning active', () => {
    it('should call requestPermittedChainsPermission and setActiveNetwork when chainId is not in `endowment:permitted-chains`', async () => {
      const mockrequestPermittedChainsPermission = jest
        .fn()
        .mockResolvedValue();
      const mocks = makeMocks({
        overrides: {
          requestPermittedChainsPermission:
            mockrequestPermittedChainsPermission,
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
          requestPermittedChainsPermission:
            mockrequestPermittedChainsPermission,
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
});
