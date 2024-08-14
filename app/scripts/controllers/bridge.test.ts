import nock from 'nock';
import { BRIDGE_API_BASE_URL } from '../../../shared/constants/bridge';
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

  it('setBridgeFeatureFlags should fetch and set the bridge feature flags', async function () {
    nock(BRIDGE_API_BASE_URL).get('/getAllFeatureFlags').reply(200, {
      'extension-support': true,
    });
    expect(
      bridgeController.store.getState().bridgeState.bridgeFeatureFlags,
    ).toStrictEqual({ extensionSupport: false });

    await bridgeController.setBridgeFeatureFlags();
    expect(
      bridgeController.store.getState().bridgeState.bridgeFeatureFlags,
    ).toStrictEqual({ extensionSupport: true });
  });
});
