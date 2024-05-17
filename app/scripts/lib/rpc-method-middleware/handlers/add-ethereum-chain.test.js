import { ethErrors } from 'eth-rpc-errors';
import {
  CHAIN_IDS,
  NETWORK_TYPES,
} from '../../../../../shared/constants/network';
import addEthereumChain from './add-ethereum-chain';

const NON_INFURA_CHAIN_ID = '0x123456789';

const mockRequestUserApproval = ({ requestData }) => {
  return Promise.resolve(requestData.toNetworkConfiguration);
};

const MOCK_MAINNET_CONFIGURATION = {
  id: 123,
  chainId: CHAIN_IDS.MAINNET,
  rpcUrl: 'https://mainnet.infura.io/v3/',
  type: NETWORK_TYPES.MAINNET,
  ticker: 'ETH',
};

const MOCK_OPTIMISM_CONFIGURATION = {
  id: 456,
  chainId: CHAIN_IDS.OPTIMISM,
  rpcUrl: 'https://optimism.llamarpc.com',
  type: NETWORK_TYPES.CUSTOM,
  ticker: 'ETH',
};

const MOCK_NON_INFURA_CONFIGURATION = {
  id: 12345,
  chainId: NON_INFURA_CHAIN_ID,
  type: NETWORK_TYPES.CUSTOM,
};

