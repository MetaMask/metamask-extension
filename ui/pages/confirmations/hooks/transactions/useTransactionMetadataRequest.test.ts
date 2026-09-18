import {
  TransactionMeta,
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';
import { renderHookWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import mockState from '../../../../../test/data/mock-state.json';
import { CHAIN_IDS } from '../../../../../shared/constants/network';
import {
  useTransactionMetadataRequest,
  useTransactionMetadataRequestOptional,
} from './useTransactionMetadataRequest';

const ID_MOCK = '123-456';

const mockUseParams = jest.fn();
jest.mock('react-router-dom', () => {
  return {
    ...jest.requireActual('react-router-dom'),
    useParams: () => mockUseParams(),
  };
});

const TRANSACTION_MOCK: Partial<TransactionMeta> = {
  id: ID_MOCK,
  chainId: CHAIN_IDS.GOERLI,
  status: TransactionStatus.unapproved,
  type: TransactionType.contractInteraction,
};

function buildState({
  transactions,
}: {
  transactions?: Partial<TransactionMeta>[];
}) {
  return {
    ...mockState,
    metamask: {
      ...mockState.metamask,
      pendingApprovals: {},
      transactions: transactions ?? [],
    },
  };
}

describe('useTransactionMetadataRequestOptional', () => {
  beforeEach(() => {
    mockUseParams.mockReturnValue({ id: ID_MOCK });
  });

  it('returns transaction matching confirmation ID', () => {
    const state = buildState({ transactions: [TRANSACTION_MOCK] });

    const { result } = renderHookWithProvider(
      useTransactionMetadataRequestOptional,
      state,
    );

    expect(result.current).toStrictEqual(TRANSACTION_MOCK);
  });

  it('returns undefined when no matching unapproved transaction', () => {
    const state = buildState({ transactions: [] });

    const { result } = renderHookWithProvider(
      useTransactionMetadataRequestOptional,
      state,
    );

    expect(result.current).toBeUndefined();
  });

  it('returns undefined when transaction is not unapproved', () => {
    const state = buildState({
      transactions: [
        { ...TRANSACTION_MOCK, status: TransactionStatus.submitted },
      ],
    });

    const { result } = renderHookWithProvider(
      useTransactionMetadataRequestOptional,
      state,
    );

    expect(result.current).toBeUndefined();
  });

  it('returns undefined when transaction ID does not match', () => {
    const state = buildState({
      transactions: [{ ...TRANSACTION_MOCK, id: 'other-id' }],
    });

    const { result } = renderHookWithProvider(
      useTransactionMetadataRequestOptional,
      state,
    );

    expect(result.current).toBeUndefined();
  });
});

describe('useTransactionMetadataRequest', () => {
  beforeEach(() => {
    mockUseParams.mockReturnValue({ id: ID_MOCK });
  });

  it('returns transaction when matching unapproved transaction exists', () => {
    const state = buildState({ transactions: [TRANSACTION_MOCK] });

    const { result } = renderHookWithProvider(
      useTransactionMetadataRequest,
      state,
    );

    expect(result.current).toStrictEqual(TRANSACTION_MOCK);
  });

  it('returns fallback transaction meta when no match', () => {
    const state = buildState({ transactions: [] });

    const { result } = renderHookWithProvider(
      useTransactionMetadataRequest,
      state,
    );

    expect(result.current).toStrictEqual({
      id: '',
      chainId: '0x0',
      networkClientId: '',
      status: TransactionStatus.rejected,
      time: 0,
      txParams: {
        from: '0x0000000000000000000000000000000000000000',
      },
      type: TransactionType.simpleSend,
    });
  });
});
