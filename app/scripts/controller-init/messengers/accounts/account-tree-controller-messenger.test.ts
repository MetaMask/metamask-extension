import { Messenger, RestrictedMessenger } from '@metamask/base-controller';
import { getAccountTreeControllerMessenger } from './account-tree-controller-messenger';

describe('getAccountTreeControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = new Messenger<never, never>();
    const accountTreeControllerMessenger =
      getAccountTreeControllerMessenger(messenger);

    expect(accountTreeControllerMessenger).toBeInstanceOf(RestrictedMessenger);
  });
});
