import { ApprovalType } from '@metamask/controller-utils';

import { renderHookWithProvider } from '../../../../test/lib/render-helpers';
import useCurrentConfirmation from './useCurrentConfirmation';

const mockState = {
  metamask: {
    unapprovedPersonalMsgs: {
      '1': {
        id: '1',
        msgParams: {},
      },
    },
    pendingApprovals: {
      '1': {
        id: '1',
        origin: 'origin',
        time: Date.now(),
        type: ApprovalType.PersonalSign,
        requestData: {},
        requestState: null,
        expectsResult: false,
      },
    },
  },
};

describe('useCurrentConfirmation', () => {
  beforeAll(() => {
    process.env.ENABLE_CONFIRMATION_REDESIGN = 'true';
  });

  afterAll(() => {
    process.env.ENABLE_CONFIRMATION_REDESIGN = 'false';
  });

  it('should return current confirmation', () => {
    const { result } = renderHookWithProvider(
      () => useCurrentConfirmation(),
      mockState,
    );

    expect(result.current.currentConfirmation).toBe(
      mockState.metamask.unapprovedPersonalMsgs['1'],
    );
  });
});
