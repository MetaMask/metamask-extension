import {
  MarketingConsentSyncService,
  type MarketingConsentSyncServiceMessenger,
} from '@metamask/marketing-consent-sync-service';
import type { MessengerClientInitRequest } from './types';
import { buildControllerInitRequestMock } from './test/utils';
import { MarketingConsentSyncServiceInit } from './marketing-consent-sync-service-init';

jest.mock('@metamask/marketing-consent-sync-service');

function getInitRequestMock(): jest.Mocked<
  MessengerClientInitRequest<MarketingConsentSyncServiceMessenger>
> {
  return {
    ...buildControllerInitRequestMock(),
    controllerMessenger: {} as MarketingConsentSyncServiceMessenger,
    initMessenger: undefined,
  };
}

describe('MarketingConsentSyncServiceInit', () => {
  it('creates the service for the extension client without persisted state', () => {
    const request = getInitRequestMock();

    const { messengerClient, persistedStateKey, memStateKey } =
      MarketingConsentSyncServiceInit(request);

    expect(messengerClient).toBeInstanceOf(MarketingConsentSyncService);
    expect(MarketingConsentSyncService).toHaveBeenCalledWith({
      messenger: request.controllerMessenger,
      clientType: 'extension',
    });
    expect(persistedStateKey).toBeNull();
    expect(memStateKey).toBeNull();
  });
});
