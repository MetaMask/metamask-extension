import { Messenger, RestrictedMessenger } from '@metamask/base-controller';
import { getApprovalControllerMessenger } from './approval-controller-messenger';

describe('getApprovalControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = new Messenger<never, never>();
    const approvalControllerMessenger =
      getApprovalControllerMessenger(messenger);

    expect(approvalControllerMessenger).toBeInstanceOf(RestrictedMessenger);
  });
});
