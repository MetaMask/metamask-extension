import { Messenger } from '@metamask/messenger';
import { getRootMessenger } from '../../lib/messenger';
import { getAppMetadataControllerMessenger } from './app-metadata-controller-messenger';

describe('getAppMetadataControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger();
    const appMetadataControllerMessenger =
      getAppMetadataControllerMessenger(messenger);

    expect(appMetadataControllerMessenger).toBeInstanceOf(Messenger);
  });
});
