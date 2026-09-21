import { Messenger } from '@metamask/messenger';
import { getRootMessenger } from '../../lib/messenger';
import { getSentinelApiServiceMessenger } from './sentinel-api-service-messenger';

describe('getSentinelApiServiceMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const serviceMessenger = getSentinelApiServiceMessenger(messenger);

    expect(serviceMessenger).toBeInstanceOf(Messenger);
  });

  it('delegates AuthenticationController:getBearerToken', () => {
    const messenger = getRootMessenger<never, never>();
    const delegateSpy = jest.spyOn(messenger, 'delegate');

    getSentinelApiServiceMessenger(messenger);

    expect(delegateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        actions: expect.arrayContaining([
          'AuthenticationController:getBearerToken',
        ]),
      }),
    );
  });
});
