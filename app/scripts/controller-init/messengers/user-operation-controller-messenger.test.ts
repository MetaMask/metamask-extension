import { Messenger } from '@metamask/messenger';
import { getRootMessenger } from '../../lib/messenger';
import { getUserOperationControllerMessenger } from './user-operation-controller-messenger';

describe('getUserOperationControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const userOperationControllerMessenger =
      getUserOperationControllerMessenger(messenger);

    expect(userOperationControllerMessenger).toBeInstanceOf(Messenger);
  });
});
