import { Messenger } from '@metamask/messenger';
import { getRootMessenger } from '../../lib/messenger';
import {
  getChompApiServiceInitMessenger,
  getChompApiServiceMessenger,
} from './chomp-api-service-messenger';

describe('getChompApiServiceMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();

    expect(getChompApiServiceMessenger(messenger)).toBeInstanceOf(Messenger);
  });

  it('delegates the bearer token action the service authenticates with', () => {
    const messenger = getRootMessenger<never, never>();
    const delegateSpy = jest.spyOn(messenger, 'delegate');

    getChompApiServiceMessenger(messenger);

    expect(delegateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        actions: ['AuthenticationController:getBearerToken'],
        events: [],
      }),
    );
  });
});

describe('getChompApiServiceInitMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();

    expect(getChompApiServiceInitMessenger(messenger)).toBeInstanceOf(
      Messenger,
    );
  });

  it('delegates the flag state the base URL is read from', () => {
    const messenger = getRootMessenger<never, never>();
    const delegateSpy = jest.spyOn(messenger, 'delegate');

    getChompApiServiceInitMessenger(messenger);

    expect(delegateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        actions: ['RemoteFeatureFlagController:getState'],
        events: [],
      }),
    );
  });
});
