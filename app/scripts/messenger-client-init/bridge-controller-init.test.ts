import {
  BridgeController,
  BridgeControllerMessenger,
  UnifiedSwapBridgeEventName,
} from '@metamask/bridge-controller';
import { BRIDGE_API_BASE_URL } from '../../../shared/constants/bridge';
import { getRootMessenger } from '../lib/messenger';
import { trackEvent } from '../controllers/analytics';
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

jest.mock('../controllers/analytics', () => ({
  ...jest.requireActual('../controllers/analytics'),
  trackEvent: jest.fn(),
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

  it('correctly sets up trackMetaMetricsFn', () => {
    BridgeControllerInit(getInitRequestMock());
    const constructorOptions = jest.mocked(BridgeController).mock.calls[0][0];
    const { trackMetaMetricsFn } = constructorOptions;
    const properties = {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      error_message: 'Snap request failed',
    };

    trackMetaMetricsFn(UnifiedSwapBridgeEventName.Failed, properties as never);

    expect(trackEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        name: UnifiedSwapBridgeEventName.Failed,
        properties: expect.objectContaining(properties),
      }),
    );
  });

  it('handles trackMetaMetricsFn with no properties', () => {
    BridgeControllerInit(getInitRequestMock());
    const constructorOptions = jest.mocked(BridgeController).mock.calls[0][0];
    const { trackMetaMetricsFn } = constructorOptions;

    trackMetaMetricsFn(UnifiedSwapBridgeEventName.Failed, {} as never);

    expect(trackEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        name: UnifiedSwapBridgeEventName.Failed,
        properties: expect.any(Object),
      }),
    );
  });
});
