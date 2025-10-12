import { Messenger, RestrictedMessenger } from '@metamask/base-controller';
import { getUserOperationControllerMessenger } from './user-operation-controller-messenger';

describe('getUserOperationControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = new Messenger<never, never>();
    const userOperationControllerMessenger =
      getUserOperationControllerMessenger(messenger);

    expect(userOperationControllerMessenger).toBeInstanceOf(
      RestrictedMessenger,
    );
  });
});
