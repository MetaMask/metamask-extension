import BridgeController from './bridge';

const EMPTY_INIT_STATE = {
  bridgeState: {},
};

describe('BridgeController', function () {
  let bridgeController: BridgeController;

  beforeAll(function () {
    bridgeController = new BridgeController();
  });

  it('constructor should setup correctly', function () {
    expect(bridgeController.store.getState()).toStrictEqual(EMPTY_INIT_STATE);
  });
});
