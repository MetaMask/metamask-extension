import {
  CHAIN_IDS,
  NETWORK_TYPES,
} from '../../../../../shared/constants/network';
import switchEthereumChain from './switch-ethereum-chain';

const NON_INFURA_CHAIN_ID = '0x123456789';

const mockRequestUserApproval = ({ requestData }) => {
  return Promise.resolve(requestData.toNetworkConfiguration);
};

const MOCK_MAINNET_CONFIGURATION = {
  id: 123,
  chainId: CHAIN_IDS.MAINNET,
  type: NETWORK_TYPES.MAINNET,
};
const MOCK_LINEA_MAINNET_CONFIGURATION = {
  id: 1234,
  chainId: CHAIN_IDS.LINEA_MAINNET,
  type: NETWORK_TYPES.LINEA_MAINNET,
};

describe('switchEthereumChainHandler', () => {
  const makeMocks = ({
    permissionedChainIds = [],
    permissionsFeatureFlagIsActive = false,
    overrides = {},
    mockedFindNetworkConfigurationByReturnValue = MOCK_MAINNET_CONFIGURATION,
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
      requestSwitchNetworkPermission: jest.fn(),
      getCaveat: mockGetCaveat,
      ...overrides,
    };
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('with chainPermitted permissioning inactive', () => {
    const permissionsFeatureFlagIsActive = false;

    it('should call setActiveNetwork when switching to a built-in infura network', async () => {
      const mocks = makeMocks({
        permissionsFeatureFlagIsActive,
        overrides: {
          findNetworkConfigurationBy: jest
            .fn()
            .mockReturnValue(MOCK_MAINNET_CONFIGURATION),
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
        MOCK_MAINNET_CONFIGURATION.type,
      );
    });

    it('should call setActiveNetwork when switching to a built-in infura network, when chainId from request is lower case', async () => {
      const mocks = makeMocks({
        permissionsFeatureFlagIsActive,
        overrides: {
          findNetworkConfigurationBy: jest
            .fn()
            .mockReturnValue(MOCK_LINEA_MAINNET_CONFIGURATION),
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
        MOCK_LINEA_MAINNET_CONFIGURATION.type,
      );
    });

    it('should call setActiveNetwork when switching to a built-in infura network, when chainId from request is upper case', async () => {
      const mocks = makeMocks({
        permissionsFeatureFlagIsActive,
        overrides: {
          findNetworkConfigurationBy: jest
            .fn()
            .mockReturnValue(MOCK_LINEA_MAINNET_CONFIGURATION),
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
        MOCK_LINEA_MAINNET_CONFIGURATION.type,
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
        MOCK_MAINNET_CONFIGURATION.id,
      );
    });
  });

  describe('with chainPermitted permissioning active', () => {
    const permissionsFeatureFlagIsActive = true;

    it('should call requestSwitchNetworkPermission and setActiveNetwork when chainId is not in permittedChains', async () => {
      const mockRequestSwitchNetworkPermission = jest.fn().mockResolvedValue();
      const mocks = makeMocks({
        permissionsFeatureFlagIsActive,
        overrides: {
          requestSwitchNetworkPermission: mockRequestSwitchNetworkPermission,
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

      expect(mocks.requestSwitchNetworkPermission).toHaveBeenCalledTimes(1);
      expect(mocks.requestSwitchNetworkPermission).toHaveBeenCalledWith([
        CHAIN_IDS.MAINNET,
      ]);
      expect(mocks.setActiveNetwork).toHaveBeenCalledTimes(1);
      expect(mocks.setActiveNetwork).toHaveBeenCalledWith(
        MOCK_MAINNET_CONFIGURATION.type,
      );
    });

    it('should call setActiveNetwork without calling requestSwitchNetworkPermission when requested chainId is in permittedChains', async () => {
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

      expect(mocks.requestSwitchNetworkPermission).not.toHaveBeenCalled();
      expect(mocks.setActiveNetwork).toHaveBeenCalledTimes(1);
      expect(mocks.setActiveNetwork).toHaveBeenCalledWith(
        MOCK_MAINNET_CONFIGURATION.type,
      );
    });

    it('should handle errors during the switch network permission request', async () => {
      const mockError = new Error('Permission request failed');
      const mockRequestSwitchNetworkPermission = jest
        .fn()
        .mockRejectedValue(mockError);
      const mocks = makeMocks({
        permissionsFeatureFlagIsActive,
        overrides: {
          requestSwitchNetworkPermission: mockRequestSwitchNetworkPermission,
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

      expect(mocks.requestSwitchNetworkPermission).toHaveBeenCalledTimes(1);
      expect(mockEnd).toHaveBeenCalledWith(mockError);
      expect(mocks.setActiveNetwork).not.toHaveBeenCalled();
    });
  });
});
