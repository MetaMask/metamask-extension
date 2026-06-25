import {
  DeFiPositionsControllerMessenger,
  DeFiPositionsController,
} from '@metamask/assets-controllers';
import { buildControllerInitRequestMock } from '../test/utils';
import { MessengerClientInitRequest } from '../types';
import {
  DeFiPositionsControllerInitMessenger,
  getDeFiPositionsControllerInitMessenger,
  getDeFiPositionsControllerMessenger,
} from '../messengers/defi-positions/defi-positions-controller-messenger';
import { getRootMessenger } from '../../lib/messenger';
import { MetaMetricsEventCategory } from '../../../../shared/constants/metametrics';
import { trackLegacyMetaMetricsEvent } from '../../controllers/analytics';
import { DeFiPositionsControllerInit } from './defi-positions-controller-init';

jest.mock('@metamask/assets-controllers');
jest.mock('../../controllers/analytics', () => ({
  trackLegacyMetaMetricsEvent: jest.fn(),
}));

function buildInitRequestMock(): jest.Mocked<
  MessengerClientInitRequest<
    DeFiPositionsControllerMessenger,
    DeFiPositionsControllerInitMessenger
  >
> {
  const baseControllerMessenger = getRootMessenger();

  return {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getDeFiPositionsControllerMessenger(
      baseControllerMessenger,
    ),
    initMessenger: getDeFiPositionsControllerInitMessenger(
      baseControllerMessenger,
    ),
  };
}

describe('DefiPositionsControllerInit', () => {
  const defiPositionsControllerClassMock = jest.mocked(DeFiPositionsController);
  const trackLegacyMetaMetricsEventMock = jest.mocked(
    trackLegacyMetaMetricsEvent,
  );

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns controller instance', () => {
    const requestMock = buildInitRequestMock();
    expect(
      DeFiPositionsControllerInit(requestMock).messengerClient,
    ).toBeInstanceOf(DeFiPositionsController);
  });

  it('initializes with correct messenger and state', () => {
    const requestMock = buildInitRequestMock();
    DeFiPositionsControllerInit(requestMock);

    expect(defiPositionsControllerClassMock).toHaveBeenCalled();
  });

  it('routes trackEvent through AnalyticsController', () => {
    const requestMock = buildInitRequestMock();
    DeFiPositionsControllerInit(requestMock);

    const { trackEvent } = defiPositionsControllerClassMock.mock.calls[0][0];
    trackEvent?.({
      event: 'DeFi Position Viewed',
      category: MetaMetricsEventCategory.Wallet,
      properties: { protocol: 'aave' },
    });

    expect(trackLegacyMetaMetricsEventMock).toHaveBeenCalledWith({
      event: 'DeFi Position Viewed',
      category: MetaMetricsEventCategory.Wallet,
      properties: { protocol: 'aave' },
    });
  });
});
