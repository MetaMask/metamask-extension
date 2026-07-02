import { Messenger } from '@metamask/messenger';
import { getRootMessenger } from '../../lib/messenger';
import { getConfigRegistryApiServiceMessenger } from './config-registry-api-service-messenger';

describe('getConfigRegistryApiServiceMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const controllerMessenger = getConfigRegistryApiServiceMessenger(messenger);

    expect(controllerMessenger).toBeInstanceOf(Messenger);
  });
});
