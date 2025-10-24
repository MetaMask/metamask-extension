import { Messenger } from '@metamask/messenger';
import { getUserOperationControllerMessenger } from './user-operation-controller-messenger';
import { getRootMessenger } from '../../lib/messenger';

describe('getUserOperationControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const userOperationControllerMessenger =
      getUserOperationControllerMessenger(messenger);

    expect(userOperationControllerMessenger).toBeInstanceOf(Messenger);
  });
});
