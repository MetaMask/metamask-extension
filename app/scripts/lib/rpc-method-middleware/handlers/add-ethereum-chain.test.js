import { rpcErrors } from '@metamask/rpc-errors';
import { CHAIN_IDS } from '../../../../../shared/constants/network';
import addEthereumChain from './add-ethereum-chain';
import EthChainUtils from './ethereum-chain-utils';

jest.mock('./ethereum-chain-utils', () => ({
  ...jest.requireActual('./ethereum-chain-utils'),
  switchChain: jest.fn(),
}));

const NON_INFURA_CHAIN_ID = '0x123456789';

const createMockMainnetConfiguration = () => ({
  chainId: CHAIN_IDS.MAINNET,
  name: 'Ethereum Mainnet',
  defaultRpcEndpointIndex: 0,
  rpcEndpoints: [
    {
      networkClientId: 'mainnet',
      url: 'https://mainnet.infura.io/v3/',
      type: 'infura',
    },
  ],
  nativeCurrency: 'ETH',
  blockExplorerUrls: ['https://etherscan.io'],
  defaultBlockExplorerUrlIndex: 0,
});

const createMockOptimismConfiguration = () => ({
  chainId: CHAIN_IDS.OPTIMISM,
  name: 'Optimism',
  defaultRpcEndpointIndex: 0,
  rpcEndpoints: [
    {
      networkClientId: 'optimism-network-client-id',
      url: 'https://optimism.llamarpc.com',
      type: 'custom',
    },
  ],
  nativeCurrency: 'ETH',
  blockExplorerUrls: ['https://optimistic.etherscan.io'],
  defaultBlockExplorerUrlIndex: 0,
});

const createMockNonInfuraConfiguration = () => ({
  chainId: NON_INFURA_CHAIN_ID,
  name: 'Custom Network',
  defaultRpcEndpointIndex: 0,
  rpcEndpoints: [
    {
      name: 'Custom Network',
      url: 'https://custom.network',
      type: 'custom',
    },
  ],
  nativeCurrency: 'CUST',
  blockExplorerUrls: ['https://custom.blockexplorer'],
  defaultBlockExplorerUrlIndex: 0,
});

const createMockedHandler = () => {
  const next = jest.fn();
  const end = jest.fn();
  const mocks = {
    getCurrentChainIdForDomain: jest.fn().mockReturnValue(NON_INFURA_CHAIN_ID),
    setNetworkClientIdForDomain: jest.fn(),
    getNetworkConfigurationByChainId: jest.fn(),
    setActiveNetwork: jest.fn(),
    requestUserApproval: jest.fn().mockResolvedValue(123),
    requestPermissionApprovalForOrigin: jest.fn(),
    getCaveat: jest.fn(),
    startApprovalFlow: () => ({ id: 'approvalFlowId' }),
    endApprovalFlow: jest.fn(),
    addNetwork: jest.fn().mockResolvedValue({
      defaultRpcEndpointIndex: 0,
      rpcEndpoints: [{ networkClientId: 123 }],
    }),
    updateNetwork: jest.fn().mockResolvedValue({
      defaultRpcEndpointIndex: 0,
      rpcEndpoints: [{ networkClientId: 123 }],
    }),
    updateCaveat: jest.fn(),
    grantPermissions: jest.fn(),
  };
  const response = {};
  const handler = (request) =>
    addEthereumChain.implementation(request, response, next, end, mocks);

  return {
    mocks,
    response,
    next,
    end,
    handler,
  };
};

