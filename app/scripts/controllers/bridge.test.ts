import BridgeController from './bridge';

const EMPTY_INIT_STATE = {
  bridgeState: {
    bridgeFeatureFlags: {
      extensionSupport: false,
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
    const featureFlagsResponse = { extensionSupport: true };
    bridgeController.setBridgeFeatureFlags(featureFlagsResponse);
    expect(
      bridgeController.store.getState().bridgeState.bridgeFeatureFlags,
    ).toStrictEqual(featureFlagsResponse);
  });
});
