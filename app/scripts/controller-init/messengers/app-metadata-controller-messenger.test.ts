import { Messenger, RestrictedMessenger } from '@metamask/base-controller';
import { getAppMetadataControllerMessenger } from './app-metadata-controller-messenger';

describe('getAppMetadataControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = new Messenger<never, never>();
    const appMetadataControllerMessenger =
      getAppMetadataControllerMessenger(messenger);

    expect(appMetadataControllerMessenger).toBeInstanceOf(RestrictedMessenger);
  });
});
