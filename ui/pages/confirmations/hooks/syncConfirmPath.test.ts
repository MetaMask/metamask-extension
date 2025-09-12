import { ApprovalType } from '@metamask/controller-utils';
import mockState from '../../../../test/data/mock-state.json';
import { unapprovedPersonalSignMsg } from '../../../../test/data/confirmations/personal_sign';
import { renderHookWithConfirmContextProvider } from '../../../../test/lib/confirmations/render-helpers';
import syncConfirmPath from './syncConfirmPath';

const mockUseNavigate = jest.fn();

jest.mock('react-router-dom-v5-compat', () => ({
  ...jest.requireActual('react-router-dom-v5-compat'),
  useNavigate: () => mockUseNavigate,
  useParams: () => ({}),
}));

const STATE_MOCK = {
  ...mockState,
  metamask: {
    ...mockState.metamask,
    pendingApprovals: {
      [unapprovedPersonalSignMsg.id]: {
        id: unapprovedPersonalSignMsg.id,
        type: ApprovalType.PersonalSign,
      },
    },
  },
};

describe('syncConfirmPath', () => {
  it('should execute correctly', () => {
    const result = renderHookWithConfirmContextProvider(
      () => syncConfirmPath(unapprovedPersonalSignMsg),
      STATE_MOCK,
    );
    expect(result).toBeDefined();
  });

  it('should navigate to confirmation route', () => {
    renderHookWithConfirmContextProvider(
      () => syncConfirmPath(unapprovedPersonalSignMsg),
      STATE_MOCK,
    );
    expect(mockUseNavigate).toHaveBeenCalled();
  });
});
