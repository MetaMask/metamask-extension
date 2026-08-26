import {
  BridgeController,
  BridgeControllerMessenger,
  UNIFIED_SWAP_BRIDGE_EVENT_CATEGORY,
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

  describe('trackMetaMetricsFn', () => {
    beforeEach(() => {
      jest.mocked(trackEvent).mockClear();
    });

    it('forwards Failed failure telemetry including hash presence', () => {
      BridgeControllerInit(getInitRequestMock());
      const constructorOptions = jest.mocked(BridgeController).mock.calls[0][0];
      const { trackMetaMetricsFn } = constructorOptions;
      const properties = {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        error_message: 'Snap request failed',
        // eslint-disable-next-line @typescript-eslint/naming-convention
        error_code: 'unknown',
        // eslint-disable-next-line @typescript-eslint/naming-convention
        failure_phase: 'broadcast',
        // eslint-disable-next-line @typescript-eslint/naming-convention
        source_hash_present: false,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        destination_hash_present: false,
        provider: 'rango_sunswap',
        // eslint-disable-next-line @typescript-eslint/naming-convention
        chain_id_source: 'tron:728126428',
      };

      trackMetaMetricsFn(UnifiedSwapBridgeEventName.Failed, properties as never);

      expect(trackEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          name: UnifiedSwapBridgeEventName.Failed,
          properties: expect.objectContaining({
            ...properties,
            category: UNIFIED_SWAP_BRIDGE_EVENT_CATEGORY,
            actionId: expect.any(String),
          }),
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
});
