import {
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import mockState from '../../../../test/data/mock-state.json';
import { renderHookWithProvider } from '../../../../test/lib/render-helpers';
import { useRedesignedSendFlow } from './useRedesignedSendFlow';
import { useConfirmSendNavigation } from './useConfirmSendNavigation';
import { useUnapprovedTransactionWithFallback } from './transactions/useUnapprovedTransaction';

const mockUseRedesignedSendFlow = jest.mocked(useRedesignedSendFlow);

const mockHistory = {
  goBack: jest.fn(),
  push: jest.fn(),
};

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useHistory: () => mockHistory,
}));

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: () => async (fn: () => Promise<unknown>) => {
    if (fn) {
      await fn();
    }
  },
}));

jest.mock('./useRedesignedSendFlow');
jest.mock('./transactions/useUnapprovedTransaction');

describe('useConfirmSendNavigation', () => {
  const useUnapprovedTransactionMock = jest.mocked(
    useUnapprovedTransactionWithFallback,
  );

  afterEach(() => {
    jest.clearAllMocks();
  });

  const renderHook = () => {
    const { result } = renderHookWithProvider(
      useConfirmSendNavigation,
      mockState,
    );
    return result.current;
  };

  it('returns navigateBackIfSend method', () => {
    useUnapprovedTransactionMock.mockReturnValue({} as TransactionMeta);
    mockUseRedesignedSendFlow.mockReturnValue({ enabled: false });

    const result = renderHook();

    expect(result.navigateBackIfSend).toBeDefined();
  });

  it('does not navigate back when send redesign is disabled', () => {
    useUnapprovedTransactionMock.mockReturnValue({
      origin: 'metamask',
      type: TransactionType.simpleSend,
    } as TransactionMeta);
    mockUseRedesignedSendFlow.mockReturnValue({ enabled: false });

    const result = renderHook();
    result.navigateBackIfSend();

    expect(mockHistory.goBack).not.toHaveBeenCalled();
  });

  it('navigates back when send redesign is enabled and confirmation is metamask simpleSend', () => {
    useUnapprovedTransactionMock.mockReturnValue({
      origin: 'metamask',
      type: TransactionType.simpleSend,
    } as TransactionMeta);
    mockUseRedesignedSendFlow.mockReturnValue({ enabled: true });

    const result = renderHook();
    result.navigateBackIfSend();

    expect(mockHistory.goBack).toHaveBeenCalled();
  });

  it('does not navigate back when send redesign is enabled but origin is not metamask', () => {
    useUnapprovedTransactionMock.mockReturnValue({
      origin: 'dapp',
      type: TransactionType.simpleSend,
    } as TransactionMeta);
    mockUseRedesignedSendFlow.mockReturnValue({ enabled: true });

    const result = renderHook();
    result.navigateBackIfSend();

    expect(mockHistory.goBack).not.toHaveBeenCalled();
  });

  it('does not navigate back when send redesign is enabled but type is not simpleSend', () => {
    useUnapprovedTransactionMock.mockReturnValue({
      origin: 'metamask',
      type: TransactionType.contractInteraction,
    } as TransactionMeta);
    mockUseRedesignedSendFlow.mockReturnValue({ enabled: true });

    const result = renderHook();
    result.navigateBackIfSend();

    expect(mockHistory.goBack).not.toHaveBeenCalled();
  });

  it('does not navigate back when send redesign is enabled but both origin and type do not match', () => {
    useUnapprovedTransactionMock.mockReturnValue({
      origin: 'dapp',
      type: TransactionType.contractInteraction,
    } as TransactionMeta);
    mockUseRedesignedSendFlow.mockReturnValue({ enabled: true });

    const result = renderHook();
    result.navigateBackIfSend();

    expect(mockHistory.goBack).not.toHaveBeenCalled();
  });
});
