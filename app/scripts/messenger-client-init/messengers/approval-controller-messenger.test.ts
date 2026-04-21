import { Messenger } from '@metamask/messenger';
import { getRootMessenger } from '../../lib/messenger';
import { getApprovalControllerMessenger } from './approval-controller-messenger';

describe('getApprovalControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const approvalControllerMessenger =
      getApprovalControllerMessenger(messenger);

    expect(approvalControllerMessenger).toBeInstanceOf(Messenger);
  });
});
