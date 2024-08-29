import { ethErrors } from 'eth-rpc-errors';
import {
  CHAIN_IDS,
  NETWORK_TYPES,
} from '../../../../../shared/constants/network';
import addEthereumChain from './add-ethereum-chain';
import EthChainUtils from './ethereum-chain-utils';

jest.mock('./ethereum-chain-utils', () => ({
  ...jest.requireActual('./ethereum-chain-utils'),
  switchChain: jest.fn(),
}));

const NON_INFURA_CHAIN_ID = '0x123456789';

const createMockMainnetConfiguration = () => ({
  chainId: CHAIN_IDS.MAINNET,
  nickname: 'Ethereum Mainnet',
  rpcUrl: 'https://mainnet.infura.io/v3/',
  type: NETWORK_TYPES.MAINNET,
  ticker: 'ETH',
  rpcPrefs: {
    blockExplorerUrl: 'https://etherscan.io',
  },
});

const createMockNonInfuraConfiguration = () => ({
  chainId: NON_INFURA_CHAIN_ID,
  rpcUrl: 'https://custom.network',
  ticker: 'CUST',
  nickname: 'Custom Network',
  rpcPrefs: {
    blockExplorerUrl: 'https://custom.blockexplorer',
  },
});

const createMockedHandler = () => {
  const next = jest.fn();
  const end = jest.fn();
  const mocks = {
    getCurrentChainIdForDomain: jest.fn().mockReturnValue(NON_INFURA_CHAIN_ID),
    findNetworkConfigurationBy: jest
      .fn()
      .mockReturnValue(createMockMainnetConfiguration()),
    setActiveNetwork: jest.fn(),
    getCurrentRpcUrl: jest
      .fn()
      .mockReturnValue(createMockMainnetConfiguration().rpcUrl),
    requestUserApproval: jest.fn().mockResolvedValue(123),
    requestPermittedChainsPermission: jest.fn(),
    getCaveat: jest.fn(),
    upsertNetworkConfiguration: jest.fn().mockResolvedValue(123),
    startApprovalFlow: () => ({ id: 'approvalFlowId' }),
    endApprovalFlow: jest.fn(),
    requestPermissionApprovalForOrigin: jest.fn(),
    updateCaveat: jest.fn(),
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

  it('creates a new network configuration for the given chainid if no networkConfigurations with the same chainId exists', async () => {
    const { mocks, handler } = createMockedHandler();
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
            createMockNonInfuraConfiguration().rpcPrefs.blockExplorerUrl,
          ],
        },
      ],
    });

    expect(mocks.upsertNetworkConfiguration).toHaveBeenCalledWith(
      createMockNonInfuraConfiguration(),
      { referrer: 'example.com', source: 'dapp' },
    );
  });

  it('does not create a new networkConfiguration for the given chainId if a networkConfiguration already exists with the same chainId and rpcUrl', async () => {
    const { handler, mocks } = createMockedHandler();
    mocks.findNetworkConfigurationBy.mockReturnValue(
      createMockMainnetConfiguration(),
    );
    mocks.upsertNetworkConfiguration.mockResolvedValue(123456);
    await handler({
      origin: 'example.com',
      params: [
        {
          chainId: CHAIN_IDS.MAINNET,
          chainName: 'Ethereum Mainnet',
          rpcUrls: createMockMainnetConfiguration().rpcUrls,
          nativeCurrency: {
            symbol: 'ETH',
            decimals: 18,
          },
          blockExplorerUrls: ['https://etherscan.io'],
        },
      ],
    });

    expect(mocks.upsertNetworkConfiguration).not.toHaveBeenCalled();
  });

  it('creates a new networkConfiguration for the given chainId if a networkConfiguration already exists with the same chainId but different rpcUrl', async () => {
    const { handler, mocks } = createMockedHandler();
    mocks.upsertNetworkConfiguration.mockResolvedValue(123456);
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

    expect(mocks.upsertNetworkConfiguration).toHaveBeenCalledTimes(1);
  });

  it('tries to switch the network', async () => {
    const { mocks, end, handler } = createMockedHandler();
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
            createMockNonInfuraConfiguration().rpcPrefs.blockExplorerUrl,
          ],
        },
      ],
    });

    expect(EthChainUtils.switchChain).toHaveBeenCalledWith(
      {},
      end,
      'example.com',
      createMockNonInfuraConfiguration().chainId,
      {
        fromNetworkConfiguration: {
          chainId: '0x1',
          nickname: 'Ethereum Mainnet',
          rpcPrefs: {
            blockExplorerUrl: 'https://etherscan.io',
          },
          rpcUrl: 'https://mainnet.infura.io/v3/',
          ticker: 'ETH',
          type: 'mainnet',
        },
        toNetworkConfiguration: {
          chainId: '0x123456789',
          networkClientId: 123,
          nickname: 'Custom Network',
          rpcUrl: 'https://custom.network',
          ticker: 'CUST',
        },
      },
      123,
      'approvalFlowId',
      {
        setActiveNetwork: mocks.setActiveNetwork,
        requestUserApproval: mocks.requestUserApproval,
        getCaveat: mocks.getCaveat,
        updateCaveat: mocks.updateCaveat,
        requestPermissionApprovalForOrigin:
          mocks.requestPermissionApprovalForOrigin,
        endApprovalFlow: mocks.endApprovalFlow,
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
          chainId: createMockNonInfuraConfiguration().chainId,
          chainName: createMockNonInfuraConfiguration().nickname,
          rpcUrls: [createMockNonInfuraConfiguration().rpcUrl],
          nativeCurrency: {
            symbol: createMockNonInfuraConfiguration().ticker,
            decimals: 18,
          },
          blockExplorerUrls: [
            createMockNonInfuraConfiguration().rpcPrefs.blockExplorerUrl,
          ],
          [unexpectedParam]: 'parameter',
        },
      ],
    });

    expect(end).toHaveBeenCalledWith(
      ethErrors.rpc.invalidParams({
        message: `Received unexpected keys on object parameter. Unsupported keys:\n${unexpectedParam}`,
      }),
    );
  });

  it('should return an error if nativeCurrency.symbol does not match an existing network with the same chainId', async () => {
    const { handler, end } = createMockedHandler();

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
      ethErrors.rpc.invalidParams({
        message: `nativeCurrency.symbol does not match currency symbol for a network the user already has added with the same chainId. Received:\nWRONG`,
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
      ethErrors.rpc.invalidParams({
        message: `Expected 0x-prefixed, unpadded, non-zero hexadecimal string 'chainId'. Received:\ninvalid_chain_id`,
      }),
    );
  });

  it('should add result set to null to response object if the requested rpcUrl (and chainId) is currently selected', async () => {
    const CURRENT_RPC_CONFIG = createMockNonInfuraConfiguration();
    const { handler, mocks, response } = createMockedHandler();

    mocks.getCurrentChainIdForDomain.mockReturnValue(
      CURRENT_RPC_CONFIG.chainId,
    );
    mocks.findNetworkConfigurationBy.mockReturnValue(CURRENT_RPC_CONFIG);
    mocks.getCurrentRpcUrl.mockReturnValue(CURRENT_RPC_CONFIG.rpcUrl);

    await handler({
      origin: 'example.com',
      params: [
        {
          chainId: CURRENT_RPC_CONFIG.chainId,
          chainName: 'Custom Network',
          rpcUrls: [CURRENT_RPC_CONFIG.rpcUrl],
          nativeCurrency: {
            symbol: CURRENT_RPC_CONFIG.ticker,
            decimals: 18,
          },
          blockExplorerUrls: ['https://custom.blockexplorer'],
        },
      ],
    });
    expect(response.result).toBeNull();
  });
});
