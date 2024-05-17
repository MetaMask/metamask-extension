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

const MOCK_NON_INFURA_CONFIGURATION = {
  id: 12345,
  chainId: NON_INFURA_CHAIN_ID,
  type: NETWORK_TYPES.CUSTOM,
};

describe('switchEthereumChainHandler', () => {
  it('should call setActiveNetwork when switching to a built in infura network', async () => {
    const mockSetActiveNetwork = jest.fn();
    const switchEthereumChainHandler = switchEthereumChain.implementation;
    await switchEthereumChainHandler(
      {
        origin: 'example.com',
        params: [{ chainId: CHAIN_IDS.MAINNET }],
      },
      {},
      jest.fn(),
      jest.fn(),
      {
        getChainPermissionsFeatureFlag: () => false,
        getCurrentChainIdForDomain: () => NON_INFURA_CHAIN_ID,
        setNetworkClientIdForDomain: jest.fn(),
        findNetworkConfigurationBy: () => MOCK_MAINNET_CONFIGURATION,
        setActiveNetwork: mockSetActiveNetwork,
        requestUserApproval: mockRequestUserApproval,
      },
    );
    expect(mockSetActiveNetwork).toHaveBeenCalledTimes(1);
    expect(mockSetActiveNetwork).toHaveBeenCalledWith(
      MOCK_MAINNET_CONFIGURATION.type,
    );
  });

  it('should call setActiveNetwork when switching to a built in infura network, when chainId from request is lower case', async () => {
    const mockSetActiveNetwork = jest.fn();
    const switchEthereumChainHandler = switchEthereumChain.implementation;
    await switchEthereumChainHandler(
      {
        origin: 'example.com',
        params: [{ chainId: CHAIN_IDS.LINEA_MAINNET.toLowerCase() }],
      },
      {},
      jest.fn(),
      jest.fn(),
      {
        setNetworkClientIdForDomain: jest.fn(),
        findNetworkConfigurationBy: () => MOCK_LINEA_MAINNET_CONFIGURATION,
        setActiveNetwork: mockSetActiveNetwork,
        requestUserApproval: mockRequestUserApproval,
        getCurrentChainIdForDomain: () => NON_INFURA_CHAIN_ID,
        getChainPermissionsFeatureFlag: () => false,
      },
    );
    expect(mockSetActiveNetwork).toHaveBeenCalledTimes(1);
    expect(mockSetActiveNetwork).toHaveBeenCalledWith(
      MOCK_LINEA_MAINNET_CONFIGURATION.type,
    );
  });

  it('should call setActiveNetwork when switching to a built in infura network, when chainId from request is upper case', async () => {
    const mockSetActiveNetwork = jest.fn();
    const switchEthereumChainHandler = switchEthereumChain.implementation;
    await switchEthereumChainHandler(
      {
        origin: 'example.com',
        params: [{ chainId: CHAIN_IDS.LINEA_MAINNET.toUpperCase() }],
      },
      {},
      jest.fn(),
      jest.fn(),
      {
        getCurrentChainIdForDomain: () => NON_INFURA_CHAIN_ID,
        setNetworkClientIdForDomain: jest.fn(),
        findNetworkConfigurationBy: () => MOCK_LINEA_MAINNET_CONFIGURATION,
        setActiveNetwork: mockSetActiveNetwork,
        requestUserApproval: mockRequestUserApproval,
        getChainPermissionsFeatureFlag: () => false,
      },
    );
    expect(mockSetActiveNetwork).toHaveBeenCalledTimes(1);
    expect(mockSetActiveNetwork).toHaveBeenCalledWith(
      MOCK_LINEA_MAINNET_CONFIGURATION.type,
    );
  });

  it('should call setActiveNetwork when switching to a custom network', async () => {
    const mockSetActiveNetwork = jest.fn();
    const switchEthereumChainHandler = switchEthereumChain.implementation;
    await switchEthereumChainHandler(
      {
        origin: 'example.com',
        params: [{ chainId: NON_INFURA_CHAIN_ID }],
      },
      {},
      jest.fn(),
      jest.fn(),
      {
        getCurrentChainIdForDomain: () => CHAIN_IDS.MAINNET,
        setNetworkClientIdForDomain: jest.fn(),
        findNetworkConfigurationBy: () => MOCK_MAINNET_CONFIGURATION,
        setActiveNetwork: mockSetActiveNetwork,
        requestUserApproval: mockRequestUserApproval,
        getChainPermissionsFeatureFlag: () => false,
      },
    );
    expect(mockSetActiveNetwork).toHaveBeenCalledTimes(1);
    expect(mockSetActiveNetwork).toHaveBeenCalledWith(
      MOCK_MAINNET_CONFIGURATION.id,
    );
  });

  describe('switchEthereumChainHandler with chainPermitted permissions active', () => {
    const mockRequestSwitchNetworkPermission = jest.fn();
    const mockSetActiveNetwork = jest.fn();
    const mockGetCaveat = jest.fn();

    const setupMocks = ({
      permissionedChainIds,
      mockedFindNetworkConfigurationByReturnValue = MOCK_MAINNET_CONFIGURATION,
      mockedGetCurrentChainIdForDomainReturnValue = NON_INFURA_CHAIN_ID,
    }) => {
      mockGetCaveat.mockReturnValue({ value: permissionedChainIds });

      return {
        getChainPermissionsFeatureFlag: () => true,
        getCurrentChainIdForDomain: () =>
          mockedGetCurrentChainIdForDomainReturnValue,
        setNetworkClientIdForDomain: jest.fn(),
        findNetworkConfigurationBy: () =>
          mockedFindNetworkConfigurationByReturnValue,
        setActiveNetwork: mockSetActiveNetwork,
        requestUserApproval: mockRequestUserApproval,
        requestSwitchNetworkPermission: mockRequestSwitchNetworkPermission,
        getCaveat: mockGetCaveat,
      };
    };

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should request switch network permission and call setActiveNetwork when permissions are enabled and chainId is not in permittedChains', async () => {
      mockRequestSwitchNetworkPermission.mockResolvedValue();

      const switchEthereumChainHandler = switchEthereumChain.implementation;
      await switchEthereumChainHandler(
        {
          origin: 'example.com',
          params: [{ chainId: CHAIN_IDS.MAINNET }],
        },
        {},
        jest.fn(),
        jest.fn(),
        setupMocks({ permissionedChainIds: [] }),
      );

      expect(mockRequestSwitchNetworkPermission).toHaveBeenCalledTimes(1);
      expect(mockRequestSwitchNetworkPermission).toHaveBeenCalledWith([
        CHAIN_IDS.MAINNET,
      ]);
      expect(mockSetActiveNetwork).toHaveBeenCalledTimes(1);
      expect(mockSetActiveNetwork).toHaveBeenCalledWith(
        MOCK_MAINNET_CONFIGURATION.type,
      );
    });

    it('should call setActiveNetwork directly when permissions are enabled and requested chainId is already in permittedChains', async () => {
      const switchEthereumChainHandler = switchEthereumChain.implementation;
      await switchEthereumChainHandler(
        {
          origin: 'example.com',
          params: [{ chainId: CHAIN_IDS.MAINNET }],
        },
        {},
        jest.fn(),
        jest.fn(),
        setupMocks({ permissionedChainIds: [CHAIN_IDS.MAINNET] }),
      );

      expect(mockRequestSwitchNetworkPermission).not.toHaveBeenCalled();
      expect(mockSetActiveNetwork).toHaveBeenCalledTimes(1);
      expect(mockSetActiveNetwork).toHaveBeenCalledWith(
        MOCK_MAINNET_CONFIGURATION.type,
      );
    });

    it('should handle errors during the switch network permission request', async () => {
      const mockError = new Error('Permission request failed');
      mockRequestSwitchNetworkPermission.mockRejectedValue(mockError);

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
        setupMocks([]),
      );

      expect(mockRequestSwitchNetworkPermission).toHaveBeenCalledTimes(1);
      expect(mockEnd).toHaveBeenCalledWith(mockError);
      expect(mockSetActiveNetwork).not.toHaveBeenCalled();
    });

    it('should call setActiveNetwork when switching to a custom network with permissions enabled', async () => {
      const switchEthereumChainHandler = switchEthereumChain.implementation;
      await switchEthereumChainHandler(
        {
          origin: 'example.com',
          params: [{ chainId: NON_INFURA_CHAIN_ID }],
        },
        {},
        jest.fn(),
        jest.fn(),
        setupMocks({
          permissionedChainIds: [],
          mockedGetCurrentChainIdForDomainReturnValue: CHAIN_IDS.MAINNET,
          mockedFindNetworkConfigurationByReturnValue:
            MOCK_NON_INFURA_CONFIGURATION,
        }),
      );

      expect(mockRequestSwitchNetworkPermission).toHaveBeenCalledTimes(1);
      expect(mockRequestSwitchNetworkPermission).toHaveBeenCalledWith([
        NON_INFURA_CHAIN_ID,
      ]);
      expect(mockSetActiveNetwork).toHaveBeenCalledTimes(1);
      expect(mockSetActiveNetwork).toHaveBeenCalledWith(
        MOCK_NON_INFURA_CONFIGURATION.id,
      );
    });
  });
});
