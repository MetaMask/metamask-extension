import type { NetworkConfiguration } from '@metamask/network-controller';
import type { Hex, PendingJsonRpcResponse } from '@metamask/utils';
import { providerErrors } from '@metamask/rpc-errors';
import {
  CHAIN_IDS,
  NETWORK_TYPES,
} from '../../../../../shared/constants/network';
import {
  switchEthereumChainHandler,
  type SwitchEthereumChainHooks,
  type SwitchEthereumChainRequest,
} from './switch-ethereum-chain';
import * as EthChainUtils from './ethereum-chain-utils';

jest.mock('./ethereum-chain-utils', () => ({
  ...jest.requireActual('./ethereum-chain-utils'),
  validateSwitchEthereumChainParams: jest.fn(),
  switchChain: jest.fn(),
}));

const MockEthChainUtils = jest.mocked(EthChainUtils);

const NON_INFURA_CHAIN_ID = '0x123456789';

const createMockMainnetConfiguration = (): NetworkConfiguration =>
  ({
    chainId: CHAIN_IDS.MAINNET,
    defaultRpcEndpointIndex: 0,
    rpcEndpoints: [
      {
        networkClientId: NETWORK_TYPES.MAINNET,
      },
    ],
  }) as unknown as NetworkConfiguration;

const createMockLineaMainnetConfiguration = (): NetworkConfiguration =>
  ({
    chainId: CHAIN_IDS.LINEA_MAINNET,
    defaultRpcEndpointIndex: 0,
    rpcEndpoints: [
      {
        networkClientId: NETWORK_TYPES.LINEA_MAINNET,
      },
    ],
  }) as unknown as NetworkConfiguration;

const createMockedHandler = () => {
  const next = jest.fn();
  const end = jest.fn();
  const mocks: SwitchEthereumChainHooks = {
    hasApprovalRequestsForOrigin: jest.fn().mockReturnValue(false),
    getNetworkConfigurationByChainId: jest
      .fn()
      .mockReturnValue(createMockMainnetConfiguration()),
    setActiveNetwork: jest.fn(),
    getCaveat: jest.fn(),
    getCurrentChainIdForDomain: jest.fn().mockReturnValue(NON_INFURA_CHAIN_ID),
    requestPermittedChainsPermissionIncrementalForOrigin: jest.fn(),
    rejectApprovalRequestsForOrigin: jest.fn(),
    setTokenNetworkFilter: jest.fn(),
    setEnabledNetworks: jest.fn(),
    getEnabledNetworks: jest.fn().mockReturnValue({}),
    requestUserApproval: jest.fn(),
  };
  const response = {} as PendingJsonRpcResponse<null>;
  const handler = (request: SwitchEthereumChainRequest) =>
    switchEthereumChainHandler.implementation(
      request,
      response,
      next,
      end,
      mocks,
    );

  return {
    mocks,
    response,
    next,
    end,
    handler,
  };
};

