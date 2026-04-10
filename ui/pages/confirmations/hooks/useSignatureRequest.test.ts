import { TransactionType } from '@metamask/transaction-controller';
import { renderHookWithProvider } from '../../../../test/lib/render-helpers-navigate';
import mockState from '../../../../test/data/mock-state.json';
import {
  useSignatureRequest,
  useSignatureRequestOptional,
} from './useSignatureRequest';

const ID_MOCK = '123-456';

const mockUseParams = jest.fn();
jest.mock('react-router-dom', () => {
  return {
    ...jest.requireActual('react-router-dom'),
    useParams: () => mockUseParams(),
  };
});

const MESSAGE_MOCK = {
  id: ID_MOCK,
  type: TransactionType.personalSign,
  msgParams: {
    from: '0x0',
    origin: 'https://test.com',
    data: 'test-data',
  },
};

function buildState({
  unapprovedPersonalMsgs,
  unapprovedTypedMessages,
}: {
  unapprovedPersonalMsgs?: Record<string, typeof MESSAGE_MOCK>;
  unapprovedTypedMessages?: Record<string, typeof MESSAGE_MOCK>;
}) {
  return {
    ...mockState,
    metamask: {
      ...mockState.metamask,
      pendingApprovals: {},
      unapprovedPersonalMsgs: unapprovedPersonalMsgs ?? {},
      unapprovedTypedMessages: unapprovedTypedMessages ?? {},
    },
  };
}

describe('useSignatureRequestOptional', () => {
  beforeEach(() => {
    mockUseParams.mockReturnValue({ id: ID_MOCK });
  });

  it('returns personal message matching confirmation ID', () => {
    const state = buildState({
      unapprovedPersonalMsgs: { [ID_MOCK]: MESSAGE_MOCK },
    });

    const { result } = renderHookWithProvider(
      useSignatureRequestOptional,
      state,
    );

    expect(result.current).toStrictEqual(MESSAGE_MOCK);
  });

  it('returns typed message matching confirmation ID', () => {
    const typedMessage = {
      ...MESSAGE_MOCK,
      type: TransactionType.signTypedData,
    };
    const state = buildState({
      unapprovedTypedMessages: { [ID_MOCK]: typedMessage },
    });

    const { result } = renderHookWithProvider(
      useSignatureRequestOptional,
      state,
    );

    expect(result.current).toStrictEqual(typedMessage);
  });

  it('returns undefined when no matching message', () => {
    const state = buildState({});

    const { result } = renderHookWithProvider(
      useSignatureRequestOptional,
      state,
    );

    expect(result.current).toBeUndefined();
  });

  it('returns undefined when message has different ID', () => {
    const state = buildState({
      unapprovedPersonalMsgs: {
        'other-id': { ...MESSAGE_MOCK, id: 'other-id' },
      },
    });

    const { result } = renderHookWithProvider(
      useSignatureRequestOptional,
      state,
    );

    expect(result.current).toBeUndefined();
  });
});

describe('useSignatureRequest', () => {
  beforeEach(() => {
    mockUseParams.mockReturnValue({ id: ID_MOCK });
  });

  it('returns message when matching unapproved message exists', () => {
    const state = buildState({
      unapprovedPersonalMsgs: { [ID_MOCK]: MESSAGE_MOCK },
    });

    const { result } = renderHookWithProvider(useSignatureRequest, state);

    expect(result.current).toStrictEqual(MESSAGE_MOCK);
  });

  it('returns fallback signature request when no match', () => {
    const state = buildState({});

    const { result } = renderHookWithProvider(useSignatureRequest, state);

    expect(result.current).toStrictEqual({
      id: '',
      type: TransactionType.personalSign,
    });
  });
});
