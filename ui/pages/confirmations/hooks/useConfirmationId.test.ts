import { ApprovalType } from '@metamask/controller-utils';
import { renderHookWithProvider } from '../../../../test/lib/render-helpers-navigate';
import mockState from '../../../../test/data/mock-state.json';
import { useConfirmationId } from './useConfirmationId';

const ID_MOCK = '123-456';
const ID_2_MOCK = '456-789';

const mockUseParams = jest.fn();
jest.mock('react-router-dom', () => {
  return {
    ...jest.requireActual('react-router-dom'),
    useParams: () => mockUseParams(),
  };
});

function buildState({
  pendingApprovals,
}: {
  pendingApprovals?: Record<string, { id: string; type: string; time: number }>;
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
  const { result } = renderHookWithProvider(useConfirmationId, state);
  return result.current;
}

describe('useConfirmationId', () => {
  beforeEach(() => {
    mockUseParams.mockReturnValue({});
  });

  it('returns ID from URL params when present', () => {
    mockUseParams.mockReturnValue({ id: ID_MOCK });

    const result = runHook(buildState({ pendingApprovals: {} }));

    expect(result).toBe(ID_MOCK);
  });

  it('returns URL param ID even when pending approvals exist', () => {
    mockUseParams.mockReturnValue({ id: ID_MOCK });

    const result = runHook(
      buildState({
        pendingApprovals: {
          [ID_2_MOCK]: {
            id: ID_2_MOCK,
            type: ApprovalType.Transaction,
            time: 1,
          },
        },
      }),
    );

    expect(result).toBe(ID_MOCK);
  });

  it('returns oldest pending approval ID when no URL param', () => {
    const result = runHook(
      buildState({
        pendingApprovals: {
          [ID_MOCK]: {
            id: ID_MOCK,
            type: ApprovalType.Transaction,
            time: 10,
          },
          [ID_2_MOCK]: {
            id: ID_2_MOCK,
            type: ApprovalType.Transaction,
            time: 5,
          },
        },
      }),
    );

    expect(result).toBe(ID_2_MOCK);
  });

  it('returns undefined when no URL param and no pending approvals', () => {
    const result = runHook(buildState({ pendingApprovals: {} }));

    expect(result).toBeUndefined();
  });
});
