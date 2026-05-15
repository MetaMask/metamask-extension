import { ApprovalType } from '@metamask/controller-utils';
import { renderHookWithProvider } from '../../../../test/lib/render-helpers-navigate';
import mockState from '../../../../test/data/mock-state.json';
import { useApprovalRequest } from './useApprovalRequest';

const ID_MOCK = '123-456';

const mockUseParams = jest.fn();
jest.mock('react-router-dom', () => {
  return {
    ...jest.requireActual('react-router-dom'),
    useParams: () => mockUseParams(),
  };
});

const APPROVAL_MOCK = {
  id: ID_MOCK,
  type: ApprovalType.Transaction,
  time: 1,
  origin: 'https://test.com',
  requestData: null,
  requestState: null,
  expectsResult: false,
};

function buildState({
  pendingApprovals,
}: {
  pendingApprovals?: Record<string, typeof APPROVAL_MOCK>;
}) {
  return {
    ...mockState,
    metamask: {
      ...mockState.metamask,
      pendingApprovals: pendingApprovals ?? {},
    },
  };
}

function runHook(state: ReturnType<typeof buildState>) {
  const { result } = renderHookWithProvider(useApprovalRequest, state);
  return result.current;
}

describe('useApprovalRequest', () => {
  beforeEach(() => {
    mockUseParams.mockReturnValue({ id: ID_MOCK });
  });

  it('returns pending approval matching confirmation ID', () => {
    const result = runHook(
      buildState({
        pendingApprovals: {
          [ID_MOCK]: APPROVAL_MOCK,
        },
      }),
    );

    expect(result).toStrictEqual(APPROVAL_MOCK);
  });

  it('returns undefined when no matching pending approval', () => {
    const result = runHook(buildState({ pendingApprovals: {} }));

    expect(result).toBeUndefined();
  });

  it('returns undefined when pending approval has different ID', () => {
    const result = runHook(
      buildState({
        pendingApprovals: {
          'other-id': { ...APPROVAL_MOCK, id: 'other-id' },
        },
      }),
    );

    expect(result).toBeUndefined();
  });
});
