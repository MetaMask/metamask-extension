import { ApprovalType } from '@metamask/controller-utils';
import mockState from '../../../../test/data/mock-state.json';
import { unapprovedPersonalSignMsg } from '../../../../test/data/confirmations/personal_sign';
import { renderHookWithConfirmContextProvider } from '../../../../test/lib/confirmations/render-helpers';
import useSyncConfirmPath from './useSyncConfirmPath';

const mockUseNavigate = jest.fn();
const mockUseParams = jest.fn();
const mockUseLocation = jest.fn();
jest.mock('react-router-dom-v5-compat', () => {
  return {
    ...jest.requireActual('react-router-dom-v5-compat'),
    useNavigate: () => mockUseNavigate,
    useParams: () => mockUseParams(),
    useLocation: () => mockUseLocation(),
  };
});

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

describe('useSyncConfirmPath', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default mock: on confirmation route with no params
    mockUseLocation.mockReturnValue({
      pathname: '/confirm-transaction',
      search: '',
      hash: '',
      state: null,
    });
    mockUseParams.mockReturnValue({});
  });

  it('should execute correctly', () => {
    const result = renderHookWithConfirmContextProvider(
      () => useSyncConfirmPath(unapprovedPersonalSignMsg),
      STATE_MOCK,
    );
    expect(result).toBeDefined();
  });

  it('should replace history route', () => {
    renderHookWithConfirmContextProvider(
      () => useSyncConfirmPath(unapprovedPersonalSignMsg),
      STATE_MOCK,
    );
    expect(mockUseNavigate).toHaveBeenCalledWith(
      '/confirm-transaction/0050d5b0-c023-11ee-a0cb-3390a510a0ab/signature-request',
      { replace: true },
    );
  });
});
