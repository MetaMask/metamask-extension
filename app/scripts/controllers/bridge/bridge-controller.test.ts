import nock from 'nock';
import { BRIDGE_API_BASE_URL } from '../../../../shared/constants/bridge';
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

  it('constructor should setup correctly', function () {
    expect(bridgeController.state).toStrictEqual(EMPTY_INIT_STATE);
  });

  it('setBridgeFeatureFlags should fetch and set the bridge feature flags', async function () {
    nock(BRIDGE_API_BASE_URL).get('/getAllFeatureFlags').reply(200, {
      'extension-support': true,
    });
    expect(bridgeController.state.bridgeState.bridgeFeatureFlags).toStrictEqual(
      { extensionSupport: false },
    );

    await bridgeController.setBridgeFeatureFlags();
    expect(bridgeController.state.bridgeState.bridgeFeatureFlags).toStrictEqual(
      { extensionSupport: true },
    );
  });
});
