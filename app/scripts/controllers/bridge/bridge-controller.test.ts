import nock from 'nock';
import { BRIDGE_API_BASE_URL } from '../../../../shared/constants/bridge';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { SWAPS_API_V2_BASE_URL } from '../../../../shared/constants/swaps';
import BridgeController from './bridge-controller';
import { BridgeControllerMessenger } from './types';
import { DEFAULT_BRIDGE_CONTROLLER_STATE } from './constants';

const EMPTY_INIT_STATE = {
  bridgeState: DEFAULT_BRIDGE_CONTROLLER_STATE,
};

const messengerMock = {
  call: jest.fn(),
  registerActionHandler: jest.fn(),
  registerInitialEventPayload: jest.fn(),
  publish: jest.fn(),
} as unknown as jest.Mocked<BridgeControllerMessenger>;

describe('BridgeController', function () {
  let bridgeController: BridgeController;

  beforeAll(function () {
    bridgeController = new BridgeController({ messenger: messengerMock });
  });

  beforeEach(() => {
    jest.clearAllMocks();
    nock(BRIDGE_API_BASE_URL)
      .get('/getAllFeatureFlags')
      .reply(200, {
        'extension-config': {
          refreshRate: 3,
          maxRefreshCount: 1,
        },
        'extension-support': true,
        'src-network-allowlist': [10, 534352],
        'dest-network-allowlist': [137, 42161],
      });
    nock(BRIDGE_API_BASE_URL)
      .get('/getTokens?chainId=10')
      .reply(200, [
        {
          address: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
          symbol: 'ABC',
          decimals: 16,
        },
        {
          address: '0x1291478912',
          symbol: 'DEF',
          decimals: 16,
        },
      ]);
    nock(SWAPS_API_V2_BASE_URL)
      .get('/networks/10/topAssets')
      .reply(200, [
        {
          address: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
          symbol: 'ABC',
        },
      ]);
    bridgeController.resetState();
  });

  it('constructor should setup correctly', function () {
    expect(bridgeController.state).toStrictEqual(EMPTY_INIT_STATE);
  });

  it('setBridgeFeatureFlags should fetch and set the bridge feature flags', async function () {
    const expectedFeatureFlagsResponse = {
      extensionSupport: true,
      destNetworkAllowlist: [CHAIN_IDS.POLYGON, CHAIN_IDS.ARBITRUM],
      srcNetworkAllowlist: [CHAIN_IDS.OPTIMISM, CHAIN_IDS.SCROLL],
      extensionConfig: {
        maxRefreshCount: 1,
        refreshRate: 3,
      },
    };
    expect(bridgeController.state).toStrictEqual(EMPTY_INIT_STATE);

    await bridgeController.setBridgeFeatureFlags();
    expect(bridgeController.state.bridgeState.bridgeFeatureFlags).toStrictEqual(
      expectedFeatureFlagsResponse,
    );
  });

  it('selectDestNetwork should set the bridge dest tokens and top assets', async function () {
    await bridgeController.selectDestNetwork('0xa');
    expect(bridgeController.state.bridgeState.destTokens).toStrictEqual({
      '0x0000000000000000000000000000000000000000': {
        address: '0x0000000000000000000000000000000000000000',
        decimals: 18,
        iconUrl: './images/eth_logo.svg',
        name: 'Ether',
        symbol: 'ETH',
      },
      '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984': {
        address: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
        symbol: 'ABC',
        decimals: 16,
      },
    });
    expect(bridgeController.state.bridgeState.destTopAssets).toStrictEqual([
      { address: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984', symbol: 'ABC' },
    ]);
    expect(bridgeController.state.bridgeState.quoteRequest).toStrictEqual({
      slippage: 0.5,
      srcTokenAddress: '0x0000000000000000000000000000000000000000',
      walletAddress: undefined,
    });
  });

  it('selectSrcNetwork should set the bridge src tokens and top assets', async function () {
    await bridgeController.selectSrcNetwork('0xa');
    expect(bridgeController.state.bridgeState.srcTokens).toStrictEqual({
      '0x0000000000000000000000000000000000000000': {
        address: '0x0000000000000000000000000000000000000000',
        decimals: 18,
        iconUrl: './images/eth_logo.svg',
        name: 'Ether',
        symbol: 'ETH',
      },
      '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984': {
        address: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
        symbol: 'ABC',
        decimals: 16,
      },
    });
    expect(bridgeController.state.bridgeState.srcTopAssets).toStrictEqual([
      {
        address: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
        symbol: 'ABC',
      },
    ]);
    expect(bridgeController.state.bridgeState.quoteRequest).toStrictEqual({
      slippage: 0.5,
      srcTokenAddress: '0x0000000000000000000000000000000000000000',
      walletAddress: undefined,
    });
  });

  it('updateBridgeQuoteRequestParams should update the quoteRequest state', function () {
    bridgeController.updateBridgeQuoteRequestParams({ srcChainId: 1 });
    expect(bridgeController.state.bridgeState.quoteRequest).toStrictEqual({
      srcChainId: 1,
      slippage: 0.5,
      srcTokenAddress: '0x0000000000000000000000000000000000000000',
      walletAddress: undefined,
    });

    bridgeController.updateBridgeQuoteRequestParams({ destChainId: 10 });
    expect(bridgeController.state.bridgeState.quoteRequest).toStrictEqual({
      destChainId: 10,
      slippage: 0.5,
      srcTokenAddress: '0x0000000000000000000000000000000000000000',
      walletAddress: undefined,
    });

    bridgeController.updateBridgeQuoteRequestParams({ destChainId: undefined });
    expect(bridgeController.state.bridgeState.quoteRequest).toStrictEqual({
      destChainId: undefined,
      slippage: 0.5,
      srcTokenAddress: '0x0000000000000000000000000000000000000000',
      walletAddress: undefined,
    });

    bridgeController.updateBridgeQuoteRequestParams({
      srcTokenAddress: undefined,
    });
    expect(bridgeController.state.bridgeState.quoteRequest).toStrictEqual({
      slippage: 0.5,
      srcTokenAddress: undefined,
      walletAddress: undefined,
    });

    bridgeController.updateBridgeQuoteRequestParams({
      srcTokenAmount: '100000',
      destTokenAddress: '0x123',
      slippage: 0.5,
      srcTokenAddress: '0x0000000000000000000000000000000000000000',
      walletAddress: undefined,
    });
    expect(bridgeController.state.bridgeState.quoteRequest).toStrictEqual({
      srcTokenAmount: '100000',
      destTokenAddress: '0x123',
      slippage: 0.5,
      srcTokenAddress: '0x0000000000000000000000000000000000000000',
      walletAddress: undefined,
    });

    bridgeController.updateBridgeQuoteRequestParams({
      srcTokenAddress: '0x2ABC',
    });
    expect(bridgeController.state.bridgeState.quoteRequest).toStrictEqual({
      slippage: 0.5,
      srcTokenAddress: '0x2ABC',
      walletAddress: undefined,
    });

    bridgeController.resetState();
    expect(bridgeController.state.bridgeState.quoteRequest).toStrictEqual({
      slippage: 0.5,
      srcTokenAddress: '0x0000000000000000000000000000000000000000',
      walletAddress: undefined,
    });
  });
});
