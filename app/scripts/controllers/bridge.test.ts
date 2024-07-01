import { CHAIN_IDS } from '../../../shared/constants/network';
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

  it('constructor should setup correctly', function () {
    expect(bridgeController.store.getState()).toStrictEqual(EMPTY_INIT_STATE);
  });

  it('setBridgeFeatureFlags should set the bridge feature flags', function () {
    const featureFlagsResponse = {
      extensionSupport: true,
      destNetworkAllowlist: [CHAIN_IDS.POLYGON, CHAIN_IDS.ARBITRUM],
      srcNetworkAllowlist: [CHAIN_IDS.OPTIMISM, CHAIN_IDS.SCROLL],
    };
    bridgeController.setBridgeFeatureFlags(featureFlagsResponse);
    expect(
      bridgeController.store.getState().bridgeState.bridgeFeatureFlags,
    ).toStrictEqual(featureFlagsResponse);
  });
});
