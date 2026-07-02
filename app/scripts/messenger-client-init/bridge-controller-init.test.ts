import {
  BridgeController,
  BridgeControllerMessenger,
} from '@metamask/bridge-controller';
import { BRIDGE_API_BASE_URL } from '../../../shared/constants/bridge';
import { startNewTrace, trace } from '../../../shared/lib/trace';
import { getRootMessenger } from '../lib/messenger';
import { MessengerClientInitRequest } from './types';
import { buildControllerInitRequestMock } from './test/utils';
import {
  getBridgeControllerMessenger,
  getBridgeControllerInitMessenger,
  BridgeControllerInitMessenger,
} from './messengers';
import { BridgeControllerInit } from './bridge-controller-init';

jest.mock('@metamask/bridge-controller', () => {
  return {
    ...jest.requireActual('@metamask/bridge-controller'),
    BridgeController: jest.fn(),
  };
});

jest.mock('../../../shared/lib/trace', () => ({
  startNewTrace: jest.fn((_request, fn) => (fn ? fn() : undefined)),
  trace: jest.fn((_request, fn) => (fn ? fn() : undefined)),
}));

function getInitRequestMock(): jest.Mocked<
  MessengerClientInitRequest<
    BridgeControllerMessenger,
    BridgeControllerInitMessenger
  >
> {
  const baseMessenger = getRootMessenger<never, never>();

  const requestMock = {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getBridgeControllerMessenger(baseMessenger),
    initMessenger: getBridgeControllerInitMessenger(baseMessenger),
  };

  return requestMock;
}

describe('BridgeControllerInit', () => {
  beforeEach(() => {
    process.env.METAMASK_VERSION = 'MOCK_VERSION';
    jest.clearAllMocks();
  });

  it('initializes the controller', () => {
    const { messengerClient } = BridgeControllerInit(getInitRequestMock());
    expect(messengerClient).toBeInstanceOf(BridgeController);
  });

  it('passes the proper arguments to the controller', () => {
    BridgeControllerInit(getInitRequestMock());

    const controllerMock = jest.mocked(BridgeController);
    expect(controllerMock).toHaveBeenCalledWith({
      messenger: expect.any(Object),
      state: undefined,
      clientId: 'extension',
      clientVersion: 'MOCK_VERSION',
      config: {
        customBridgeApiBaseUrl: BRIDGE_API_BASE_URL,
      },
      fetchFn: expect.any(Function),
      getLayer1GasFee: expect.any(Function),
      trackMetaMetricsFn: expect.any(Function),
      traceFn: expect.any(Function),
      getUseAssetsControllerForRates: expect.any(Function),
    });
  });

  for (const name of [
    'Batch Sell Quotes Fetched',
    'Bridge Quotes Fetched',
    'Swap Quotes Fetched',
  ]) {
    it(`starts a new trace for ${name}`, async () => {
      BridgeControllerInit(getInitRequestMock());

      const controllerMock = jest.mocked(BridgeController);
      const [[{ traceFn }]] = controllerMock.mock.calls;
      const callback = jest.fn();

      traceFn?.({ name }, callback);

      expect(startNewTrace).toHaveBeenCalledWith({ name }, callback);
      expect(trace).not.toHaveBeenCalled();
    });
  }

  it('reuses the current trace for non-quote operations', async () => {
    BridgeControllerInit(getInitRequestMock());

    const controllerMock = jest.mocked(BridgeController);
    const [[{ traceFn }]] = controllerMock.mock.calls;
    const callback = jest.fn();

    traceFn?.({ name: 'Bridge View Loaded' }, callback);

    expect(trace).toHaveBeenCalledWith(
      { name: 'Bridge View Loaded' },
      callback,
    );
    expect(startNewTrace).not.toHaveBeenCalled();
  });
});
