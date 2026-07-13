import type {
  AddNetworkFields,
  NetworkConfiguration,
  UpdateNetworkFields,
} from '@metamask/network-controller';
import type { Hex, PendingJsonRpcResponse } from '@metamask/utils';
import { rpcErrors } from '@metamask/rpc-errors';
import {
  CHAIN_IDS,
  FEATURED_RPCS,
} from '../../../../../shared/constants/network';
import {
  addEthereumChainHandler,
  type AddEthereumChainHooks,
  type AddEthereumChainRequest,
} from './add-ethereum-chain';
import * as EthChainUtils from './ethereum-chain-utils';

jest.mock('./ethereum-chain-utils', () => ({
  ...jest.requireActual('./ethereum-chain-utils'),
  validateAddEthereumChainParams: jest.fn(),
  switchChain: jest.fn(),
}));

const MockEthChainUtils = jest.mocked(EthChainUtils);

const NON_INFURA_CHAIN_ID = '0x123456789';

const createMockMainnetConfiguration = (): NetworkConfiguration =>
  ({
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
  }) as NetworkConfiguration;

const createMockOptimismConfiguration = (): NetworkConfiguration =>
  ({
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
  }) as NetworkConfiguration;

const createMockNonInfuraConfiguration = (): AddNetworkFields =>
  ({
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
  }) as AddNetworkFields;

const createMockedHandler = () => {
  const next = jest.fn();
  const end = jest.fn();
  const mocks: AddEthereumChainHooks = {
    getCurrentChainIdForDomain: jest.fn().mockReturnValue(NON_INFURA_CHAIN_ID),
    getNetworkConfigurationByChainId: jest.fn(),
    setActiveNetwork: jest.fn(),
    requestUserApproval: jest.fn().mockResolvedValue('approval-id'),
    getCaveat: jest.fn(),
    addNetwork: jest.fn().mockResolvedValue({
      defaultRpcEndpointIndex: 0,
      rpcEndpoints: [{ networkClientId: 'network-client-id' }],
    } as NetworkConfiguration),
    updateNetwork: jest.fn().mockResolvedValue({
      defaultRpcEndpointIndex: 0,
      rpcEndpoints: [{ networkClientId: 'network-client-id' }],
    } as NetworkConfiguration),
    requestPermittedChainsPermissionIncrementalForOrigin: jest.fn(),
    rejectApprovalRequestsForOrigin: jest.fn(),
    setTokenNetworkFilter: jest.fn(),
    setEnabledNetworks: jest.fn(),
    getEnabledNetworks: jest.fn().mockReturnValue({}),
  };
  const response = {} as PendingJsonRpcResponse<null>;
  const handler = (request: AddEthereumChainRequest) =>
    addEthereumChainHandler.implementation(request, response, next, end, mocks);

  return {
    mocks,
    response,
    next,
    end,
    handler,
  };
};

