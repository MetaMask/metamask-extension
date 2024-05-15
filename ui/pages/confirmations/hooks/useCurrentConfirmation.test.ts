import { ApprovalType } from '@metamask/controller-utils';
// eslint-disable-next-line import/no-named-as-default
import Router from 'react-router-dom';

import { renderHookWithProvider } from '../../../../test/lib/render-helpers';
import useCurrentConfirmation from './useCurrentConfirmation';

const mockState = {
  metamask: {
    unapprovedPersonalMsgs: {
      '1': {
        id: '1',
        msgParams: {},
      },
      '2': {
        id: '2',
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
      '2': {
        id: '2',
        origin: 'origin',
        time: Date.now(),
        type: ApprovalType.EthSignTypedData,
        requestData: {},
        requestState: null,
        expectsResult: false,
      },
    },
    preferences: {
      redesignedConfirmationsEnabled: true,
    },
  },
};

describe('useCurrentConfirmation', () => {
  it('should return current confirmation', () => {
    const { result } = renderHookWithProvider(
      () => useCurrentConfirmation(),
      mockState,
    );

    expect(result.current.currentConfirmation).toBe(
      mockState.metamask.unapprovedPersonalMsgs['1'],
    );
  });

  it('returns confirmation for transaction id present in url', () => {
    jest.spyOn(Router, 'useParams').mockReturnValue({ id: '2' });
    const { result } = renderHookWithProvider(
      () => useCurrentConfirmation(),
      mockState,
    );

    expect(result.current.currentConfirmation).toBe(
      mockState.metamask.unapprovedPersonalMsgs['2'],
    );
  });

  it('should not return confirmation if user has not enabled preference for redesigned confirmations', () => {
    const { result } = renderHookWithProvider(() => useCurrentConfirmation(), {
      ...mockState,
      metamask: {
        ...mockState.metamask,
        preferences: {
          redesignedConfirmationsEnabled: false,
        },
      },
    });

    expect(result.current.currentConfirmation).toBe(undefined);
  });
});
