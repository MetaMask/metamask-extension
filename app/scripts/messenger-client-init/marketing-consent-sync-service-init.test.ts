import {
  MarketingConsentController,
  type MarketingConsentControllerMessenger,
} from '@metamask/marketing-consent-controller';
import type { MessengerClientInitRequest } from './types';
import { buildControllerInitRequestMock } from './test/utils';
import { MarketingConsentControllerInit } from './marketing-consent-controller-init';

jest.mock('@metamask/marketing-consent-controller');

function getInitRequestMock(): jest.Mocked<
  MessengerClientInitRequest<MarketingConsentControllerMessenger>
> {
  return {
    ...buildControllerInitRequestMock(),
    controllerMessenger: {} as MarketingConsentControllerMessenger,
    initMessenger: undefined,
  };
}

describe('MarketingConsentControllerInit', () => {
  it('creates the controller for the extension client with persisted state', () => {
    const request = getInitRequestMock();
    request.persistedState = {
      MarketingConsentController: { pendingMarketingConsent: false },
    };

    const { messengerClient } = MarketingConsentControllerInit(request);

    expect(messengerClient).toBeInstanceOf(MarketingConsentController);
    expect(MarketingConsentController).toHaveBeenCalledWith({
      messenger: request.controllerMessenger,
      state: { pendingMarketingConsent: false },
      clientType: 'extension',
    });
  });
});
