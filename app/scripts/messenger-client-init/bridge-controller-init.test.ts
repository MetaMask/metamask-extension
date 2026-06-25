import {
  BridgeController,
  BridgeControllerMessenger,
  UNIFIED_SWAP_BRIDGE_EVENT_CATEGORY,
  UnifiedSwapBridgeEventName,
} from '@metamask/bridge-controller';
import { BRIDGE_API_BASE_URL } from '../../../shared/constants/bridge';
import { getRootMessenger } from '../lib/messenger';
import { trackLegacyMetaMetricsEvent } from '../controllers/analytics';
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
  trackLegacyMetaMetricsEvent: jest.fn(),
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
  const trackLegacyMetaMetricsEventMock = jest.mocked(
    trackLegacyMetaMetricsEvent,
  );

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

  it('routes trackMetaMetricsFn through AnalyticsController', () => {
    BridgeControllerInit(getInitRequestMock());

    const controllerMock = jest.mocked(BridgeController);
    const { trackMetaMetricsFn } = controllerMock.mock.calls[0][0];

    trackMetaMetricsFn?.(UnifiedSwapBridgeEventName.Submitted, {
      source: 'bridge',
    });

    expect(trackLegacyMetaMetricsEventMock).toHaveBeenCalledWith(
      expect.objectContaining({
        category: UNIFIED_SWAP_BRIDGE_EVENT_CATEGORY,
        event: UnifiedSwapBridgeEventName.Submitted,
        properties: expect.objectContaining({
          source: 'bridge',
          actionId: expect.any(String),
        }),
      }),
    );
  });
});
