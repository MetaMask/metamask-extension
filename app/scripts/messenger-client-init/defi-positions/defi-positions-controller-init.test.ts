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
import { trackEvent } from '../../controllers/analytics';
import { DeFiPositionsControllerInit } from './defi-positions-controller-init';

jest.mock('@metamask/assets-controllers');
jest.mock('../../controllers/analytics', () => ({
  ...jest.requireActual('../../controllers/analytics'),
  trackEvent: jest.fn(),
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
  const trackEventMock = jest.mocked(trackEvent);

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

    const { trackEvent: controllerTrackEvent } =
      defiPositionsControllerClassMock.mock.calls[0][0];
    controllerTrackEvent?.({
      event: 'DeFi Position Viewed',
      category: MetaMetricsEventCategory.Wallet,
      properties: { totalPositions: 1, totalMarketValueUSD: 100 },
    });

    expect(trackEventMock.mock.calls[0]?.[0]).toMatchObject({
      name: 'DeFi Position Viewed',
      properties: expect.objectContaining({
        category: MetaMetricsEventCategory.Wallet,
        totalPositions: 1,
        totalMarketValueUSD: 100,
      }),
    });
  });
});
