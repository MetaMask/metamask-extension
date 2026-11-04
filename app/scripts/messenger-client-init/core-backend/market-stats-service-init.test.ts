import { MarketStatsService } from '@metamask/core-backend';
import type { MarketStatsServiceMessenger } from '@metamask/core-backend';
import { getRootMessenger } from '../../lib/messenger';
import { MessengerClientInitRequest } from '../types';
import { buildControllerInitRequestMock } from '../test/utils';
import { getMarketStatsServiceMessenger } from '../messengers/core-backend';
import { MarketStatsServiceInit } from './market-stats-service-init';

jest.mock('../../../../shared/lib/trace');

function getInitRequestMock(): jest.Mocked<
  MessengerClientInitRequest<MarketStatsServiceMessenger>
> {
  const baseMessenger = getRootMessenger<never, never>();

  const requestMock = {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getMarketStatsServiceMessenger(baseMessenger),
    initMessenger: undefined,
  };

  return requestMock;
}

describe('MarketStatsServiceInit', () => {
  it('initializes the service', () => {
    const { messengerClient } = MarketStatsServiceInit(getInitRequestMock());

    expect(messengerClient).toBeInstanceOf(MarketStatsService);
  });

  it('returns null for both state keys', () => {
    const result = MarketStatsServiceInit(getInitRequestMock());

    expect(result.memStateKey).toBeNull();
    expect(result.persistedStateKey).toBeNull();
  });
});
