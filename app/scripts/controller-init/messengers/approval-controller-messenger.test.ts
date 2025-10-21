import { Messenger } from '@metamask/messenger';
import { getApprovalControllerMessenger } from './approval-controller-messenger';
import { getRootMessenger } from '.';

describe('getApprovalControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const approvalControllerMessenger =
      getApprovalControllerMessenger(messenger);

    expect(approvalControllerMessenger).toBeInstanceOf(Messenger);
  });
});
