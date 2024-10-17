import { providerErrors, rpcErrors } from '@metamask/rpc-errors';
import {
  CHAIN_IDS,
  NETWORK_TYPES,
} from '../../../../../shared/constants/network';
import switchEthereumChain from './switch-ethereum-chain';
import EthChainUtils from './ethereum-chain-utils';

jest.mock('./ethereum-chain-utils', () => ({
  ...jest.requireActual('./ethereum-chain-utils'),
  switchChain: jest.fn(),
}));

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

const createMockedHandler = () => {
  const next = jest.fn();
  const end = jest.fn();
  const mocks = {
    getNetworkConfigurationByChainId: jest
      .fn()
      .mockReturnValue(createMockMainnetConfiguration()),
    setActiveNetwork: jest.fn(),
    getCaveat: jest.fn(),
    getCurrentChainIdForDomain: jest.fn().mockReturnValue(NON_INFURA_CHAIN_ID),
    requestPermissionApprovalForOrigin: jest.fn(),
    updateCaveat: jest.fn(),
    grantPermissions: jest.fn(),
  };
  const response = {};
  const handler = (request) =>
    switchEthereumChain.implementation(request, response, next, end, mocks);

  return {
    mocks,
    response,
    next,
    end,
    handler,
  };
};

describe('switchEthereumChainHandler', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns null if the current chain id for the domain matches the chainId in the params', async () => {
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
    expect(EthChainUtils.switchChain).not.toHaveBeenCalled();
  });

  it('throws an error if unable to find a network matching the chainId in the params', async () => {
    const { mocks, end, handler } = createMockedHandler();
    mocks.getCurrentChainIdForDomain.mockReturnValue('0x1');
    mocks.getNetworkConfigurationByChainId.mockReturnValue(undefined);

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
    expect(EthChainUtils.switchChain).not.toHaveBeenCalled();
  });

  it('tries to switch the network', async () => {
    const { mocks, end, handler } = createMockedHandler();
    mocks.getNetworkConfigurationByChainId
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

    expect(EthChainUtils.switchChain).toHaveBeenCalledWith(
      {},
      end,
      'example.com',
      '0xdeadbeef',
      'mainnet',
      null,
      {
        setActiveNetwork: mocks.setActiveNetwork,
        getCaveat: mocks.getCaveat,
        updateCaveat: mocks.updateCaveat,
        requestPermissionApprovalForOrigin:
          mocks.requestPermissionApprovalForOrigin,
        grantPermissions: mocks.grantPermissions,
      },
    );
  });

  it('should return an error if an unexpected parameter is provided', async () => {
    const { end, handler } = createMockedHandler();

    const unexpectedParam = 'unexpected';

    await handler({
      origin: 'example.com',
      params: [
        {
          chainId: createMockMainnetConfiguration().chainId,
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

  it('should return error for invalid chainId', async () => {
    const { handler, end } = createMockedHandler();

    await handler({
      origin: 'example.com',
      params: [{ chainId: 'invalid_chain_id' }],
    });

    expect(end).toHaveBeenCalledWith(
      rpcErrors.invalidParams({
        message: `Expected 0x-prefixed, unpadded, non-zero hexadecimal string 'chainId'. Received:\ninvalid_chain_id`,
      }),
    );
  });
});
