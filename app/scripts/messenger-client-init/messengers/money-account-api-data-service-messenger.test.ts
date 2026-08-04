import { Messenger } from '@metamask/messenger';
import { getRootMessenger } from '../../lib/messenger';
import { getMoneyAccountApiDataServiceMessenger } from './money-account-api-data-service-messenger';

describe('getMoneyAccountApiDataServiceMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const serviceMessenger = getMoneyAccountApiDataServiceMessenger(messenger);

    expect(serviceMessenger).toBeInstanceOf(Messenger);
  });

  it('delegates AuthenticationController:getBearerToken', () => {
    const messenger = getRootMessenger<never, never>();
    const delegateSpy = jest.spyOn(messenger, 'delegate');

    getMoneyAccountApiDataServiceMessenger(messenger);

    expect(delegateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        actions: ['AuthenticationController:getBearerToken'],
      }),
    );
  });
});