describe('switchEthereumChainHandler', () => {
  beforeEach(() => {
    MockEthChainUtils.validateSwitchEthereumChainParams.mockImplementation(
      (request) => {
        const firstParam = request.params?.[0] as { chainId?: string } | undefined;
        return (firstParam?.chainId ?? CHAIN_IDS.MAINNET) as Hex;
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
    } as unknown as SwitchEthereumChainRequest;

    await handler(request);

    expect(
      MockEthChainUtils.validateSwitchEthereumChainParams,
    ).toHaveBeenCalledWith(request);
  });

  it('should return an error if request params validation fails', async () => {
    const { end, handler } = createMockedHandler();
    MockEthChainUtils.validateSwitchEthereumChainParams.mockImplementation(() => {
      throw new Error('failed to validate params');
    });

    await handler({
      origin: 'example.com',
      params: [{}],
    } as unknown as SwitchEthereumChainRequest);

    expect(end).toHaveBeenCalledWith(new Error('failed to validate params'));
  });

  it('returns null and does not try to switch the network if the current chain id for the domain matches the chainId in the params', async () => {
    const { end, response, handler } = createMockedHandler();
    await handler({
      origin: 'example.com',
      params: [
        {
          chainId: NON_INFURA_CHAIN_ID,
        },
      ],
    });

    expect(response.result).toStrictEqual(null);
    expect(end).toHaveBeenCalled();
    expect(MockEthChainUtils.switchChain).not.toHaveBeenCalled();
  });

  it('throws an error and does not try to switch the network if unable to find a network matching the chainId in the params', async () => {
    const { mocks, end, handler } = createMockedHandler();
    mocks.getCurrentChainIdForDomain = jest.fn().mockReturnValue('0x1');
    mocks.getNetworkConfigurationByChainId = jest.fn().mockReturnValue(undefined);

    await handler({
      origin: 'example.com',
      params: [
        {
          chainId: NON_INFURA_CHAIN_ID,
        },
      ],
    });

    expect(end).toHaveBeenCalledWith(
      providerErrors.custom({
        code: 4902,
        message: `Unrecognized chain ID "${NON_INFURA_CHAIN_ID}". Try adding the chain using wallet_addEthereumChain first.`,
      }),
    );
    expect(MockEthChainUtils.switchChain).not.toHaveBeenCalled();
  });

  it('tries to switch the network', async () => {
    const { mocks, end, handler } = createMockedHandler();
    mocks.getNetworkConfigurationByChainId = jest
      .fn()
      .mockReturnValueOnce(createMockMainnetConfiguration())
      .mockReturnValueOnce(createMockLineaMainnetConfiguration());
    await handler({
      origin: 'example.com',
      params: [
        {
          chainId: '0xdeadbeef',
        },
      ],
    });

    expect(MockEthChainUtils.switchChain).toHaveBeenCalledWith(
      {},
      end,
      '0xdeadbeef',
      'mainnet',
      {
        autoApprove: false,
        setActiveNetwork: mocks.setActiveNetwork,
        fromNetworkConfiguration: {
          chainId: '0xe708',
          defaultRpcEndpointIndex: 0,
          rpcEndpoints: [
            {
              networkClientId: 'linea-mainnet',
            },
          ],
        },
        getCaveat: mocks.getCaveat,
        getEnabledNetworks: mocks.getEnabledNetworks,
        hasApprovalRequestsForOrigin: mocks.hasApprovalRequestsForOrigin,
        isSwitchFlow: true,
        origin: 'example.com',
        rejectApprovalRequestsForOrigin: mocks.rejectApprovalRequestsForOrigin,
        requestPermittedChainsPermissionIncrementalForOrigin:
          mocks.requestPermittedChainsPermissionIncrementalForOrigin,
        requestUserApproval: mocks.requestUserApproval,
        setEnabledNetworks: mocks.setEnabledNetworks,
        setTokenNetworkFilter: mocks.setTokenNetworkFilter,
        toNetworkConfiguration: {
          chainId: '0x1',
          defaultRpcEndpointIndex: 0,
          rpcEndpoints: [
            {
              networkClientId: 'mainnet',
            },
          ],
        },
      },
    );
  });

  it('calls `switchChain` with `autoApprove: true` if the origin is a Snap', async () => {
    const { mocks } = createMockedHandler();

    const switchEthereumChainImplementation =
      switchEthereumChainHandler.implementation;
    await switchEthereumChainImplementation(
      {
        origin: 'npm:foo-snap',
        params: [{ chainId: CHAIN_IDS.MAINNET }],
      },
      {} as PendingJsonRpcResponse<null>,
      jest.fn(),
      jest.fn(),
      mocks,
    );

    expect(MockEthChainUtils.switchChain).toHaveBeenCalledTimes(1);
    expect(MockEthChainUtils.switchChain).toHaveBeenCalledWith(
      {},
      expect.any(Function),
      CHAIN_IDS.MAINNET,
      NETWORK_TYPES.MAINNET,
      expect.objectContaining({
        autoApprove: true,
      }),
    );
  });
});
