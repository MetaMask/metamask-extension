import { TransactionType } from '@metamask/transaction-controller';
import { renderHook } from '@testing-library/react-hooks';
import { useDispatch } from 'react-redux';
import { useConfirmContext } from '../context/confirm';
import { useWindowFocus } from '../../../hooks/useWindowFocus';
import { updateTransactionFocus } from '../../../store/actions';
import { type Confirmation } from '../types/confirm';
import { useTransactionFocusEffect } from './useTransactionFocusEffect';

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: jest.fn(),
}));

jest.mock('../context/confirm', () => ({
  useConfirmContext: jest.fn(),
}));

jest.mock('../../../hooks/useWindowFocus', () => ({
  useWindowFocus: jest.fn(),
}));

jest.mock('../../../store/actions', () => ({
  updateTransactionFocus: jest.fn(),
}));

const mockConfirmation: Confirmation = {
  id: '1',
  type: TransactionType.simpleSend,
};

const confirmContextMock = {
  currentConfirmation: mockConfirmation,
  isScrollToBottomCompleted: false,
  setIsScrollToBottomCompleted: jest.fn(),
};

describe('useTransactionFocusEffect', () => {
  const dispatchMock = jest.fn();
  const updateTransactionFocusMock =
    updateTransactionFocus as jest.MockedFunction<
      typeof updateTransactionFocus
    >;
  const useConfirmContextMock = useConfirmContext as jest.MockedFunction<
    typeof useConfirmContext
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
    useConfirmContextMock.mockReturnValue(confirmContextMock);

    updateTransactionFocusMock.mockClear();
    dispatchMock.mockClear();
  });

  it('should focus the confirmation when window is focused and type is valid', () => {
    renderHook(() => useTransactionFocusEffect());

    expect(dispatchMock).toHaveBeenCalledWith(
      updateTransactionFocus('1', true),
    );
  });

  it('should focus new confirmation if previous confirmation is different', () => {
    const { rerender } = renderHook(() => useTransactionFocusEffect());

    const simpleSendConfirmation = {
      id: '2',
      type: TransactionType.simpleSend,
    };

    useConfirmContextMock.mockReturnValue({
      ...confirmContextMock,
      currentConfirmation: simpleSendConfirmation,
    });

    rerender();

    expect(dispatchMock).toHaveBeenCalledWith(
      updateTransactionFocus('1', false),
    );
    expect(dispatchMock).toHaveBeenCalledWith(
      updateTransactionFocus('2', true),
    );
  });

  it('should unfocus the confirmation when window is not focused', () => {
    const { rerender } = renderHook(() => useTransactionFocusEffect());

    useWindowFocusMock.mockReturnValue(false);

    rerender();

    expect(dispatchMock).toHaveBeenCalledWith(
      updateTransactionFocus('1', false),
    );
  });

  describe('when confirmation type is not valid', () => {
    it('should not focus transaction initially', () => {
      const signatureConfirmation = {
        id: '2',
        type: TransactionType.signTypedData,
      };

      useConfirmContextMock.mockReturnValue({
        ...confirmContextMock,
        currentConfirmation: signatureConfirmation,
      });
      renderHook(() => useTransactionFocusEffect());
      expect(dispatchMock).not.toHaveBeenCalled();
    });

    it('should unfocus the previous transaction', () => {
      const { rerender } = renderHook(() => useTransactionFocusEffect());

      const signatureConfirmation = {
        id: '2',
        type: TransactionType.signTypedData,
      };

      useConfirmContextMock.mockReturnValue({
        ...confirmContextMock,
        currentConfirmation: signatureConfirmation,
      });

      rerender();

      expect(dispatchMock).toHaveBeenCalledWith(
        updateTransactionFocus('1', false),
      );
      expect(dispatchMock).toHaveBeenCalledWith(
        updateTransactionFocus('2', true),
      );
    });
  });
});
