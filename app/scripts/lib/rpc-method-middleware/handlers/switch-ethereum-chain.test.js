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
  describe('with chainPermitted permissioning inactive', () => {
    const getChainPermissionsFeatureFlag = () => false;
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
          getChainPermissionsFeatureFlag,
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
          getChainPermissionsFeatureFlag,
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
          getChainPermissionsFeatureFlag,
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
          getChainPermissionsFeatureFlag,
        },
      );
      expect(mockSetActiveNetwork).toHaveBeenCalledTimes(1);
      expect(mockSetActiveNetwork).toHaveBeenCalledWith(
        MOCK_MAINNET_CONFIGURATION.id,
      );
    });
  });

  describe('with chainPermitted permissioning active', () => {
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

    describe('when chainId is not in permittedChains', () => {
      it('should call requestSwitchNetworkPermission and setActiveNetwork', async () => {
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
    });

    describe('when requested chainId is in permittedChains', () => {
      it('should call setActiveNetwork without calling requestSwitchNetworkPermission', async () => {
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
  });
});