describe('addEthereumChainHandler', () => {
  beforeEach(() => {
    MockEthChainUtils.validateAddEthereumChainParams.mockImplementation(
      (params: unknown) => {
        const {
          chainId,
          chainName,
          blockExplorerUrls,
          rpcUrls,
          nativeCurrency,
        } = params as NonNullable<AddEthereumChainRequest['params']>[0];
        return {
          chainId: chainId as Hex,
          chainName,
          firstValidBlockExplorerUrl: blockExplorerUrls?.[0] ?? null,
          firstValidRPCUrl: rpcUrls[0],
          ticker: nativeCurrency?.symbol ?? 'ETH',
        };
      },
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should validate the request params', async () => {
    const { handler } = createMockedHandler();

    const request = {
      origin: 'example.com',
      params: [
        {
          foo: true,
        },
      ],
    } as unknown as AddEthereumChainRequest;

    await handler(request);

    expect(MockEthChainUtils.validateAddEthereumChainParams).toHaveBeenCalledWith(
      request.params?.[0],
    );
  });

  it('should return an error if request params validation fails', async () => {
    const { end, handler } = createMockedHandler();
    MockEthChainUtils.validateAddEthereumChainParams.mockImplementation(() => {
      throw new Error('failed to validate params');
    });

    await handler({
      origin: 'example.com',
      params: [{}],
    } as unknown as AddEthereumChainRequest);

    expect(end).toHaveBeenCalledWith(new Error('failed to validate params'));
  });

  it('should deduplicate the featured endpoint if the URL `firstValidRPCUrl` send from client is the same as the one in FEATURED_RPCS', async () => {
    const rpcUrl = FEATURED_RPCS.find(
      (network: (typeof FEATURED_RPCS)[number]) =>
        network.chainId === CHAIN_IDS.LINEA_MAINNET,
    )?.rpcEndpoints[0].url;
    const { handler, mocks } = createMockedHandler();

    const request: AddEthereumChainRequest = {
      origin: 'example.com',
      params: [
        {
          chainId: CHAIN_IDS.LINEA_MAINNET,
          chainName: 'Linea',
          rpcUrls: [rpcUrl as string],
          nativeCurrency: {
            symbol: 'ETH',
            decimals: 18,
          },
          blockExplorerUrls: ['https://etherscan.io'],
        },
      ],
    };

    await handler(request);

    expect(mocks.addNetwork).toHaveBeenCalledWith({
      blockExplorerUrls: ['https://etherscan.io'],
      defaultBlockExplorerUrlIndex: 0,
      chainId: CHAIN_IDS.LINEA_MAINNET,
      defaultRpcEndpointIndex: 0,
      name: 'Linea',
      nativeCurrency: 'ETH',
      rpcEndpoints: [
        {
          url: rpcUrl,
          name: 'Linea',
          type: 'custom',
        },
      ],
    });
  });

  it('creates a new network configuration for the given chainid and switches to it if no networkConfigurations with the same chainId exist', async () => {
    const nonInfuraConfiguration = createMockNonInfuraConfiguration();

    const { mocks, end, handler } = createMockedHandler();
    mocks.getCurrentChainIdForDomain = jest.fn().mockReturnValue(CHAIN_IDS.MAINNET);

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
    expect(MockEthChainUtils.switchChain).toHaveBeenCalledTimes(1);
    expect(MockEthChainUtils.switchChain).toHaveBeenCalledWith(
      {},
      end,
      NON_INFURA_CHAIN_ID,
      'network-client-id',
      {
        autoApprove: true,
        getCaveat: mocks.getCaveat,
        getEnabledNetworks: mocks.getEnabledNetworks,
        isAddFlow: true,
        origin: 'example.com',
        setActiveNetwork: mocks.setActiveNetwork,
        requestPermittedChainsPermissionIncrementalForOrigin:
          mocks.requestPermittedChainsPermissionIncrementalForOrigin,
        rejectApprovalRequestsForOrigin: mocks.rejectApprovalRequestsForOrigin,
        setTokenNetworkFilter: mocks.setTokenNetworkFilter,
        setEnabledNetworks: mocks.setEnabledNetworks,
      },
    );
  });

  describe('if a networkConfiguration for the given chainId already exists', () => {
    describe('if the proposed networkConfiguration has a different rpcUrl from the one already in state', () => {
      it('updates the network with a new networkConfiguration', async () => {
        const { mocks, end, handler } = createMockedHandler();
        mocks.getCurrentChainIdForDomain = jest.fn().mockReturnValue(CHAIN_IDS.SEPOLIA);
        mocks.getNetworkConfigurationByChainId = jest
          .fn()
          .mockReturnValue(createMockMainnetConfiguration());

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

        expect(mocks.updateNetwork).toHaveBeenCalledWith(
          '0x1',
          {
            blockExplorerUrls: ['https://etherscan.io'],
            chainId: '0x1',
            defaultBlockExplorerUrlIndex: 0,
            defaultRpcEndpointIndex: 0,
            name: 'Ethereum Mainnet',
            nativeCurrency: 'ETH',
            rpcEndpoints: [
              {
                networkClientId: 'mainnet',
                type: 'infura',
                url: 'https://mainnet.infura.io/v3/',
              },
              {
                name: 'Ethereum Mainnet',
                type: 'custom',
                url: 'https://eth.llamarpc.com',
              },
            ],
          } as UpdateNetworkFields,
          undefined,
        );
        expect(MockEthChainUtils.switchChain).toHaveBeenCalledTimes(1);
        expect(MockEthChainUtils.switchChain).toHaveBeenCalledWith(
          {},
          end,
          '0x1',
          'mainnet',
          {
            autoApprove: true,
            getCaveat: mocks.getCaveat,
            getEnabledNetworks: mocks.getEnabledNetworks,
            isAddFlow: true,
            origin: 'example.com',
            setActiveNetwork: mocks.setActiveNetwork,
            requestPermittedChainsPermissionIncrementalForOrigin:
              mocks.requestPermittedChainsPermissionIncrementalForOrigin,
            rejectApprovalRequestsForOrigin:
              mocks.rejectApprovalRequestsForOrigin,
            setTokenNetworkFilter: mocks.setTokenNetworkFilter,
            setEnabledNetworks: mocks.setEnabledNetworks,
          },
        );
      });
    });

    describe('if the proposed networkConfiguration does not have a different rpcUrl from the one already in state', () => {
      it('should only switch to the existing networkConfiguration if one already exists for the given chain id without auto approving the chain permission', async () => {
        const { mocks, end, handler } = createMockedHandler();
        mocks.getCurrentChainIdForDomain = jest.fn().mockReturnValue(CHAIN_IDS.MAINNET);
        mocks.getNetworkConfigurationByChainId = jest
          .fn()
          .mockReturnValue(createMockOptimismConfiguration());
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

        expect(mocks.addNetwork).not.toHaveBeenCalled();
        expect(mocks.updateNetwork).not.toHaveBeenCalled();
        expect(MockEthChainUtils.switchChain).toHaveBeenCalledTimes(1);
        expect(MockEthChainUtils.switchChain).toHaveBeenCalledWith(
          {},
          end,
          '0xa',
          createMockOptimismConfiguration().rpcEndpoints[0].networkClientId,
          {
            autoApprove: false,
            getCaveat: mocks.getCaveat,
            getEnabledNetworks: mocks.getEnabledNetworks,
            isAddFlow: true,
            origin: 'example.com',
            setActiveNetwork: mocks.setActiveNetwork,
            requestPermittedChainsPermissionIncrementalForOrigin:
              mocks.requestPermittedChainsPermissionIncrementalForOrigin,
            rejectApprovalRequestsForOrigin:
              mocks.rejectApprovalRequestsForOrigin,
            setTokenNetworkFilter: mocks.setTokenNetworkFilter,
            setEnabledNetworks: mocks.setEnabledNetworks,
          },
        );
      });
    });
  });

  it('should return an error if nativeCurrency.symbol does not match an existing network with the same chainId', async () => {
    const { mocks, end, handler } = createMockedHandler();
    mocks.getNetworkConfigurationByChainId = jest
      .fn()
      .mockReturnValue(createMockMainnetConfiguration());
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
});
