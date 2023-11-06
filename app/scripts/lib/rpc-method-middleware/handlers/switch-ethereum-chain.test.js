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
  id: 123,
  chainId: CHAIN_IDS.LINEA_MAINNET,
  type: NETWORK_TYPES.LINEA_MAINNET,
};

describe('switchEthereumChainHandler', () => {
  it('should call setProviderType when switching to a built in infura network', async () => {
    const mockSetProviderType = jest.fn();
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
        getCurrentChainId: () => NON_INFURA_CHAIN_ID,
        findNetworkClientIdByChainId: () => 123,
        setNetworkClientIdForDomain: jest.fn(),
        getProviderConfig: () => ({ chainId: NON_INFURA_CHAIN_ID }),
        findNetworkConfigurationBy: () => MOCK_MAINNET_CONFIGURATION,
        setProviderType: mockSetProviderType,
        setActiveNetwork: mockSetActiveNetwork,
        requestUserApproval: mockRequestUserApproval,
      },
    );
    expect(mockSetProviderType).toHaveBeenCalledTimes(1);
    expect(mockSetProviderType).toHaveBeenCalledWith(
      MOCK_MAINNET_CONFIGURATION.type,
    );
  });

  it('should call setProviderType when switching to a built in infura network, when chainId from request is lower case', async () => {
    const mockSetProviderType = jest.fn();
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
        getCurrentChainId: () => NON_INFURA_CHAIN_ID,
        getProviderConfig: () => ({ chainId: NON_INFURA_CHAIN_ID }),
        setNetworkClientIdForDomain: jest.fn(),
        findNetworkClientIdByChainId: () => 123,
        findNetworkConfigurationBy: () => MOCK_LINEA_MAINNET_CONFIGURATION,
        setProviderType: mockSetProviderType,
        setActiveNetwork: mockSetActiveNetwork,
        requestUserApproval: mockRequestUserApproval,
      },
    );
    expect(mockSetProviderType).toHaveBeenCalledTimes(1);
    expect(mockSetProviderType).toHaveBeenCalledWith(
      MOCK_LINEA_MAINNET_CONFIGURATION.type,
    );
  });

  it('should call setProviderType when switching to a built in infura network, when chainId from request is upper case', async () => {
    const mockSetProviderType = jest.fn();
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
        getCurrentChainId: () => NON_INFURA_CHAIN_ID,
        findNetworkClientIdByChainId: () => 123,
        setNetworkClientIdForDomain: jest.fn(),
        getProviderConfig: () => ({ chainId: NON_INFURA_CHAIN_ID }),
        findNetworkConfigurationBy: () => MOCK_LINEA_MAINNET_CONFIGURATION,
        setProviderType: mockSetProviderType,
        setActiveNetwork: mockSetActiveNetwork,
        requestUserApproval: mockRequestUserApproval,
      },
    );
    expect(mockSetProviderType).toHaveBeenCalledTimes(1);
    expect(mockSetProviderType).toHaveBeenCalledWith(
      MOCK_LINEA_MAINNET_CONFIGURATION.type,
    );
  });

  it('should call setActiveNetwork when switching to a custom network', async () => {
    const mockSetProviderType = jest.fn();
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
        getCurrentChainId: () => CHAIN_IDS.MAINNET,
        findNetworkClientIdByChainId: () => 123,
        setNetworkClientIdForDomain: jest.fn(),
        getProviderConfig: () => ({ chainId: CHAIN_IDS.MAINNET }),
        findNetworkConfigurationBy: () => MOCK_MAINNET_CONFIGURATION,
        setProviderType: mockSetProviderType,
        setActiveNetwork: mockSetActiveNetwork,
        requestUserApproval: mockRequestUserApproval,
      },
    );
    expect(mockSetActiveNetwork).toHaveBeenCalledTimes(1);
    expect(mockSetActiveNetwork).toHaveBeenCalledWith(
      MOCK_MAINNET_CONFIGURATION.id,
    );
  });
});
