import { Messenger } from '@metamask/messenger';
import { getRootMessenger } from '../../lib/messenger';
import { getDataDeletionServiceMessenger } from './data-deletion-service-messenger';

describe('getDataDeletionServiceMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const dataDeletionServiceMessenger =
      getDataDeletionServiceMessenger(messenger);

    expect(dataDeletionServiceMessenger).toBeInstanceOf(Messenger);
  });
});
