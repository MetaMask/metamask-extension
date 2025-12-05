import { ApprovalType } from '@metamask/controller-utils';
import mockState from '../../../../test/data/mock-state.json';
import { unapprovedPersonalSignMsg } from '../../../../test/data/confirmations/personal_sign';
import { renderHookWithConfirmContextProvider } from '../../../../test/lib/confirmations/render-helpers';
import useSyncConfirmPath from './useSyncConfirmPath';

const mockUseNavigate = jest.fn();
const mockUseParams = jest.fn();
const mockUseLocation = jest.fn();
jest.mock('react-router-dom', () => {
  return {
    ...jest.requireActual('react-router-dom'),
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
  const originalLocation = window.location;

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock window.location since the hook reads from global location
    Object.defineProperty(window, 'location', {
      value: { pathname: '/confirm-transaction' },
      writable: true,
    });
    // Default mock: on confirmation route with no params
    mockUseLocation.mockReturnValue({
      pathname: '/confirm-transaction',
      search: '',
      hash: '',
      state: null,
    });
    mockUseParams.mockReturnValue({});
  });

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true,
    });
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
