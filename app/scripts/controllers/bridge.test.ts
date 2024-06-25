import nock from 'nock';
import { CHAIN_IDS } from '../../../shared/constants/network';
import { BRIDGE_API_BASE_URL } from '../../../shared/constants/bridge';
import BridgeController from './bridge';

const EMPTY_INIT_STATE = {
  bridgeState: {
    bridgeFeatureFlags: {
      extensionSupport: false,
      srcNetworkAllowlist: [],
      destNetworkAllowlist: [],
    },
  },
};

describe('BridgeController', function () {
  let bridgeController: BridgeController;

  beforeAll(function () {
    bridgeController = new BridgeController();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    nock(BRIDGE_API_BASE_URL)
      .get('/getAllFeatureFlags')
      .reply(200, {
        'extension-support': true,
        'src-network-allowlist': [10, 534352],
        'dest-network-allowlist': [137, 42161],
      });
  });

  it('constructor should setup correctly', function () {
    expect(bridgeController.store.getState()).toStrictEqual(EMPTY_INIT_STATE);
  });

  it('setBridgeFeatureFlags should fetch and set the bridge feature flags', async function () {
    const featureFlagsResponse = {
      extensionSupport: true,
      destNetworkAllowlist: [CHAIN_IDS.POLYGON, CHAIN_IDS.ARBITRUM],
      srcNetworkAllowlist: [CHAIN_IDS.OPTIMISM, CHAIN_IDS.SCROLL],
    };
    expect(bridgeController.store.getState()).toStrictEqual(EMPTY_INIT_STATE);

    await bridgeController.setBridgeFeatureFlags();
    expect(
      bridgeController.store.getState().bridgeState.bridgeFeatureFlags,
    ).toStrictEqual(featureFlagsResponse);
  });
});