describe('addEthereumChainHandler', () => {
  describe('without chain permissions', () => {
    describe('if a networkConfiguration for the given chainId does not already exist', () => {
      it('should call requestApproval, mockUpsertNetworkConfiguration with the requested chain, and setActiveNetwork', async () => {
        const mockSetActiveNetwork = jest.fn();
        const mockedRequestUserApproval = jest.fn();
        const mockUpsertNetworkConfiguration = jest.fn().mockResolvedValue(123);
        const addEthereumChainHandler = addEthereumChain.implementation;

        await addEthereumChainHandler(
          {
            origin: 'example.com',
            params: [
              {
                chainId: CHAIN_IDS.OPTIMISM,
                chainName: 'Optimism Mainnet',
                rpcUrls: ['https://optimism.llamarpc.com'],
                nativeCurrency: {
                  symbol: 'ETH',
                  decimals: 18,
                },
                blockExplorerUrls: ['https://optimistic.etherscan.io'],
              },
            ],
          },
          {},
          jest.fn(),
          jest.fn(),
          {
            getChainPermissionsFeatureFlag: () => false,
            getCurrentChainIdForDomain: () => NON_INFURA_CHAIN_ID,
            findNetworkConfigurationBy: () => null,
            setActiveNetwork: mockSetActiveNetwork,
            requestUserApproval: mockedRequestUserApproval,
            upsertNetworkConfiguration: mockUpsertNetworkConfiguration,
            startApprovalFlow: () => ({ id: 'approvalFlowId' }),
            endApprovalFlow: jest.fn(),
          },
        );

        // called twice, once for the add and once for the switch
        expect(mockedRequestUserApproval).toHaveBeenCalledTimes(2);
        expect(mockUpsertNetworkConfiguration).toHaveBeenCalledTimes(1);
        expect(mockUpsertNetworkConfiguration).toHaveBeenCalledWith(
          {
            chainId: CHAIN_IDS.OPTIMISM,
            nickname: 'Optimism Mainnet',
            rpcUrl: 'https://optimism.llamarpc.com',
            ticker: 'ETH',
            rpcPrefs: {
              blockExplorerUrl: 'https://optimistic.etherscan.io',
            },
          },
          { referrer: 'example.com', source: 'dapp' },
        );
        expect(mockSetActiveNetwork).toHaveBeenCalledTimes(1);
        expect(mockSetActiveNetwork).toHaveBeenCalledWith(123);
      });
    });

    describe('if a networkConfiguration for the given chainId already exists', () => {
      it('should add networkConfiguration if requested addition has a different rpcUrl', async () => {
        const mockSetActiveNetwork = jest.fn();
        const mockUpsertNetworkConfiguration = jest
          .fn()
          .mockResolvedValue(123456);
        const addEthereumChainHandler = addEthereumChain.implementation;

        await addEthereumChainHandler(
          {
            origin: 'example.com',
            params: [
              {
                chainId: CHAIN_IDS.MAINNET,
                chainName: 'Ethereum Mainnet',
                rpcUrls: ['https://eth.llamarpc.com'],
                nativeCurrency: {
                  symbol: 'ETH',
                  decimals: 18,
                },
                blockExplorerUrls: ['https://etherscan.io'],
              },
            ],
          },
          {},
          jest.fn(),
          jest.fn(),
          {
            getChainPermissionsFeatureFlag: () => false,
            getCurrentChainIdForDomain: () => NON_INFURA_CHAIN_ID,
            getCurrentRpcUrl: () => 'https://optimism.llamarpc.com',
            findNetworkConfigurationBy: () => MOCK_MAINNET_CONFIGURATION,
            setActiveNetwork: mockSetActiveNetwork,
            upsertNetworkConfiguration: mockUpsertNetworkConfiguration,
            requestUserApproval: mockRequestUserApproval,
            startApprovalFlow: () => ({ id: 'approvalFlowId' }),
            endApprovalFlow: jest.fn(),
          },
        );

        expect(mockUpsertNetworkConfiguration).toHaveBeenCalledTimes(1);
        expect(mockSetActiveNetwork).toHaveBeenCalledWith(123456);
      });
      describe('if requested addition has the same rpcUrl as the existing networkConfiguration', () => {
        describe('if currentRpcUrl doesnt match the requested rpcUrl', () => {
          it('should call setActiveNetwork with the matched existing networkConfiguration id', async () => {
            const mockSetActiveNetwork = jest.fn();
            const mockedRequestUserApproval = jest.fn();
            const addEthereumChainHandler = addEthereumChain.implementation;

            await addEthereumChainHandler(
              {
                origin: 'example.com',
                params: [
                  {
                    chainId: MOCK_OPTIMISM_CONFIGURATION.chainId,
                    chainName: 'Optimism',
                    rpcUrls: [MOCK_OPTIMISM_CONFIGURATION.rpcUrl],
                    nativeCurrency: {
                      symbol: 'ETH',
                      decimals: 18,
                    },
                    blockExplorerUrls: ['https://optimism.etherscan.io'],
                  },
                ],
              },
              {},
              jest.fn(),
              jest.fn(),
              {
                getChainPermissionsFeatureFlag: () => false,
                getCurrentChainIdForDomain: () => NON_INFURA_CHAIN_ID,
                getCurrentRpcUrl: () => 'https://mainnet.infura.io/v3/',
                findNetworkConfigurationBy: () => MOCK_OPTIMISM_CONFIGURATION,
                setActiveNetwork: mockSetActiveNetwork,
                requestUserApproval: mockRequestUserApproval,
                startApprovalFlow: () => ({ id: 'approvalFlowId' }),
                endApprovalFlow: jest.fn(),
              },
            );

            expect(mockedRequestUserApproval).toHaveBeenCalledTimes(0);
            expect(mockSetActiveNetwork).toHaveBeenCalledTimes(1);
            expect(mockSetActiveNetwork).toHaveBeenCalledWith(
              MOCK_OPTIMISM_CONFIGURATION.id,
            );
          });
        });
      });

      it('should return error for invalid chainId', async () => {
        const mockEnd = jest.fn();
        const addEthereumChainHandler = addEthereumChain.implementation;

        await addEthereumChainHandler(
          {
            origin: 'example.com',
            params: [{ chainId: 'invalid_chain_id' }],
          },
          {},
          jest.fn(),
          mockEnd,
          {
            getChainPermissionsFeatureFlag: () => false,
            getCurrentChainIdForDomain: jest.fn(),
            setNetworkClientIdForDomain: jest.fn(),
            findNetworkConfigurationBy: jest.fn(),
            setActiveNetwork: jest.fn(),
            requestUserApproval: jest.fn(),
          },
        );

        expect(mockEnd).toHaveBeenCalledWith(
          ethErrors.rpc.invalidParams({
            message: `Expected 0x-prefixed, unpadded, non-zero hexadecimal string 'chainId'. Received:\ninvalid_chain_id`,
          }),
        );
      });
    });
  });

  describe('with chain permissions', () => {
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
        upsertNetworkConfiguration: jest.fn().mockResolvedValue(123),
        startApprovalFlow: () => ({ id: 'approvalFlowId' }),
        endApprovalFlow: jest.fn(),
      };
    };

    afterEach(() => {
      jest.clearAllMocks();
    });

    describe('if a networkConfiguration for the given chainId does not already exist', () => {
      it('should add a new Ethereum chain, request switch network permission, and call setActiveNetwork', async () => {
        mockRequestSwitchNetworkPermission.mockResolvedValue();

        const addEthereumChainHandler = addEthereumChain.implementation;
        await addEthereumChainHandler(
          {
            origin: 'example.com',
            params: [
              {
                chainId: CHAIN_IDS.MAINNET,
                chainName: 'Ethereum Mainnet',
                rpcUrls: ['https://mainnet.infura.io/v3/'],
                nativeCurrency: {
                  symbol: 'ETH',
                  decimals: 18,
                },
                blockExplorerUrls: ['https://etherscan.io'],
              },
            ],
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
        expect(mockSetActiveNetwork).toHaveBeenCalledWith(123);
      });
    });

    describe('if a networkConfiguration for the given chainId already exists', () => {
      it('should call setActiveNetwork directly when permissions are enabled and requested chainId is already in permittedChains', async () => {
        const addEthereumChainHandler = addEthereumChain.implementation;
        await addEthereumChainHandler(
          {
            origin: 'example.com',
            params: [
              {
                chainId: CHAIN_IDS.MAINNET,
                chainName: 'Ethereum Mainnet',
                rpcUrls: ['https://mainnet.infura.io/v3/'],
                nativeCurrency: {
                  symbol: 'ETH',
                  decimals: 18,
                },
                blockExplorerUrls: ['https://etherscan.io'],
              },
            ],
          },
          {},
          jest.fn(),
          jest.fn(),
          setupMocks({ permissionedChainIds: [CHAIN_IDS.MAINNET] }),
        );

        expect(mockRequestSwitchNetworkPermission).not.toHaveBeenCalled();
        expect(mockSetActiveNetwork).toHaveBeenCalledTimes(1);
        expect(mockSetActiveNetwork).toHaveBeenCalledWith(123);
      });

      it('should handle errors during the switch network permission request', async () => {
        const mockError = new Error('Permission request failed');
        mockRequestSwitchNetworkPermission.mockRejectedValue(mockError);

        const addEthereumChainHandler = addEthereumChain.implementation;
        const mockEnd = jest.fn();

        await addEthereumChainHandler(
          {
            origin: 'example.com',
            params: [
              {
                chainId: CHAIN_IDS.MAINNET,
                chainName: 'Ethereum Mainnet',
                rpcUrls: ['https://mainnet.infura.io/v3/'],
                nativeCurrency: {
                  symbol: 'ETH',
                  decimals: 18,
                },
                blockExplorerUrls: ['https://etherscan.io'],
              },
            ],
          },
          {},
          jest.fn(),
          mockEnd,
          setupMocks({ permissionedChainIds: [] }),
        );

        expect(mockRequestSwitchNetworkPermission).toHaveBeenCalledTimes(1);
        expect(mockEnd).toHaveBeenCalledWith(mockError);
        expect(mockSetActiveNetwork).not.toHaveBeenCalled();
      });

      it('should call setActiveNetwork when switching to a custom network with permissions enabled', async () => {
        const addEthereumChainHandler = addEthereumChain.implementation;
        await addEthereumChainHandler(
          {
            origin: 'example.com',
            params: [
              {
                chainId: NON_INFURA_CHAIN_ID,
                chainName: 'Custom Network',
                rpcUrls: ['https://custom.network'],
                nativeCurrency: {
                  symbol: 'CUST',
                  decimals: 18,
                },
                blockExplorerUrls: ['https://custom.blockexplorer'],
              },
            ],
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

    it('should return error if nativeCurrency.symbol does not match existing network', async () => {
      const mockEnd = jest.fn();
      const addEthereumChainHandler = addEthereumChain.implementation;

      await addEthereumChainHandler(
        {
          origin: 'example.com',
          params: [
            {
              chainId: CHAIN_IDS.MAINNET,
              chainName: 'Ethereum Mainnet',
              rpcUrls: ['https://mainnet.infura.io/v3/'],
              nativeCurrency: {
                symbol: 'WRONG',
                decimals: 18,
              },
              blockExplorerUrls: ['https://etherscan.io'],
            },
          ],
        },
        {},
        jest.fn(),
        mockEnd,
        setupMocks({
          permissionedChainIds: [CHAIN_IDS.MAINNET],
          mockedFindNetworkConfigurationByReturnValue: {
            ...MOCK_MAINNET_CONFIGURATION,
            ticker: 'ETH',
          },
        }),
      );

      expect(mockEnd).toHaveBeenCalledWith(
        ethErrors.rpc.invalidParams({
          message: `nativeCurrency.symbol does not match currency symbol for a network the user already has added with the same chainId. Received:\nWRONG`,
        }),
      );
    });
  });
});
