import {
  CHAIN_IDS,
  NETWORK_TYPES,
} from '../../../../../shared/constants/network';
import switchEthereumChain from './switch-ethereum-chain';

const NON_INFURA_CHAIN_ID = '0x123456789';

const mockRequestUserApproval = ({ requestData }) => {
  return Promise.resolve(requestData.toNetworkConfiguration);
};

const createMockMainnetConfiguration = () => ({
  id: 123,
  chainId: CHAIN_IDS.MAINNET,
  type: NETWORK_TYPES.MAINNET,
});

const createMockLineaMainnetConfiguration = () => ({
  id: 1234,
  chainId: CHAIN_IDS.LINEA_MAINNET,
  type: NETWORK_TYPES.LINEA_MAINNET,
});

describe('switchEthereumChainHandler', () => {
  const makeMocks = ({
    permissionedChainIds = [],
    permissionsFeatureFlagIsActive = false,
    overrides = {},
    mockedFindNetworkConfigurationByReturnValue = createMockMainnetConfiguration(),
    mockedGetCurrentChainIdForDomainReturnValue = NON_INFURA_CHAIN_ID,
  } = {}) => {
    const mockGetCaveat = jest.fn();
    mockGetCaveat.mockReturnValue({ value: permissionedChainIds });

    return {
      getChainPermissionsFeatureFlag: () => permissionsFeatureFlagIsActive,
      getCurrentChainIdForDomain: jest
        .fn()
        .mockReturnValue(mockedGetCurrentChainIdForDomainReturnValue),
      setNetworkClientIdForDomain: jest.fn(),
      findNetworkConfigurationBy: jest
        .fn()
        .mockReturnValue(mockedFindNetworkConfigurationByReturnValue),
      setActiveNetwork: jest.fn(),
      requestUserApproval: jest
        .fn()
        .mockImplementation(mockRequestUserApproval),
      requestPermittedChainsPermission: jest.fn(),
      getCaveat: mockGetCaveat,
      ...overrides,
    };
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('with permittedChains permissioning inactive', () => {
    const permissionsFeatureFlagIsActive = false;

    it('should call setActiveNetwork when switching to a built-in infura network', async () => {
      const mocks = makeMocks({
        permissionsFeatureFlagIsActive,
        overrides: {
          findNetworkConfigurationBy: jest
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
        createMockMainnetConfiguration().type,
      );
    });

    it('should call setActiveNetwork when switching to a built-in infura network, when chainId from request is lower case', async () => {
      const mocks = makeMocks({
        permissionsFeatureFlagIsActive,
        overrides: {
          findNetworkConfigurationBy: jest
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
        createMockLineaMainnetConfiguration().type,
      );
    });

    it('should call setActiveNetwork when switching to a built-in infura network, when chainId from request is upper case', async () => {
      const mocks = makeMocks({
        permissionsFeatureFlagIsActive,
        overrides: {
          findNetworkConfigurationBy: jest
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
        createMockLineaMainnetConfiguration().type,
      );
    });

    it('should call setActiveNetwork when switching to a custom network', async () => {
      const mocks = makeMocks({
        permissionsFeatureFlagIsActive,
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
        createMockMainnetConfiguration().id,
      );
    });
  });

  describe('with permittedChains permissioning active', () => {
    const permissionsFeatureFlagIsActive = true;

    it('should call requestPermittedChainsPermission and setActiveNetwork when chainId is not in `endowment:permitted-chains`', async () => {
      const mockrequestPermittedChainsPermission = jest
        .fn()
        .mockResolvedValue();
      const mocks = makeMocks({
        permissionsFeatureFlagIsActive,
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
        createMockMainnetConfiguration().type,
      );
    });

    it('should call setActiveNetwork without calling requestPermittedChainsPermission when requested chainId is in `endowment:permitted-chains`', async () => {
      const mocks = makeMocks({
        permissionsFeatureFlagIsActive,
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
        createMockMainnetConfiguration().type,
      );
    });

    it('should handle errors during the switch network permission request', async () => {
      const mockError = new Error('Permission request failed');
      const mockrequestPermittedChainsPermission = jest
        .fn()
        .mockRejectedValue(mockError);
      const mocks = makeMocks({
        permissionsFeatureFlagIsActive,
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
