import {
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import { renderHook } from '@testing-library/react-hooks';
import { useDispatch } from 'react-redux';
import { setTransactionActive } from '../../../store/actions';
import { useWindowFocus } from '../../../hooks/useWindowFocus';
import { useTransactionFocusEffect } from './useTransactionFocusEffect';
import { useUnapprovedTransaction } from './transactions/useUnapprovedTransaction';

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: jest.fn(),
}));

jest.mock('./transactions/useUnapprovedTransaction');

jest.mock('../../../hooks/useWindowFocus', () => ({
  useWindowFocus: jest.fn(),
}));

jest.mock('../../../store/actions', () => ({
  setTransactionActive: jest.fn(),
}));

const mockConfirmation = {
  id: '1',
  type: TransactionType.simpleSend,
} as TransactionMeta;

describe('useTransactionFocusEffect', () => {
  const dispatchMock = jest.fn();
  const setTransactionActiveMock = setTransactionActive as jest.MockedFunction<
    typeof setTransactionActive
  >;
  const useUnapprovedTransactionMock =
    useUnapprovedTransaction as jest.MockedFunction<
      typeof useUnapprovedTransaction
    >;
  const useWindowFocusMock = useWindowFocus as jest.MockedFunction<
    typeof useWindowFocus
  >;
  const useDispatchMock = useDispatch as jest.MockedFunction<
    typeof useDispatch
  >;

  beforeEach(() => {
    useDispatchMock.mockReturnValue(dispatchMock);
    useWindowFocusMock.mockReturnValue(true);
    useUnapprovedTransactionMock.mockReturnValue(mockConfirmation);

    setTransactionActiveMock.mockClear();
    dispatchMock.mockClear();
  });

  it('should focus the confirmation when window is focused and type is valid', () => {
    renderHook(() => useTransactionFocusEffect());

    expect(dispatchMock).toHaveBeenCalledWith(setTransactionActive('1', true));
  });

  it('should focus new confirmation if previous confirmation is different', () => {
    const { rerender } = renderHook(() => useTransactionFocusEffect());

    const simpleSendConfirmation = {
      id: '2',
      type: TransactionType.simpleSend,
    } as TransactionMeta;

    useUnapprovedTransactionMock.mockReturnValue(simpleSendConfirmation);

    rerender();

    expect(dispatchMock).toHaveBeenCalledWith(setTransactionActive('1', false));
    expect(dispatchMock).toHaveBeenCalledWith(setTransactionActive('2', true));
  });

  it('should unfocus the confirmation when window is not focused', () => {
    const { rerender } = renderHook(() => useTransactionFocusEffect());

    useWindowFocusMock.mockReturnValue(false);

    rerender();

    expect(dispatchMock).toHaveBeenCalledWith(setTransactionActive('1', false));
  });

  describe('when confirmation type is not valid', () => {
    it('should not focus transaction initially', () => {
      useUnapprovedTransactionMock.mockReturnValue(undefined);
      renderHook(() => useTransactionFocusEffect());
      expect(dispatchMock).not.toHaveBeenCalled();
    });

    it('should unfocus the previous transaction', () => {
      const { rerender } = renderHook(() => useTransactionFocusEffect());

      useUnapprovedTransactionMock.mockReturnValue(undefined);

      rerender();

      expect(dispatchMock).toHaveBeenCalledWith(
        setTransactionActive('1', false),
      );
      expect(dispatchMock).toHaveBeenCalledWith(
        setTransactionActive('2', true),
      );
    });
  });
});