describe('addEthereumChainHandler', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('creates a new network configuration for the given chainid and switches to it if no networkConfigurations with the same chainId exist', async () => {
    const nonInfuraConfiguration = createMockNonInfuraConfiguration();

    const { mocks, end, handler } = createMockedHandler();
    mocks.getCurrentChainIdForDomain.mockReturnValue(CHAIN_IDS.MAINNET);

    await handler({
      origin: 'example.com',
      params: [
        {
          chainId: nonInfuraConfiguration.chainId,
          chainName: nonInfuraConfiguration.name,
          rpcUrls: nonInfuraConfiguration.rpcEndpoints.map((rpc) => rpc.url),
          nativeCurrency: {
            symbol: nonInfuraConfiguration.nativeCurrency,
            decimals: 18,
          },
          blockExplorerUrls: nonInfuraConfiguration.blockExplorerUrls,
        },
      ],
    });

    expect(mocks.addNetwork).toHaveBeenCalledWith(nonInfuraConfiguration);
    expect(EthChainUtils.switchChain).toHaveBeenCalledTimes(1);
    expect(EthChainUtils.switchChain).toHaveBeenCalledWith(
      {},
      end,
      'example.com',
      NON_INFURA_CHAIN_ID,
      123,
      'approvalFlowId',
      {
        isAddFlow: true,
        endApprovalFlow: mocks.endApprovalFlow,
        getCaveat: mocks.getCaveat,
        requestPermissionApprovalForOrigin:
          mocks.requestPermissionApprovalForOrigin,
        setActiveNetwork: mocks.setActiveNetwork,
        updateCaveat: mocks.updateCaveat,
        grantPermissions: mocks.grantPermissions,
      },
    );
  });

  describe('if a networkConfiguration for the given chainId already exists', () => {
    describe('if the proposed networkConfiguration has a different rpcUrl from the one already in state', () => {
      it('create a new networkConfiguration and switches to it', async () => {
        const { mocks, end, handler } = createMockedHandler();
        mocks.getCurrentChainIdForDomain.mockReturnValue(CHAIN_IDS.SEPOLIA);

        await handler({
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
        });

        expect(EthChainUtils.switchChain).toHaveBeenCalledTimes(1);
        expect(EthChainUtils.switchChain).toHaveBeenCalledWith(
          {},
          end,
          'example.com',
          '0x1',
          123,
          'approvalFlowId',
          {
            isAddFlow: true,
            endApprovalFlow: mocks.endApprovalFlow,
            getCaveat: mocks.getCaveat,
            requestPermissionApprovalForOrigin:
              mocks.requestPermissionApprovalForOrigin,
            setActiveNetwork: mocks.setActiveNetwork,
            updateCaveat: mocks.updateCaveat,
            grantPermissions: mocks.grantPermissions,
          },
        );
      });
    });

    it('should switch to the existing networkConfiguration if one already exists for the given chain id', async () => {
      const { mocks, end, handler } = createMockedHandler();
      mocks.getCurrentChainIdForDomain.mockReturnValue(CHAIN_IDS.MAINNET);
      mocks.getNetworkConfigurationByChainId.mockReturnValue(
        createMockOptimismConfiguration(),
      );
      await handler({
        origin: 'example.com',
        params: [
          {
            chainId: createMockOptimismConfiguration().chainId,
            chainName: createMockOptimismConfiguration().name,
            rpcUrls: createMockOptimismConfiguration().rpcEndpoints.map(
              (rpc) => rpc.url,
            ),
            nativeCurrency: {
              symbol: createMockOptimismConfiguration().nativeCurrency,
              decimals: 18,
            },
            blockExplorerUrls:
              createMockOptimismConfiguration().blockExplorerUrls,
          },
        ],
      });

      expect(EthChainUtils.switchChain).toHaveBeenCalledTimes(1);
      expect(EthChainUtils.switchChain).toHaveBeenCalledWith(
        {},
        end,
        'example.com',
        '0xa',
        createMockOptimismConfiguration().rpcEndpoints[0].networkClientId,
        undefined,
        {
          isAddFlow: true,
          endApprovalFlow: mocks.endApprovalFlow,
          getCaveat: mocks.getCaveat,
          requestPermissionApprovalForOrigin:
            mocks.requestPermissionApprovalForOrigin,
          setActiveNetwork: mocks.setActiveNetwork,
          updateCaveat: mocks.updateCaveat,
          grantPermissions: mocks.grantPermissions,
        },
      );
    });
  });

  it('should return an error if an unexpected parameter is provided', async () => {
    const { end, handler } = createMockedHandler();

    const unexpectedParam = 'unexpected';

    await handler({
      origin: 'example.com',
      params: [
        {
          chainId: createMockNonInfuraConfiguration().chainId,
          chainName: createMockNonInfuraConfiguration().nickname,
          rpcUrls: [createMockNonInfuraConfiguration().rpcUrl],
          nativeCurrency: {
            symbol: createMockNonInfuraConfiguration().ticker,
            decimals: 18,
          },
          blockExplorerUrls: [
            createMockNonInfuraConfiguration().blockExplorerUrls[0],
          ],
          [unexpectedParam]: 'parameter',
        },
      ],
    });

    expect(end).toHaveBeenCalledWith(
      rpcErrors.invalidParams({
        message: `Received unexpected keys on object parameter. Unsupported keys:\n${unexpectedParam}`,
      }),
    );
  });

  it('should return an error if nativeCurrency.symbol does not match an existing network with the same chainId', async () => {
    const { mocks, end, handler } = createMockedHandler();
    mocks.getNetworkConfigurationByChainId.mockReturnValue(
      createMockMainnetConfiguration(),
    );
    await handler({
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
    });

    expect(end).toHaveBeenCalledWith(
      rpcErrors.invalidParams({
        message: `nativeCurrency.symbol does not match currency symbol for a network the user already has added with the same chainId. Received:\nWRONG`,
      }),
    );
  });

  it('should add result set to null to response object if the requested rpcUrl (and chainId) is currently selected', async () => {
    const CURRENT_RPC_CONFIG = createMockNonInfuraConfiguration();

    const { mocks, response, handler } = createMockedHandler();
    mocks.getCurrentChainIdForDomain.mockReturnValue(
      CURRENT_RPC_CONFIG.chainId,
    );
    mocks.getNetworkConfigurationByChainId.mockReturnValue(CURRENT_RPC_CONFIG);
    await handler({
      origin: 'example.com',
      params: [
        {
          chainId: CURRENT_RPC_CONFIG.chainId,
          chainName: 'Custom Network',
          rpcUrls: [CURRENT_RPC_CONFIG.rpcEndpoints[0].url],
          nativeCurrency: {
            symbol: CURRENT_RPC_CONFIG.nativeCurrency,
            decimals: 18,
          },
          blockExplorerUrls: ['https://custom.blockexplorer'],
        },
      ],
    });
    expect(response.result).toBeNull();
  });
});
